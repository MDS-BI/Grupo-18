import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  calcularPeriodo,
  listLiquidacionesPeriodo
} from '../../src/rrhh/utils/liquidacion-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import {
  agregarParametro,
  parametrosVigentes,
  resetSeedFlag
} from '../../src/rrhh/utils/parametros-service.js';
import { resolverParametro } from '../../src/rrhh/calculo/parametros.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const admin = { role: 'administrador', usuario: 'Administrador' };

const trabajador = {
  entity_id: 'trab-parametros',
  name: 'Trabajador Parametros',
  taxId: '12.345.678-5'
};

const contrato = {
  id: 'contrato-parametros',
  entity_id: 'trab-parametros',
  estado: 'vigente',
  sueldoBase: 1200000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 0,
  asignacionMovilizacion: 0
};

let dom;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  resetSeedFlag();
  abrirPeriodo('2026-08', admin);
  abrirPeriodo('2026-09', admin);
});

afterEach(() => {
  dom.window.close();
});

function calculate(periodo) {
  return calcularPeriodo({
    periodo,
    trabajadores: [trabajador],
    contratos: [contrato],
    viewer: analista
  }).liquidaciones[0];
}

function gratificacion(liquidacion) {
  return liquidacion.lineas.find((line) => line.concepto === 'Gratificación legal');
}

describe('US15 - versioned legal parameters by validity date', () => {
  it('resolves each parameter version against the requested date', () => {
    expect(parametrosVigentes('2026-08-31').IMM.valor).toBe(553553);
    expect(parametrosVigentes('2026-09-01').IMM.valor).toBe(553553);
    expect(parametrosVigentes('2026-08-31').APORTE_EMP_PREVISIONAL.valor).toBe(3.5);
    expect(parametrosVigentes('2026-07-31').APORTE_EMP_PREVISIONAL).toBeUndefined();

    agregarParametro({
      codigo: 'IMM',
      descripcion: 'Ingreso minimo mensual revisado',
      valor: 600000,
      unidad: 'CLP',
      vigenciaDesde: '2026-09-01',
      fuente: 'Ley de prueba'
    });

    expect(parametrosVigentes('2026-08-31').IMM.valor).toBe(553553);
    expect(parametrosVigentes('2026-09-01').IMM.valor).toBe(600000);
    expect(parametrosVigentes('2026-09-30').IMM.valor).toBe(600000);
    expect(
      resolverParametro('IMM', '2026-08-31', [
        { codigo: 'IMM', valor: 1, vigenciaDesde: '2026-09-01' }
      ])
    ).toBeNull();
  });

  it('applies a validity change only to later periods', () => {
    const augustBefore = calculate('2026-08');
    const septemberBefore = calculate('2026-09');
    expect(gratificacion(augustBefore).monto).toBe(219115);
    expect(gratificacion(septemberBefore).monto).toBe(219115);

    agregarParametro({
      codigo: 'IMM',
      descripcion: 'Ingreso minimo mensual revisado',
      valor: 600000,
      unidad: 'CLP',
      vigenciaDesde: '2026-09-01',
      fuente: 'Ley de prueba'
    });

    const augustAfter = calculate('2026-08');
    const septemberAfter = calculate('2026-09');

    expect(gratificacion(augustAfter).monto).toBe(219115);
    expect(gratificacion(septemberAfter).monto).toBe(237500);
    expect(augustAfter.lineas.find((line) => line.concepto === 'Gratificación legal').monto).toBe(
      219115
    );
    expect(
      septemberAfter.lineas.find((line) => line.concepto === 'Gratificación legal').monto
    ).toBe(237500);
    expect(augustAfter.totales).toEqual(augustBefore.totales);
    expect(augustAfter.lineas.map((line) => [line.concepto, line.monto])).toEqual(
      augustBefore.lineas.map((line) => [line.concepto, line.monto])
    );
  });

  it('keeps the stored snapshot of an earlier period untouched', () => {
    const august = calculate('2026-08');
    const augustSnapshot = JSON.stringify(august);
    calculate('2026-09');

    agregarParametro({
      codigo: 'IMM',
      descripcion: 'Ingreso minimo mensual revisado',
      valor: 600000,
      unidad: 'CLP',
      vigenciaDesde: '2026-09-01',
      fuente: 'Ley de prueba'
    });
    calculate('2026-09');

    const storedAugust = listLiquidacionesPeriodo('2026-08')[0];
    expect(JSON.stringify(storedAugust)).toBe(augustSnapshot);
    expect(gratificacion(storedAugust).monto).toBe(219115);
  });

  it('does not leak later parameter versions into earlier periods', () => {
    agregarParametro({
      codigo: 'UTM',
      descripcion: 'UTM revisada',
      valor: 75000,
      unidad: 'CLP',
      vigenciaDesde: '2026-10-01',
      fuente: 'SII de prueba'
    });

    const september = calculate('2026-09');
    expect(parametrosVigentes('2026-09-30').UTM.valor).toBe(71649);
    expect(parametrosVigentes('2026-10-01').UTM.valor).toBe(75000);
    expect(september.impuesto).toBe(7363);
  });

  it('rejects incomplete parameter versions', () => {
    expect(() => agregarParametro({ codigo: 'IMM' })).toThrow(/vigencia/i);
    expect(() => agregarParametro({ vigenciaDesde: '2026-10-01' })).toThrow(/c.digo/i);
  });
});
