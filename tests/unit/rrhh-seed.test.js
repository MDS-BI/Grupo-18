import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ensureClosedPeriodLiquidations,
  getSeedSummary,
  loadSeedData,
  PERIODO_CALCULADO,
  PERIODO_CERRADO,
  SEED_CLOSED_PERIOD_KEY,
  SEED_DATASET,
  SEED_DISABLE_FLAG
} from '../../src/rrhh/data/seed.js';
import { contratosPorVencer } from '../../src/rrhh/utils/alertas-service.js';
import {
  listLiquidacionesPeriodo,
  STORAGE_KEY as LIQUIDACIONES_KEY
} from '../../src/rrhh/utils/liquidacion-service.js';
import { listTrabajadores } from '../../src/rrhh/utils/trabajadores-service.js';
import { renderResumenView } from '../../src/rrhh/views/resumen-view.js';

let store;
let previousStorage;
let previousDisableFlag;

beforeEach(() => {
  previousStorage = globalThis.localStorage;
  previousDisableFlag = globalThis[SEED_DISABLE_FLAG];
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  globalThis[SEED_DISABLE_FLAG] = false;
  loadSeedData({ reset: true, mark: false });
});

afterEach(() => {
  globalThis[SEED_DISABLE_FLAG] = previousDisableFlag;
  globalThis.localStorage = previousStorage;
});

describe('Datos de prueba RRHH', () => {
  it('carga 12 trabajadores con códigos y RUT únicos', () => {
    expect(SEED_DATASET.trabajadores).toHaveLength(12);
    expect(getSeedSummary()).toMatchObject({
      trabajadores: 12,
      contratos: 12,
      novedades: 8,
      periodos: 3,
      liquidaciones: 20,
      catalogos: 13
    });

    const rows = listTrabajadores({ incluirBaja: true });
    expect(rows).toHaveLength(12);
    expect(new Set(rows.map((row) => row.code)).size).toBe(12);
    expect(new Set(rows.map((row) => row.rut)).size).toBe(12);
  });

  it('asigna dos equipos de 3 y 4 trabajadores mediante jefeId', () => {
    const rows = listTrabajadores({ incluirBaja: true });
    const ana = rows.find((row) => row.name === 'Ana Rivas Molina');
    const luis = rows.find((row) => row.name === 'Luis Herrera Pavez');
    const equipoDe = (jefe) => rows.filter((row) => row.jefeId === jefe.entityId);

    expect(
      equipoDe(ana)
        .map((row) => row.name)
        .sort()
    ).toEqual(['Carlos Mena Rojas', 'Claudia Morales Fuentes', 'Cristóbal Soto Aguirre']);
    expect(
      equipoDe(luis)
        .map((row) => row.name)
        .sort()
    ).toEqual([
      'Diego Valenzuela Costa',
      'Marcela Ruiz Aguilar',
      'Marta Cáceres Vidal',
      'Mauricio Fuentes Ríos'
    ]);

    const vistaJefatura = listTrabajadores({
      viewer: { role: 'jefatura', trabajadorId: ana.entityId }
    });
    expect(vistaJefatura.map((row) => row.name).sort()).toEqual([
      'Carlos Mena Rojas',
      'Claudia Morales Fuentes',
      'Cristóbal Soto Aguirre'
    ]);
  });

  it('incluye un desvinculado y una alerta de contrato próxima a vencer', () => {
    const inactivos = listTrabajadores({ incluirBaja: true })
      .filter((row) => row.estadoLaboral === 'Desvinculado')
      .map((row) => row.name)
      .sort();
    expect(inactivos).toEqual(['Diego Valenzuela Costa', 'Renata Muñoz Díaz']);

    const alerta = contratosPorVencer({ dias: 15 }).find(
      (row) => row.trabajador === 'Marcela Ruiz Aguilar'
    );
    expect(alerta).toBeDefined();
    expect(alerta.diasRestantes).toBeGreaterThanOrEqual(10);
    expect(alerta.diasRestantes).toBeLessThanOrEqual(15);

    const resumen = renderResumenView();
    expect(resumen).toContain('Marcela Ruiz Aguilar');
    expect(resumen).not.toContain('Sin contratos por vencer');
  });

  it('muestra el resumen del Trabajador como tabla con etiquetas destacadas', () => {
    const trabajador = listTrabajadores({ incluirBaja: true })[0];
    const html = renderResumenView({
      viewer: { role: 'trabajador', trabajadorId: trabajador.entityId }
    });

    expect(html).toContain('rrhh-worker-summary');
    expect(html).toContain('Resumen de mi contrato');
    expect(html).toContain('rrhh-worker-state');
    expect(html).toContain('rrhh-resumen-table');
    expect(html).toContain('<th scope="row">Tipo de contrato</th>');
    expect(html).toContain('<th scope="row">Vencimiento</th>');
    expect(html).not.toContain('rrhh-alertas-list');
    expect(html).not.toMatch(/\$\s?\d/);
  });

  it('deja liquidaciones en borrador, aprobada y pagada', () => {
    const liquidaciones = listLiquidacionesPeriodo(PERIODO_CALCULADO);
    expect(liquidaciones).toHaveLength(10);

    const porEstado = liquidaciones.reduce((acc, row) => {
      acc[row.estado] = (acc[row.estado] || 0) + 1;
      return acc;
    }, {});
    expect(porEstado).toMatchObject({
      calculada: 3,
      borrador: 3,
      aprobada: 2,
      pagada: 2
    });
  });

  it('no repite el cargo como departamento en la liquidación generada', () => {
    const liquidacion = listLiquidacionesPeriodo(PERIODO_CALCULADO)[0];
    expect(liquidacion.trabajador.cargo).toBeTruthy();
    expect(liquidacion.trabajador.departamento).not.toBe(liquidacion.trabajador.cargo);
  });

  it('incluye liquidaciones pagadas en un período cerrado', () => {
    const cerradas = listLiquidacionesPeriodo(PERIODO_CERRADO);
    expect(cerradas).toHaveLength(10);
    expect(cerradas.every((row) => row.estado === 'pagada')).toBe(true);
    expect(cerradas.every((row) => row.periodo?.cerrado === true)).toBe(true);
  });

  it('parchea instalaciones previas que no tenían el período cerrado', () => {
    store.delete(SEED_CLOSED_PERIOD_KEY);
    const liquidaciones = JSON.parse(store.get(LIQUIDACIONES_KEY)).filter(
      (row) => row.periodoId !== PERIODO_CERRADO
    );
    store.set(LIQUIDACIONES_KEY, JSON.stringify(liquidaciones));
    expect(listLiquidacionesPeriodo(PERIODO_CERRADO)).toHaveLength(0);

    expect(ensureClosedPeriodLiquidations()).toBe(true);
    expect(listLiquidacionesPeriodo(PERIODO_CERRADO)).toHaveLength(10);
    expect(ensureClosedPeriodLiquidations()).toBe(false);
  });
});
