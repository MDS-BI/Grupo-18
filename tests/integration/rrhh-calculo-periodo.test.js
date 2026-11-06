import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  calcularPeriodo,
  listLiquidacionesPeriodo
} from '../../src/rrhh/utils/liquidacion-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { writeTable } from '../../src/rrhh/storage-rrhh.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };

let dom;

const trabajadorA = {
  entity_id: 'trab-a',
  name: 'Ana Lopez',
  taxId: '12.345.678-5',
  cargo: 'Analista',
  centroCosto: 'Administracion'
};
const trabajadorB = {
  entity_id: 'trab-b',
  name: 'Beto Silva',
  taxId: '12.345.678-5',
  cargo: 'Operario',
  centroCosto: 'Operaciones'
};

const contratoA = {
  id: 'contrato-a',
  entity_id: 'trab-a',
  estado: 'vigente',
  sueldoBase: 1000000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 0,
  asignacionMovilizacion: 0
};

function novedad(id, estado, extra = {}) {
  return {
    id,
    trabajadorEntityId: 'trab-a',
    periodo: '2026-09',
    tipo: 'horas_extra',
    cantidad: 5,
    unidad: 'horas',
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-05',
    estado,
    ...extra
  };
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  abrirPeriodo('2026-09', { role: 'administrador', usuario: 'Administrador' });
  writeTable('novedades', [
    novedad('nov-aprobada', 'aprobada'),
    novedad('nov-pendiente', 'pendiente', { cantidad: 2, fechaInicio: '2026-09-08', fechaFin: '2026-09-09' }),
    novedad('nov-rechazada', 'rechazada', { cantidad: 1, fechaInicio: '2026-09-10', fechaFin: '2026-09-10' })
  ]);
});

afterEach(() => {
  dom.window.close();
});

function calculate(extra = {}) {
  return calcularPeriodo({
    periodo: '2026-09',
    trabajadores: [trabajadorA, trabajadorB],
    contratos: [contratoA],
    viewer: analista,
    ...extra
  });
}

describe('US15 - payroll calculation for a period', () => {
  it('calculates one liquidation per worker with an active contract', () => {
    const result = calculate();

    expect(result.liquidaciones).toHaveLength(1);
    expect(result.liquidaciones[0].trabajador.entityId).toBe('trab-a');
    expect(result.liquidaciones[0].periodoId).toBe('2026-09');
    expect(result.liquidaciones[0].estado).toBe('calculada');
    expect(result.resumen.trabajadoresCalculados).toBe(1);
    expect(result.resumen.trabajadoresExcluidos).toBe(1);
    expect(result.trabajadoresExcluidos[0]).toMatchObject({
      entityId: 'trab-b',
      motivo: expect.stringMatching(/contrato/i)
    });
  });

  it('uses only approved novedades and warns about pending/rejected ones', () => {
    const result = calculate();
    const [liquidacion] = result.liquidaciones;

    expect(liquidacion.novedadesAplicadas).toEqual(['nov-aprobada']);
    expect(liquidacion.bases.horasExtra).toBe(5);
    expect(result.resumen.novedadesAprobadas).toBe(1);
    expect(result.resumen.novedadesPendientes).toBe(1);
    expect(result.resumen.novedadesRechazadas).toBe(1);
    expect(result.advertencias.join(' ')).toMatch(/pendiente/i);
    expect(result.advertencias.join(' ')).toMatch(/rechazada/i);
    expect(liquidacion.advertencias.join(' ')).toMatch(/pendiente/i);
  });

  it('replaces the previous calculation instead of duplicating it', () => {
    calculate();
    calculate();

    const stored = listLiquidacionesPeriodo('2026-09');
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('liq-2026-09-trab-a');
  });

  it('marks the period as calculated', () => {
    const result = calculate();
    expect(result.periodo.id).toBe('2026-09');
    const stored = JSON.parse(localStorage.getItem('erp_rrhh:periodos'));
    expect(stored.find((row) => row.id === '2026-09').estado).toBe('calculado');
  });

  it('denies calculation to roles without permission', () => {
    expect(() => calculate({ viewer: { role: 'jefatura' } })).toThrow(/permiso|puede calcular/i);
    expect(() => calculate({ viewer: { role: 'auditor' } })).toThrow(/permiso|puede calcular/i);
  });

  it('excludes workers whose contract is not vigente', () => {
    const result = calculate({
      contratos: [{ ...contratoA, estado: 'terminado' }]
    });
    expect(result.liquidaciones).toHaveLength(0);
    expect(result.trabajadoresExcluidos).toHaveLength(2);
  });

  it('rejects a calculation when a worker RUT is invalid', () => {
    expect(() =>
      calculate({
        trabajadores: [{ ...trabajadorA, taxId: '12.345.678-9' }]
      })
    ).toThrow(/RUT/i);
  });
});
