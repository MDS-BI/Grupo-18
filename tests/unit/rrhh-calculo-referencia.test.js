import { describe, it, expect } from 'vitest';
import {
  calcularLiquidacionTrabajador,
  redondearPeso
} from '../../src/rrhh/calculo/motor.js';
import { PARAMETROS_INICIALES } from '../../src/rrhh/calculo/parametros.js';

const contrato = {
  id: 'contrato-referencia',
  sueldoBase: 1200000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 40000,
  asignacionMovilizacion: 50000
};

const trabajador = { id: 'trab-ref', entityId: 'trab-ref', nombre: 'Caso de Referencia' };
const periodo = { id: '2026-09', etiqueta: 'Septiembre 2026', fechaFin: '2026-09-30' };

const novedades = [
  {
    id: 'nov-ref-1',
    trabajadorEntityId: 'trab-ref',
    periodo: '2026-09',
    tipo: 'horas_extra',
    cantidad: 5,
    estado: 'aprobada',
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-05'
  }
];

function referencia() {
  return calcularLiquidacionTrabajador({
    trabajador,
    contrato,
    novedades,
    periodo,
    parametros: PARAMETROS_INICIALES
  });
}

describe('US15 - plan 002 reference case and line rounding', () => {
  it('matches the reference liquidation to the peso', () => {
    const result = referencia();

    expect(result.bases.sueldoBase).toBe(1200000);
    expect(result.bases.horasExtra).toBe(5);
    expect(result.bases.valorHoraExtra).toBe(10000);
    expect(result.bases.imponible).toBe(1469115);
    expect(result.bases.noImponible).toBe(90000);
    expect(result.bases.tributable).toBe(1191893);
    expect(result.totales.haberes).toBe(1559115);
    expect(result.totales.descuentos).toBe(277222);
    expect(result.totales.impuestos).toBe(8985);
    expect(result.totales.liquido).toBe(1272908);
    expect(result.totalAportesEmpleador).toBe(100341);
    expect(result.costoEmpleador).toBe(1659456);
  });

  it('reconciles employer contributions line by line', () => {
    const result = referencia();
    const afc = result.aportesEmpleador.find((row) => row.codigo === 'APORTE_EMP_AFC');
    const previsional = result.aportesEmpleador.find(
      (row) => row.codigo === 'APORTE_EMP_PREVISIONAL'
    );
    const mutual = result.aportesEmpleador.find((row) => row.codigo === 'APORTE_EMP_MUTUAL');

    expect(afc.monto).toBe(35259);
    expect(previsional.monto).toBe(51419);
    expect(mutual.monto).toBe(13663);
    expect(afc.monto + previsional.monto + mutual.monto).toBe(result.totalAportesEmpleador);
    expect(result.totales.haberes + result.totalAportesEmpleador).toBe(result.costoEmpleador);
  });

  it('uses half-up rounding for every line', () => {
    expect(redondearPeso(0.5)).toBe(1);
    expect(redondearPeso(1.5)).toBe(2);
    expect(redondearPeso(2.49)).toBe(2);
    expect(redondearPeso(-1.5)).toBe(-1);
  });

  it('calculates 200 workers in under one second', () => {
    const started = performance.now();
    for (let index = 0; index < 200; index += 1) {
      calcularLiquidacionTrabajador({
        trabajador: { ...trabajador, entityId: `trab-${index}` },
        contrato,
        novedades: novedades.map((row) => ({
          ...row,
          trabajadorEntityId: `trab-${index}`
        })),
        periodo,
        parametros: PARAMETROS_INICIALES
      });
    }
    const elapsed = performance.now() - started;
    expect(elapsed).toBeLessThan(1000);
  });
});
