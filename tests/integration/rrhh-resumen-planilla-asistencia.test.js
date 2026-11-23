import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  actualizarTrabajador,
  crearTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { crearCatalogo } from '../../src/rrhh/utils/catalogos-service.js';
import { crearContrato, listContratos } from '../../src/rrhh/utils/contratos-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { crearNovedad, aprobarNovedad } from '../../src/rrhh/utils/novedades-service.js';
import { calcularPeriodo } from '../../src/rrhh/utils/liquidacion-service.js';
import { loadEntities } from '../../src/storage.js';
import { listAuditoria } from '../../src/rrhh/seguridad/auditoria.js';
import { metricasEquipo, metricasGenerales } from '../../src/rrhh/utils/resumen-metricas.js';
import {
  asistenciaCsv,
  consultarAsistencia,
  totalesAsistencia
} from '../../src/rrhh/utils/asistencia-registro.js';
import { renderResumenView } from '../../src/rrhh/views/resumen-view.js';
import { renderRegistroAsistencia } from '../../src/rrhh/components/registro-asistencia.js';
import { RrhhWorkspace } from '../../src/rrhh/views/workspace.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
const admin = { role: 'administrador', usuario: 'Administrador RRHH' };

let dom;
let jefe;
let ana;
let luis;

function contrato(entityId) {
  crearContrato(
    {
      entityId,
      tipoContrato: 'indefinido',
      sueldoBase: 900000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2026-01-01',
      modalidadGratificacion: 'art50'
    },
    admin
  );
}

function novedad(entityId, tipo, fechaInicio, cantidad, aprobar = true) {
  const created = crearNovedad(
    {
      trabajadorEntityId: entityId,
      periodo: fechaInicio.slice(0, 7),
      tipo,
      cantidad,
      fechaInicio,
      fechaFin: tipo === 'horas_extra' ? fechaInicio : fechaInicio,
      justificacion: 'Cierre de mes'
    },
    admin
  );
  const rows = Array.isArray(created) ? created : [created];
  if (aprobar) {
    for (const row of rows) {
      aprobarNovedad(row.id, { role: 'jefatura', usuario: 'Jefa', trabajadorId: jefe.entityId });
    }
  }
  return rows[0];
}

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  const ope = crearCatalogo(
    { tipo: 'departamento', codigo: 'OPE', nombre: 'Operaciones' },
    admin
  ).id;
  jefe = crearTrabajador(
    { name: 'Jefa Equipo', code: 'J-1', rut: '11.111.111-1', departamentoId: ope },
    admin
  );
  ana = crearTrabajador(
    { name: 'Ana Pérez', code: 'T-1', rut: '12.345.678-5', departamentoId: ope },
    admin
  );
  luis = crearTrabajador({ name: 'Luis Soto', code: 'T-2', rut: '22.222.222-2' }, admin);
  actualizarTrabajador(ana.entityId, { jefeId: jefe.entityId }, admin);
  for (const w of [jefe, ana, luis]) contrato(w.entityId);
  abrirPeriodo('2026-09', admin);
  abrirPeriodo('2026-10', admin);
  novedad(ana.entityId, 'horas_extra', '2026-09-10', 2);
  novedad(ana.entityId, 'ausencia', '2026-10-05', 1);
  novedad(luis.entityId, 'horas_extra', '2026-10-07', 1, false);
});

afterEach(() => {
  dom.window.close();
});

describe('Resumen - indicadores y gráficos', () => {
  it('calcula los indicadores generales y el costo por período', () => {
    calcularPeriodo({
      periodo: '2026-09',
      trabajadores: loadEntities(),
      contratos: listContratos(),
      viewer: admin
    });
    const { kpis, series } = metricasGenerales();
    expect(kpis.trabajadoresActivos).toBe(3);
    expect(kpis.novedadesPendientes).toBe(1);
    expect(kpis.costoUltimoPeriodo.periodo).toBe('2026-09');
    expect(series.costoPorPeriodo).toHaveLength(1);
    expect(series.dotacionPorDepartamento[0]).toEqual({ etiqueta: 'Operaciones', valor: 2 });
  });

  it('muestra KPI, gráficos con tooltip y vista de tabla al administrador', () => {
    document.body.innerHTML = renderResumenView({ viewer: admin });
    expect(document.getElementById('kpi-trabajadores').textContent).toContain('3');
    const barra = document.querySelector('#grafico-dotacion .rrhh-hbar');
    expect(barra.getAttribute('data-tooltip')).toContain('Operaciones: 2');
    expect(barra.getAttribute('tabindex')).toBe('0');
    expect(document.getElementById('grafico-dotacion-tabla')).not.toBeNull();
  });

  it('la jefatura ve solo indicadores de su equipo y sin montos', () => {
    const jefatura = { role: 'jefatura', usuario: 'Jefa', trabajadorId: jefe.entityId };
    const { kpis } = metricasEquipo(jefatura);
    expect(kpis.miembrosActivos).toBe(1);
    document.body.innerHTML = renderResumenView({ viewer: jefatura });
    expect(document.getElementById('kpi-costo')).toBeNull();
    expect(document.body.textContent).not.toContain('$');
  });
});

