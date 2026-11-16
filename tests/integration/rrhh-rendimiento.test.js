import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { calcularPeriodo } from '../../src/rrhh/utils/liquidacion-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { resumenCostoEmpleador } from '../../src/rrhh/utils/costo-empleador.js';

const admin = { role: 'administrador', usuario: 'Administrador' };
const analista = { role: 'analista', usuario: 'Analista RRHH' };

let dom;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  abrirPeriodo('2026-09', admin);
});

afterEach(() => {
  dom.window.close();
});

function buildWorkers(count = 200) {
  const trabajadores = [];
  const contratos = [];
  for (let index = 0; index < count; index += 1) {
    const entityId = `trab-perf-${String(index + 1).padStart(3, '0')}`;
    trabajadores.push({
      entity_id: entityId,
      name: `Trabajador ${index + 1}`,
      taxId: '12.345.678-5',
      centroCosto: index % 2 === 0 ? 'OPERACIONES' : 'ADMINISTRACION'
    });
    contratos.push({
      id: `contrato-perf-${index + 1}`,
      entity_id: entityId,
      estado: 'vigente',
      sueldoBase: 1000000 + index * 1000,
      jornadaHorasSemanales: 42,
      tipoContrato: 'indefinido',
      modalidadGratificacion: 'art50',
      asignacionColacion: 0,
      asignacionMovilizacion: 0
    });
  }
  return { trabajadores, contratos };
}

describe('US15 - performance and employer-cost aggregation', () => {
  it('calculates 200 workers in less than one second', () => {
    const { trabajadores, contratos } = buildWorkers();
    const started = Date.now();
    const result = calcularPeriodo({
      periodo: '2026-09',
      trabajadores,
      contratos,
      viewer: analista
    });
    const elapsed = Date.now() - started;

    expect(result.liquidaciones).toHaveLength(200);
    expect(result.trabajadoresExcluidos).toHaveLength(0);
    expect(elapsed).toBeLessThan(1000);

    for (const liquidation of result.liquidaciones) {
      expect(liquidation.estado).toBe('calculada');
      expect(liquidation.totales.liquido).toBeGreaterThan(0);
      expect(liquidation.costoEmpleador).toBeGreaterThan(liquidation.totales.haberes);
    }
  });

  it('aggregates employer cost by cost center without exposing salaries', () => {
    const { trabajadores, contratos } = buildWorkers(20);
    const { liquidaciones } = calcularPeriodo({
      periodo: '2026-09',
      trabajadores,
      contratos,
      viewer: analista
    });

    const summary = resumenCostoEmpleador(liquidaciones);
    expect(summary.cantidadLiquidaciones).toBe(20);
    expect(summary.porCentroCosto).toHaveLength(2);
    expect(summary.porCentroCosto.map((group) => group.trabajadores)).toEqual([10, 10]);

    for (const group of summary.porCentroCosto) {
      expect(group).not.toHaveProperty('sueldoBase');
      expect(group).not.toHaveProperty('lineas');
      expect(group).not.toHaveProperty('trabajador');
      expect(group.costo).toBe(group.haberes + group.aportes);
    }
    expect(summary.totalCosto).toBe(
      summary.porCentroCosto.reduce((total, group) => total + group.costo, 0)
    );
  });
});
