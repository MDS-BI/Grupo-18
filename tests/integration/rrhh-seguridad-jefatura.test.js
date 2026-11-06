import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import { renderNovedadesView } from '../../src/rrhh/views/novedades.js';
import { renderLiquidacionesView } from '../../src/rrhh/views/liquidaciones.js';
import { crearNovedad } from '../../src/rrhh/utils/novedades-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import {
  SENSITIVE_DATA,
  canAccessSensitive,
  canViewLiquidacion
} from '../../src/rrhh/seguridad/roles.js';
import { filterLiquidacionForViewer } from '../../src/rrhh/seguridad/acceso-datos.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const admin = { role: 'administrador', usuario: 'Administrador' };

let dom;
let root;
let workerA;
let workerB;

function novedad(worker, extra = {}) {
  return crearNovedad(
    {
      trabajadorEntityId: worker.entity_id,
      periodo: '2026-09',
      tipo: 'horas_extra',
      cantidad: 3,
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-03',
      ...extra
    },
    analista
  );
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
  workerA = addEntity({ name: 'Equipo A', code: 'EQ-A', rut: '12.345.678-5' });
  workerB = addEntity({ name: 'Equipo B', code: 'EQ-B', rut: '12.345.678-5' });
  novedad(workerA);
  novedad(workerB);
  root = document.getElementById('root');
});

afterEach(() => {
  dom.window.close();
});

describe('US6 - Jefatura scope and sensitive-data restrictions', () => {
  it('shows only the novedades of the Jefatura team', () => {
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura A', equipo: [workerA.entity_id] },
      initialPeriodo: '2026-09'
    });

    const list = document.getElementById('novedades-list');
    expect(list.textContent).toContain('Equipo A');
    expect(list.textContent).not.toContain('Equipo B');
    expect(document.getElementById('novedades-summary').textContent).toContain('1');
    expect(document.getElementById('novedades-team-scope')).not.toBeNull();
    expect(document.getElementById('novedades-eligibility').textContent).toMatch(/bloqueado/i);
  });

  it('does not let Jefatura access liquidations or salary data', () => {
    renderLiquidacionesView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura A', equipo: [workerA.entity_id] }
    });

    expect(document.getElementById('liquidaciones-access-denied')).not.toBeNull();
    expect(document.getElementById('liquidaciones-list')).toBeNull();
    expect(root.textContent).toMatch(/Acceso denegado/i);
    expect(root.textContent).not.toMatch(/\$|sueldo base|renta/i);
  });

  it('enforces the same restrictions at the data layer', () => {
    const jefatura = { role: 'jefatura', usuario: 'Jefatura A', equipo: [workerA.entity_id] };
    expect(canViewLiquidacion({ trabajador: { id: workerA.entity_id } }, jefatura)).toBe(false);
    expect(canAccessSensitive('jefatura', SENSITIVE_DATA.sueldos)).toBe(false);
    expect(canAccessSensitive('jefatura', SENSITIVE_DATA.liquidaciones)).toBe(false);
    expect(canAccessSensitive('jefatura', SENSITIVE_DATA.cuentas_bancarias)).toBe(false);
    expect(canAccessSensitive('jefatura', SENSITIVE_DATA.cuotas_sindicales)).toBe(false);

    const filtered = filterLiquidacionForViewer(
      {
        sueldoBase: 1200000,
        totalImponible: 1200000,
        trabajador: { id: workerA.entity_id, banco: 'Banco X', numeroCuenta: '123' },
        lineas: [{ id: 'l1', concepto: 'Sueldo', monto: 1200000 }]
      },
      jefatura
    );
    expect(filtered.sueldoBase).toBeNull();
    expect(filtered.totalImponible).toBeNull();
    expect(filtered.trabajador.banco).toBeUndefined();
    expect(filtered.trabajador.numeroCuenta).toBeUndefined();
  });

  it('does not expose hidden teams to Jefatura through the period selector', () => {
    const view = renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura A', equipo: [] },
      initialPeriodo: '2026-09'
    });
    expect(root.textContent).not.toContain('Equipo A');
    expect(root.textContent).not.toContain('Equipo B');
    expect(view.getPeriodo()).toBe('2026-09');
  });

  it('keeps the Jefatura role unable to calculate or approve liquidations', () => {
    const jefatura = { role: 'jefatura' };
    expect(canViewLiquidacion({ trabajador: { id: 'x' } }, jefatura)).toBe(false);
    expect(canAccessSensitive('analista', SENSITIVE_DATA.sueldos)).toBe(true);
    expect(canAccessSensitive('gerencia', SENSITIVE_DATA.sueldos)).toBe(false);
  });
});
