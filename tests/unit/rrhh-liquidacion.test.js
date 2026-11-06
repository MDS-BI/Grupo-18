import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  createDemoLiquidacion,
  formatDate,
  formatFactor,
  formatMoney,
  formatPercent,
  lineExplanation,
  parameterStatus,
  totals,
  validateLiquidacion
} from '../../src/rrhh/utils/liquidacion-data.js';
import { PARAMETROS_LEGALES, calcularLiquidacion } from '../../src/rrhh/utils/liquidacion-calculo.js';
import {
  clearLiquidaciones,
  loadLiquidacion,
  saveLiquidacion
} from '../../src/rrhh/utils/liquidacion-service.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

beforeEach(() => {
  store.clear();
  clearLiquidaciones();
});

afterEach(() => {
  store.clear();
});

describe('RRHH liquidation read model', () => {
  it('formats Chilean pesos, dates and percentages consistently', () => {
    expect(formatMoney(1200000)).toBe('$1.200.000');
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney('1545000')).toBe('$1.545.000');
    expect(formatDate('2026-09-30')).toBe('30/09/2026');
    expect(formatDate('')).toBe('—');
    expect(formatPercent(0.105)).toBe('10,5%');
    expect(formatPercent(0.25)).toBe('25%');
    expect(formatFactor(1.5)).toBe('1,5');
  });

  it('builds and validates a demo liquidation with consistent totals', () => {
    const liquidacion = createDemoLiquidacion();
    expect(validateLiquidacion(liquidacion).valid).toBe(true);
    expect(liquidacion.lineas.length).toBeGreaterThan(0);
    expect(totals(liquidacion)).toEqual({
      haberes: 1545000,
      descuentos: 242000,
      impuestos: 32000,
      liquido: 1271000
    });
  });

  it('derives the explanation for an automatic line', () => {
    const liquidacion = createDemoLiquidacion();
    const line = liquidacion.lineas.find((item) => item.concepto === 'Gratificación legal');
    const explanation = lineExplanation(line, liquidacion.periodo);

    expect(explanation.manual).toBe(false);
    expect(explanation.baseTexto).toBe('$1.200.000');
    expect(explanation.tasaTexto).toBe('25%');
    expect(explanation.formulaTexto).toBe('$1.200.000 × 25% = $300.000');
    expect(explanation.montoTexto).toBe('$300.000');
    expect(explanation.parametro.codigo).toBe('GRATIFICACION_LEGAL');
    expect(explanation.parametroTexto).toContain('Gratificación legal');
    expect(explanation.vigenciaTexto).toContain('01/01/2026');
    expect(explanation.fuente).toContain('Código del Trabajo');
    expect(explanation.advertencias).toEqual([]);
  });

  it('shows the registered reason for a manual line instead of a formula', () => {
    const liquidacion = createDemoLiquidacion();
    const line = liquidacion.lineas.find((item) => item.manual);
    const explanation = lineExplanation(line, liquidacion.periodo);

    expect(explanation.manual).toBe(true);
    expect(explanation.formulaTexto).toBe('');
    expect(explanation.motivo).toContain('Anticipo');
    expect(explanation.parametro).toBeNull();
    expect(explanation.advertencias).toEqual([]);
  });

  it('warns without omitting a line that lacks a legal parameter', () => {
    const liquidacion = createDemoLiquidacion();
    const line = { ...liquidacion.lineas[0], parametroLegal: null };
    const explanation = lineExplanation(line, liquidacion.periodo);

    expect(explanation.parametro).toBeNull();
    expect(explanation.advertencias.join(' ')).toContain('parámetro legal');
    expect(explanation.montoTexto).toBe(formatMoney(line.monto));
  });

  it('flags a legal parameter that was not in force for the period', () => {
    const liquidacion = createDemoLiquidacion();
    const line = {
      ...liquidacion.lineas[0],
      parametroLegal: {
        ...liquidacion.lineas[0].parametroLegal,
        fechaVigencia: '2027-01-01'
      }
    };
    const explanation = lineExplanation(line, liquidacion.periodo);

    expect(explanation.estadoParametro).toBe('no-vigente');
    expect(explanation.advertencias.join(' ')).toContain('no estaba vigente');
  });

  it('flags a legacy line without a frozen snapshot', () => {
    const liquidacion = createDemoLiquidacion();
    const line = {
      ...liquidacion.lineas[0],
      parametroLegal: { ...liquidacion.lineas[0].parametroLegal, congeladoEnPeriodo: undefined }
    };
    const explanation = lineExplanation(line, liquidacion.periodo);

    expect(explanation.estadoParametro).toBe('sin-snapshot');
    expect(explanation.advertencias.join(' ')).toContain('snapshot');
  });

  it('rejects malformed liquidations and manual lines without a reason', () => {
    expect(validateLiquidacion(null).valid).toBe(false);
    expect(validateLiquidacion({ ...createDemoLiquidacion(), trabajador: {} }).valid).toBe(false);
    const liquidacion = createDemoLiquidacion();
    liquidacion.lineas[0] = { ...liquidacion.lineas[0], monto: -1 };
    expect(validateLiquidacion(liquidacion).valid).toBe(false);

    const manual = createDemoLiquidacion();
    const index = manual.lineas.findIndex((item) => item.manual);
    manual.lineas[index] = { ...manual.lineas[index], motivo: '' };
    expect(validateLiquidacion(manual).valid).toBe(false);
  });
});

