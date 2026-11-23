import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { addEntity } from '../../src/storage.js';
import { createDemoLiquidacion } from '../../src/rrhh/utils/liquidacion-data.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';
import { renderPlanillaView } from '../../src/rrhh/views/planilla.js';
import { RrhhWorkspace } from '../../src/rrhh/views/workspace.js';
import {
  anularLiquidacion,
  aprobarLiquidacion,
  calcularPeriodo,
  cambiarEstadoLiquidacion,
  getLiquidacion,
  listLiquidacionesPeriodo,
  loadLiquidacion,
  pagarLiquidacion,
  saveLiquidacion
} from '../../src/rrhh/utils/liquidacion-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { renderLiquidacionesView } from '../../src/rrhh/views/liquidaciones.js';
import { listAuditoria } from '../../src/rrhh/seguridad/auditoria.js';

const admin = { role: 'administrador', usuario: 'Administrador RRHH' };
const gerencia = { role: 'gerencia', usuario: 'Gerencia General' };
const analista = { role: 'analista', usuario: 'Analista RRHH' };

const trabajador = {
  entity_id: 'trab-ciclo',
  name: 'Trabajador Ciclo',
  taxId: '12.345.678-5'
};

const contrato = {
  id: 'contrato-ciclo',
  entity_id: 'trab-ciclo',
  estado: 'vigente',
  sueldoBase: 1000000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 0,
  asignacionMovilizacion: 0
};

let dom;
let root;

function calculate(periodo = '2026-09') {
  return calcularPeriodo({
    periodo,
    trabajadores: [trabajador],
    contratos: [contrato],
    viewer: analista
  }).liquidaciones[0];
}