describe('Planilla y liquidaciones en una sola hoja', () => {
  it('muestra el cálculo y las liquidaciones en la misma pestaña', () => {
    expect(document.querySelector('[data-rrhh-tab="planilla"]')).toBeNull();
    const tab = document.querySelector('[data-rrhh-tab="liquidaciones"]');
    expect(tab.textContent).toBe('Planilla y liquidaciones');
    const ws = new RrhhWorkspace({ doc: document, viewer: admin, initialTab: 'planilla' });
    const panel = document.getElementById('rrhh-panel-liquidaciones');
    expect(panel.hidden).toBe(false);
    expect(panel.querySelector('#rrhh-planilla-seccion')).not.toBeNull();
    expect(panel.querySelector('#rrhh-liquidaciones-seccion')).not.toBeNull();
    ws.dispose();
  });

  it('el trabajador solo ve la sección de liquidaciones', () => {
    const ws = new RrhhWorkspace({
      doc: document,
      viewer: { role: 'trabajador', usuario: 'Ana', trabajadorId: ana.entityId },
      initialTab: 'liquidaciones'
    });
    const panel = document.getElementById('rrhh-panel-liquidaciones');
    expect(panel.querySelector('#rrhh-planilla-seccion')).toBeNull();
    expect(panel.querySelector('#rrhh-liquidaciones-seccion')).not.toBeNull();
    ws.dispose();
  });
});

describe('Asistencia - registro consultable', () => {
  it('consulta todo el historial con filtros y totales', () => {
    expect(consultarAsistencia({ viewer: admin })).toHaveLength(3);
    expect(consultarAsistencia({ viewer: admin, tipo: 'horas_extra' })).toHaveLength(2);
    expect(consultarAsistencia({ viewer: admin, estado: 'pendiente' })).toHaveLength(1);
    expect(consultarAsistencia({ viewer: admin, texto: 'luis' })).toHaveLength(1);
    expect(consultarAsistencia({ viewer: admin, desde: '2026-10-01' })).toHaveLength(2);
    const totales = totalesAsistencia(consultarAsistencia({ viewer: admin }));
    expect(totales).toMatchObject({ registros: 3, pendientes: 1, horasExtra: 2, diasAusencia: 1 });
  });

  it('limita la jefatura a su equipo y niega el acceso al trabajador', () => {
    const jefatura = { role: 'jefatura', usuario: 'Jefa', trabajadorId: jefe.entityId };
    expect(consultarAsistencia({ viewer: jefatura }).map((row) => row.trabajador)).toEqual([
      'Ana Pérez',
      'Ana Pérez'
    ]);
    expect(() => consultarAsistencia({ viewer: { role: 'trabajador' } })).toThrow(/no puede/);
  });

  it('exporta CSV compatible con Excel y lo registra en la bitácora', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    let exportado = '';
    renderRegistroAsistencia(root, {
      doc: document,
      viewer: admin,
      onExport: (_nombre, contenido) => {
        exportado = contenido;
      }
    });
    expect(document.querySelectorAll('#registro-tabla tbody tr')).toHaveLength(3);
    document.getElementById('registro-exportar').click();
    expect(exportado.startsWith('\uFEFFtrabajador;rut;periodo')).toBe(true);
    expect(exportado).toContain('Ana Pérez');
    expect(listAuditoria({ tabla: 'novedades' }).some((row) => row.accion === 'exportar')).toBe(
      true
    );
    expect(asistenciaCsv([]).split('\r\n')).toHaveLength(2);
  });
});
