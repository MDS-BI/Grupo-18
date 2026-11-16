import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  calcularPeriodo,
  cambiarEstadoLiquidacion,
  listLiquidacionesPeriodo,
  saveLiquidacion
} from '../../src/rrhh/utils/liquidacion-service.js';
import {
  PeriodoCerradoError,
  abrirPeriodo,
  cerrarPeriodo,
  getPeriodo,
  isPeriodoCerrado
} from '../../src/rrhh/utils/periodos-service.js';
import { agregarParametro } from '../../src/rrhh/utils/parametros-service.js';
import { crearPeriodo } from '../../src/rrhh/utils/periodos.js';

const admin = { role: 'administrador', usuario: 'Administrador' };
const jefatura = { role: 'jefatura', usuario: 'Jefatura RRHH' };
const analista = { role: 'analista', usuario: 'Analista RRHH' };

const trabajador = {
  entity_id: 'trab-cierre',
  name: 'Trabajador Cierre',
  taxId: '12.345.678-5',
  cargo: 'Analista',
  centroCosto: 'Administracion'
};

const contrato = {
  id: 'contrato-cierre',
  entity_id: 'trab-cierre',
  estado: 'vigente',
  sueldoBase: 1200000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 40000,
  asignacionMovilizacion: 50000
};

let dom;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  abrirPeriodo('2026-08', admin);
  abrirPeriodo('2026-09', admin);
});

afterEach(() => {
  dom.window.close();
});

function calculate(periodo = '2026-09', extra = {}) {
  return calcularPeriodo({
    periodo,
    trabajadores: [trabajador],
    contratos: [contrato],
    viewer: analista,
    ...extra
  });
}

describe('US15 - period closure, frozen values and read-only history', () => {
  it('freezes UF, UTM, IMM and the complete legal parameter snapshot', () => {
    abrirPeriodo('2026-09', jefatura);
    const closed = cerrarPeriodo('2026-09', jefatura);

    expect(closed.estado).toBe('cerrado');
    expect(closed.cerradoPor).toBe('Jefatura RRHH');
    expect(closed.cerradoPorRol).toBe('jefatura');
    expect(closed.valorUF).toBe(39500);
    expect(closed.valorUTM).toBe(71649);
    expect(closed.ingresoMinimo).toBe(553553);
    expect(closed.parametrosCongelados).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ codigo: 'UF', valorAplicado: 39500 }),
        expect.objectContaining({ codigo: 'UTM', valorAplicado: 71649 }),
        expect.objectContaining({ codigo: 'IMM', valorAplicado: 553553 }),
        expect.objectContaining({ codigo: 'TASA_AFP_TRABAJADOR' }),
        expect.objectContaining({ codigo: 'TASA_SALUD_LEGAL' }),
        expect.objectContaining({ codigo: 'TASA_AFC_TRAB_INDEF' }),
        expect.objectContaining({ codigo: 'APORTE_EMP_PREVISIONAL' }),
        expect.objectContaining({ codigo: 'MUTUAL' })
      ])
    );
    expect(isPeriodoCerrado('2026-09')).toBe(true);
    expect(getPeriodo('2026-09').estado).toBe('cerrado');
  });

  it('blocks recalculation and state changes after closing', () => {
    const result = calculate();
    expect(result.liquidaciones).toHaveLength(1);
    const id = result.liquidaciones[0].id;

    cerrarPeriodo('2026-09', jefatura);

    expect(() => calculate()).toThrow(PeriodoCerradoError);
    expect(() => cambiarEstadoLiquidacion(id, 'aprobada', { viewer: admin })).toThrow(
      /cerrado/i
    );
    expect(listLiquidacionesPeriodo('2026-09')).toHaveLength(1);
    expect(listLiquidacionesPeriodo('2026-09')[0].estado).toBe('calculada');
  });

  it('keeps existing liquidations unchanged after closing and adding parameters', () => {
    const before = calculate().liquidaciones[0];
    cerrarPeriodo('2026-09', jefatura);
    const afterClose = listLiquidacionesPeriodo('2026-09')[0];

    agregarParametro({
      codigo: 'IMM',
      descripcion: 'Ingreso minimo mensual posterior',
      valor: 600000,
      unidad: 'CLP',
      vigenciaDesde: '2026-09-01',
      fuente: 'Ley futura'
    });
    agregarParametro({
      codigo: 'UTM',
      descripcion: 'UTM posterior',
      valor: 75000,
      unidad: 'CLP',
      vigenciaDesde: '2026-09-01',
      fuente: 'SII'
    });

    expect(JSON.stringify(afterClose)).toBe(JSON.stringify(before));
    expect(getPeriodo('2026-09').ingresoMinimo).toBe(553553);
    expect(getPeriodo('2026-09').valorUTM).toBe(71649);
    expect(getPeriodo('2026-09').estado).toBe('cerrado');
  });

  it('does not allow a closed period to be reopened or recalculated', () => {
    cerrarPeriodo('2026-09', jefatura);
    expect(() => abrirPeriodo('2026-09', jefatura)).toThrow(/reabrir/i);
  });

  it('rejects closing a period that is already closed', () => {
    cerrarPeriodo('2026-09', jefatura);
    expect(() => cerrarPeriodo('2026-09', jefatura)).toThrow(PeriodoCerradoError);
  });

  it('rejects an invalid period record before saving', () => {
    expect(() => saveLiquidacion({ id: 'x' })).toThrow(/inv.lida/i);
    expect(() => cerrarPeriodo('2026-13', jefatura)).toThrow();
    expect(crearPeriodo({ id: '2026-09' }).estado).toBe('abierto');
  });
});