function click(node) {
  node.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function setValue(id, value) {
  const node = document.getElementById(id);
  node.value = value;
  node.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

function setupPlanillaData(overrides = {}) {
  const entity = addEntity({
    name: 'Ana Torres',
    code: 'TR-001',
    taxId: '12.345.678-5',
    cargo: 'Analista',
    ...overrides
  });
  crearContrato(
    {
      entityId: entity.entity_id,
      tipoContrato: 'indefinido',
      sueldoBase: 1000000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2026-01-01',
      modalidadGratificacion: 'art50'
    },
    admin
  );
  return entity;
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  abrirPeriodo('2026-09', admin);
  abrirPeriodo('2026-10', admin);
  root = document.getElementById('root');
});

afterEach(() => {
  dom.window.close();
});

describe('US15 - liquidation approval, payment, annulment and traceability', () => {
  it('approves and pays a calculated liquidation with actor and timestamps', () => {
    const liquidation = calculate();
    expect(liquidation.estado).toBe('calculada');
    expect(liquidation.aprobadoPor).toBeUndefined();

    const approved = aprobarLiquidacion(liquidation.id, gerencia);

    expect(approved.estado).toBe('aprobada');
    expect(approved.aprobadoPor).toBe('Gerencia General');
    expect(Number.isNaN(Date.parse(approved.fechaAprobacion))).toBe(false);

    const paid = pagarLiquidacion(liquidation.id, admin, '2026-10-05');

    expect(paid.estado).toBe('pagada');
    expect(paid.pagadoPor).toBe('Administrador RRHH');
    expect(Number.isNaN(Date.parse(paid.fechaPago))).toBe(false);
    expect(getLiquidacion(liquidation.id).estado).toBe('pagada');
  });

  it('rejects invalid transitions', () => {
    const liquidation = calculate();
    expect(() => pagarLiquidacion(liquidation.id, admin)).toThrow(/pagada|transici/i);
    aprobarLiquidacion(liquidation.id, gerencia);
    expect(() => cambiarEstadoLiquidacion(liquidation.id, 'borrador', { viewer: admin })).toThrow(
      /borrador|aprobada|transici/i
    );
    pagarLiquidacion(liquidation.id, admin);
    expect(() => aprobarLiquidacion(liquidation.id, gerencia)).toThrow(/pagada|transici/i);
  });

  it('annuls a calculated liquidation with a mandatory motive', () => {
    const liquidation = calculate('2026-10');
    expect(() => anularLiquidacion(liquidation.id, admin, '')).toThrow(/motivo/i);

    const annulled = anularLiquidacion(liquidation.id, admin, 'Error en el periodo');

    expect(annulled.estado).toBe('anulada');
    expect(annulled.anuladoPor).toBe('Administrador RRHH');
    expect(annulled.motivoAnulacion).toBe('Error en el periodo');
    expect(() => pagarLiquidacion(liquidation.id, admin)).toThrow(/anulada|transici/i);
  });

  it('records user, role and action for every lifecycle change and sensitive read', () => {
    const liquidation = calculate();
    aprobarLiquidacion(liquidation.id, gerencia);
    pagarLiquidacion(liquidation.id, admin);
    loadLiquidacion(liquidation.id, { role: 'auditor', usuario: 'Auditora Interna' });

    const rows = listAuditoria({ tabla: 'liquidaciones' });
    const actions = rows.map((row) => row.accion);
    expect(actions).toEqual(
      expect.arrayContaining(['calcular', 'aprobar', 'pagar', 'ver_sensible'])
    );

    const approval = rows.find((row) => row.accion === 'aprobar');
    expect(approval.usuario).toBe('Gerencia General');
    expect(approval.rol).toBe('gerencia');
    expect(approval.registroId).toBe(liquidation.id);
    expect(Number.isNaN(Date.parse(approval.fecha))).toBe(false);

    const read = rows.find((row) => row.accion === 'ver_sensible');
    expect(read.usuario).toBe('Auditora Interna');
    expect(read.rol).toBe('auditor');
    expect(read.registroId).toBe(liquidation.id);
  });

  it('drives the same lifecycle from the liquidation view', () => {
    calculate();
    renderLiquidacionesView(root, {
      doc: document,
      viewer: admin,
      initialPeriodo: '2026-09',
      config: { empresa: { nombre: 'Empresa Demo', rut: '76.123.456-7' } }
    });

    expect(document.getElementById('liquidaciones-list')).not.toBeNull();
    expect(document.getElementById('liq-approve')).toBeNull();
    click(
      [...document.querySelectorAll('#liquidaciones-list button')].find(
        (button) => button.textContent === 'Ver liquidación'
      )
    );
    expect(document.getElementById('liq-approve')).not.toBeNull();
    click(document.getElementById('liq-approve'));

    expect(document.getElementById('liquidaciones-feedback').textContent).toMatch(/aprobada/i);
    expect(listLiquidacionesPeriodo('2026-09')[0].estado).toBe('aprobada');
    expect(document.getElementById('liq-pay')).not.toBeNull();

    click(document.getElementById('liq-pay'));
    expect(document.getElementById('liquidaciones-feedback').textContent).toMatch(/pagada/i);
    expect(listLiquidacionesPeriodo('2026-09')[0].estado).toBe('pagada');
  });
});

describe('UI de cálculo de planilla', () => {
  it('mantiene resultados y feedback en Planilla y no navega automáticamente tras calcular', () => {
    setupPlanillaData();
    const onNavigate = vi.fn();
    renderPlanillaView(root, { doc: document, viewer: analista, onNavigate });
    setValue('planilla-periodo', '2026-09');
    click(document.getElementById('planilla-calcular'));

    expect(document.getElementById('planilla-feedback').textContent).toMatch(/Planilla calculada/);
    expect(document.getElementById('planilla-resultados')).not.toBeNull();
    expect(document.getElementById('planilla-ir-liquidaciones').hidden).toBe(false);
    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('navega a Liquidaciones solo al pulsar el botón explícito con el período elegido', () => {
    setupPlanillaData();
    const onNavigate = vi.fn();
    renderPlanillaView(root, { doc: document, viewer: analista, onNavigate });
    setValue('planilla-periodo', '2026-09');
    click(document.getElementById('planilla-calcular'));
    expect(onNavigate).not.toHaveBeenCalled();

    click(document.getElementById('planilla-ir-liquidaciones'));
    expect(onNavigate).toHaveBeenCalledWith('liquidaciones', { periodo: '2026-09' });
  });

  it('entrega pendingPayload como initialPeriodo al renderer de Liquidaciones', () => {
    setupPlanillaData();
    root.innerHTML = `
      <button data-rrhh-tab="planilla" role="tab">Planilla</button>
      <button data-rrhh-tab="liquidaciones" role="tab">Liquidaciones</button>
      <div id="rrhh-panel-planilla" hidden></div>
      <div id="rrhh-panel-liquidaciones" hidden><div id="rrhh-liquidacion-root"></div></div>
    `;

    const workspace = new RrhhWorkspace({
      doc: document,
      config: { rrhh: { enabled: true } },
      viewer: admin,
      initialTab: 'planilla'
    });
    try {
      setValue('planilla-periodo', '2026-09');
      click(document.getElementById('planilla-calcular'));
      click(document.getElementById('planilla-ir-liquidaciones'));

      expect(document.getElementById('rrhh-panel-liquidaciones').hidden).toBe(false);
      expect(document.getElementById('liquidaciones-periodo').value).toBe('2026-09');
    } finally {
      workspace.dispose();
    }
  });

  it('usa grilla de 5 columnas y paginador en Planilla', () => {
    const css = readFileSync(
      fileURLToPath(new URL('../../src/styles.css', import.meta.url)),
      'utf8'
    );
    const rule = css.match(/\.rrhh-table-cols-5\s+\.rrhh-table-row\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    const tracks = rule[1]
      .match(/grid-template-columns:\s*([^;]+);/)?.[1]
      .trim()
      .split(/\s+/);
    expect(tracks).toHaveLength(5);
    expect(tracks.every((track) => /^\d+(\.\d+)?fr$/.test(track))).toBe(true);
    setupPlanillaData();
    renderPlanillaView(root, { doc: document, viewer: analista });
    setValue('planilla-periodo', '2026-09');
    click(document.getElementById('planilla-calcular'));

    const list = document.getElementById('planilla-resultados');
    expect(list.classList.contains('rrhh-table-cols-5')).toBe(true);
    const rows = list.querySelectorAll('[data-liquidacion-id]');
    expect(rows).toHaveLength(1);
    const nav = document.getElementById('planilla-pagination');
    expect(nav.querySelector('.rrhh-pagination-status').textContent).toBe(
      `Página 1 de 1 · ${rows.length} registro(s)`
    );
    const previous = [...nav.querySelectorAll('button')].find(
      (button) => button.textContent === 'Anterior'
    );
    expect(previous.disabled).toBe(true);
    expect(previous.type).toBe('button');
  });

  it('pagina Liquidaciones a 25 y conserva el foco al paginar y filtrar', () => {
    const demo = createDemoLiquidacion();
    for (let index = 0; index < 30; index += 1) {
      saveLiquidacion({
        ...demo,
        id: `liq-pag-${index}`,
        numero: `LIQ-PAG-${index}`,
        trabajador: {
          ...demo.trabajador,
          id: `trab-pag-${index}`,
          nombre: `Trabajador ${index}`
        },
        periodo: { ...demo.periodo, id: '2026-09', periodo: '2026-09' }
      });
    }
    renderLiquidacionesView(root, { doc: document, viewer: admin });

    const nav = document.getElementById('liquidaciones-pagination');
    const buttonByLabel = (label) =>
      [...nav.querySelectorAll('button')].find((button) => button.textContent === label);
    const status = () => nav.querySelector('.rrhh-pagination-status');
    expect(status().textContent).toBe('Página 1 de 2 · 30 registro(s)');
    expect(nav.getAttribute('aria-label')).toBe('Paginación de resultados');
    expect(status().getAttribute('aria-live')).toBe('polite');
    expect(buttonByLabel('Anterior').disabled).toBe(true);
    expect(document.querySelectorAll('#liquidaciones-list [data-liquidacion-id]')).toHaveLength(25);

    const next = buttonByLabel('Siguiente');
    next.focus();
    next.click();
    expect(document.querySelectorAll('#liquidaciones-list [data-liquidacion-id]')).toHaveLength(5);
    expect(status().textContent).toBe('Página 2 de 2 · 30 registro(s)');
    expect(document.activeElement).toBe(buttonByLabel('Anterior'));
    expect(document.activeElement.textContent).toBe('Anterior');

    const filter = document.getElementById('liquidaciones-periodo');
    filter.focus();
    setValue('liquidaciones-periodo', '');
    const recreatedFilter = document.getElementById('liquidaciones-periodo');
    expect(recreatedFilter).not.toBe(filter);
    expect(recreatedFilter.tagName).toBe('SELECT');
    expect(document.activeElement).toBe(recreatedFilter);
    expect(status().textContent).toBe('Página 1 de 2 · 30 registro(s)');
    expect(buttonByLabel('Anterior').disabled).toBe(true);
    expect(document.querySelectorAll('#liquidaciones-list [data-liquidacion-id]')).toHaveLength(25);
  });

  it('mantiene el detalle como hermano de la fila activa y lo reemplaza al elegir otra (T129)', () => {
    setupPlanillaData();
    setupPlanillaData({
      name: 'Luisa Medina',
      code: 'TR-002',
      taxId: '9.876.543-3',
      cargo: 'Técnica'
    });
    renderPlanillaView(root, { doc: document, viewer: analista });
    setValue('planilla-periodo', '2026-09');
    click(document.getElementById('planilla-calcular'));

    const rows = [...document.querySelectorAll('#planilla-resultados [data-liquidacion-id]')];
    expect(rows).toHaveLength(2);
    click(rows[0]);
    let detail = document.getElementById('planilla-liquidacion-detalle');
    expect(detail).not.toBeNull();
    expect(rows[0].nextElementSibling).toBe(detail);
    expect(rows[0].classList.contains('rrhh-table-row-selected')).toBe(true);

    click(rows[1]);
    detail = document.getElementById('planilla-liquidacion-detalle');
    expect(document.querySelectorAll('#planilla-liquidacion-detalle')).toHaveLength(1);
    expect(rows[1].nextElementSibling).toBe(detail);
    expect(rows[0].nextElementSibling).not.toBe(detail);
    expect(rows[0].classList.contains('rrhh-table-row-selected')).toBe(false);
    expect(rows[1].classList.contains('rrhh-table-row-selected')).toBe(true);
    expect(detail.textContent).toContain('Luisa Medina');
  });
});