describe('RRHH liquidation calculation and snapshot', () => {
  it('freezes the legal parameter values at calculation time and persists them', () => {
    const parametros = {
      AFP: {
        codigo: 'AFP',
        descripcion: 'Cotización AFP',
        fechaVigencia: '2026-01-01',
        valor: 0.1,
        fuente: 'Ley 20.255'
      }
    };
    const liquidacion = calcularLiquidacion({
      id: 'liq-snapshot-001',
      trabajador: { id: 'trab-001', nombre: 'María González', rut: '12.345.678-9' },
      periodo: {
        anio: 2026,
        mes: 9,
        etiqueta: 'Septiembre 2026',
        fechaInicio: '2026-09-01',
        fechaFin: '2026-09-30'
      },
      fechaEmision: '2026-09-30',
      lineas: [{ id: 'l1', concepto: 'Cotización AFP', tipo: 'descuento', base: 1000000, parametroCodigo: 'AFP' }],
      parametros
    });

    expect(liquidacion.lineas[0].monto).toBe(100000);
    expect(liquidacion.lineas[0].parametroLegal.valorAplicado).toBe(0.1);
    expect(liquidacion.lineas[0].parametroLegal.congeladoEnPeriodo).toBe('Septiembre 2026');

    parametros.AFP.valor = 0.2;
    expect(PARAMETROS_LEGALES.AFP.valor).not.toBe(0.2);

    const stored = loadLiquidacion('liq-snapshot-001');
    expect(stored.lineas[0].parametroLegal.valorAplicado).toBe(0.1);
    expect(lineExplanation(stored.lineas[0], stored.periodo).tasaTexto).toBe('10%');
  });

  it('returns a saved liquidation by id and a demo when the store is empty', () => {
    const saved = saveLiquidacion(createDemoLiquidacion());
    expect(loadLiquidacion(saved.id).id).toBe(saved.id);
    expect(loadLiquidacion('missing')).toBeNull();

    clearLiquidaciones();
    expect(loadLiquidacion().id).toBe(createDemoLiquidacion().id);
  });

  it('classifies parameter validity against the period end', () => {
    const periodo = { fechaFin: '2026-09-30' };
    expect(parameterStatus(null, periodo)).toBe('sin-parametro');
    expect(parameterStatus({ fechaVigencia: '2026-01-01' }, periodo)).toBe('sin-snapshot');
    expect(
      parameterStatus({ fechaVigencia: '2026-01-01', congeladoEnPeriodo: 'Septiembre 2026' }, periodo)
    ).toBe('vigente');
    expect(
      parameterStatus({ fechaVigencia: '2027-01-01', congeladoEnPeriodo: 'Septiembre 2026' }, periodo)
    ).toBe('no-vigente');
  });
});
