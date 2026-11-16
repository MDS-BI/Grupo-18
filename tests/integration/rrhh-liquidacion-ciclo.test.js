import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  anularLiquidacion,
  aprobarLiquidacion,
  calcularPeriodo,
  cambiarEstadoLiquidacion,
  getLiquidacion,
  listLiquidacionesPeriodo,
  loadLiquidacion,
  pagarLiquidacion
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
    expect(() =>
      cambiarEstadoLiquidacion(liquidation.id, 'borrador', { viewer: admin })
    ).toThrow(/borrador|aprobada|transici/i);
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
    expect(actions).toEqual(expect.arrayContaining(['calcular', 'aprobar', 'pagar', 'ver_sensible']));

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
