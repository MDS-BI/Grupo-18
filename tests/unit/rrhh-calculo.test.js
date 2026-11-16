import { describe, it, expect } from 'vitest';
import {
  calcularGratificacion,
  calcularImpuestoUnico,
  calcularLiquidacionTrabajador,
  calcularSueldoProporcional,
  calcularValorHoraExtra,
  redondearPeso
} from '../../src/rrhh/calculo/motor.js';
import { PARAMETROS_INICIALES } from '../../src/rrhh/calculo/parametros.js';

const contrato = {
  id: 'contrato-1',
  sueldoBase: 1200000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 40000,
  asignacionMovilizacion: 50000
};

const trabajador = { id: 'trab-1', entityId: 'trab-1', nombre: 'Trabajador de Prueba' };
const periodo = { id: '2026-09', etiqueta: 'Septiembre 2026', fechaFin: '2026-09-30' };

function novedad(id, tipo, cantidad, estado = 'aprobada') {
  return {
    id,
    trabajadorEntityId: 'trab-1',
    periodo: '2026-09',
    tipo,
    cantidad,
    estado,
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-30'
  };
}

describe('US15 - pure payroll engine', () => {
  it('rounds every line to the peso', () => {
    expect(redondearPeso(10.4)).toBe(10);
    expect(redondearPeso(10.5)).toBe(11);
    expect(redondearPeso(-0.4)).toBe(0);
    expect(redondearPeso('no-numero')).toBe(0);
  });

  it('calculates proportional salary over a 30-day month', () => {
    expect(calcularSueldoProporcional(1200000, 30)).toBe(1200000);
    expect(calcularSueldoProporcional(1200000, 15)).toBe(600000);
    expect(calcularSueldoProporcional(1200000, 0)).toBe(0);
    expect(calcularSueldoProporcional(1200000, 45)).toBe(1200000);
  });

  it('calculates the overtime hour value with a 50% surcharge', () => {
    expect(calcularValorHoraExtra({ sueldoBase: 1200000, jornadaHorasSemanales: 42 })).toBe(10000);
    expect(
      calcularValorHoraExtra({ sueldoBase: 600000, jornadaHorasSemanales: 42, recargo: 1.5 })
    ).toBe(5000);
  });

  it('applies the legal gratification cap of 4.75 IMM / 12', () => {
    const capped = calcularGratificacion({ base: 1200000, ingresoMinimo: 553553 });
    expect(capped.monto).toBe(219115);
    expect(capped.tope).toBe(219115);
    expect(capped.porcentaje).toBe(300000);

    const proportional = calcularGratificacion({ base: 400000, ingresoMinimo: 553553 });
    expect(proportional.monto).toBe(100000);
  });

  it('calculates the single tax by UTM bracket', () => {
    const tax = calcularImpuestoUnico({ baseTributable: 1191893, utm: 71649 });
    expect(tax.monto).toBe(8985);
    expect(tax.tramo.id).toBe('tramo-2');
    expect(calcularImpuestoUnico({ baseTributable: 0, utm: 71649 }).monto).toBe(0);
    expect(calcularImpuestoUnico({ baseTributable: 100000, utm: 0 }).monto).toBe(0);
  });

  it('calculates salary, overtime, gratification, non-taxable items and contributions', () => {
    const result = calcularLiquidacionTrabajador({
      trabajador,
      contrato,
      novedades: [novedad('n1', 'horas_extra', 5)],
      periodo,
      parametros: PARAMETROS_INICIALES
    });

    expect(result.bases.sueldoBase).toBe(1200000);
    expect(result.bases.horasExtra).toBe(5);
    expect(result.bases.valorHoraExtra).toBe(10000);
    expect(result.bases.imponible).toBe(1469115);
    expect(result.bases.noImponible).toBe(90000);
    expect(result.bases.tributable).toBe(1191893);
    expect(result.descuentos.afp).toBe(165569);
    expect(result.descuentos.salud).toBe(102838);
    expect(result.descuentos.afc).toBe(8815);
    expect(result.impuesto).toBe(8985);
    expect(result.totales.haberes).toBe(1559115);
    expect(result.totales.descuentos).toBe(277222);
    expect(result.totales.impuestos).toBe(8985);
    expect(result.totales.liquido).toBe(1272908);
    expect(result.totalAportesEmpleador).toBe(100341);
    expect(result.costoEmpleador).toBe(1659456);
  });

  it('uses only approved novedades and excludes medical/absence days', () => {
    const result = calcularLiquidacionTrabajador({
      trabajador,
      contrato,
      novedades: [
        novedad('n1', 'horas_extra', 5, 'aprobada'),
        novedad('n2', 'horas_extra', 5, 'pendiente'),
        novedad('n3', 'horas_extra', 5, 'rechazada'),
        novedad('n4', 'licencia_medica', 2, 'aprobada'),
        novedad('n5', 'ausencia', 1, 'aprobada')
      ],
      periodo,
      parametros: PARAMETROS_INICIALES
    });

    expect(result.bases.horasExtra).toBe(5);
    expect(result.bases.diasTrabajados).toBe(27);
    expect(result.bases.diasNoTrabajados).toBe(3);
    expect(result.novedadesAplicadas).toEqual(['n1', 'n4', 'n5']);
    expect(result.bases.sueldoProporcional).toBe(1080000);
  });

  it('caps voluntary discounts at 15% of haberes', () => {
    const result = calcularLiquidacionTrabajador({
      trabajador,
      contrato,
      novedades: [],
      periodo,
      parametros: PARAMETROS_INICIALES,
      descuentosVoluntarios: [{ monto: 1000000 }]
    });
    const cap = Math.round(result.totales.haberes * 0.15);
    expect(result.descuentos.voluntarios).toBe(cap);
    expect(result.descuentos.voluntarios).toBeLessThan(1000000);
    expect(result.advertencias.join(' ')).toMatch(/15%/);
  });

  it('prints totals from the already-rounded lines', () => {
    const result = calcularLiquidacionTrabajador({
      trabajador,
      contrato,
      novedades: [novedad('n1', 'horas_extra', 5)],
      periodo,
      parametros: PARAMETROS_INICIALES
    });
    const haberes = result.lineas
      .filter((line) => line.tipo === 'haber')
      .reduce((total, line) => total + line.monto, 0);
    const descuentos = result.lineas
      .filter((line) => line.tipo === 'descuento')
      .reduce((total, line) => total + line.monto, 0);
    const impuestos = result.lineas
      .filter((line) => line.tipo === 'impuesto')
      .reduce((total, line) => total + line.monto, 0);

    expect(result.totales.haberes).toBe(haberes);
    expect(result.totales.descuentos).toBe(descuentos);
    expect(result.totales.impuestos).toBe(impuestos);
    expect(result.totales.liquido).toBe(haberes - descuentos - impuestos);
    for (const line of result.lineas) {
      expect(Number.isInteger(line.monto)).toBe(true);
    }
  });
});
