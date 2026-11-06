import { describe, it, expect, beforeEach } from 'vitest';
import {
  PARAMETROS_INICIALES,
  TRAMOS_IMPUESTO_INICIALES,
  congelarParametros,
  mapaParametrosVigentes,
  resolverParametro,
  resolverTramoImpuesto,
  tasaDesdePorcentaje,
  valorParametro
} from '../../src/rrhh/calculo/parametros.js';

const versionados = [
  ...PARAMETROS_INICIALES,
  {
    codigo: 'IMM',
    descripcion: 'Ingreso minimo mensual',
    valor: 600000,
    unidad: 'CLP',
    vigenciaDesde: '2026-09-01',
    fuente: 'Ley futura'
  },
  {
    codigo: 'UTM',
    descripcion: 'UTM anterior',
    valor: 70000,
    unidad: 'CLP',
    vigenciaDesde: '2025-01-01',
    vigenciaHasta: '2025-12-31',
    fuente: 'SII'
  }
];

beforeEach(() => {
  globalThis.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
  };
});

describe('US15 - legal parameter resolution by validity date', () => {
  it('selects the newest parameter valid on the requested date', () => {
    const august = resolverParametro('IMM', '2026-08-31', versionados);
    const september = resolverParametro('IMM', '2026-09-01', versionados);
    expect(august.valor).toBe(553553);
    expect(september.valor).toBe(600000);
  });

  it('does not return a parameter before its validity starts', () => {
    const parametros = [
      {
        codigo: 'NUEVO',
        valor: 1,
        vigenciaDesde: '2026-10-01'
      }
    ];
    expect(resolverParametro('NUEVO', '2026-09-30', parametros)).toBeNull();
    expect(resolverParametro('NUEVO', '2026-10-01', parametros).valor).toBe(1);
  });

  it('respects vigenciaHasta and returns null for unknown codes', () => {
    expect(resolverParametro('UTM', '2025-06-01', versionados).valor).toBe(70000);
    expect(resolverParametro('UTM', '2026-06-01', versionados).valor).toBe(71649);
    expect(resolverParametro('NO_EXISTE', '2026-06-01', versionados)).toBeNull();
    expect(resolverParametro('IMM', null, versionados)).toBeNull();
  });

  it('resolves values with fallbacks and percentage conversion', () => {
    expect(valorParametro('IMM', '2026-06-01', versionados)).toBe(553553);
    expect(valorParametro('NO_EXISTE', '2026-06-01', versionados, 42)).toBe(42);
    expect(tasaDesdePorcentaje(7)).toBeCloseTo(0.07);
  });

  it('maps every code valid on a date', () => {
    const map = mapaParametrosVigentes('2026-06-30', versionados);
    expect(map.IMM.valor).toBe(553553);
    expect(map.UF.valor).toBe(39500);
    expect(map.UTM.valor).toBe(71649);
    expect(map.APORTE_EMP_PREVISIONAL).toBeUndefined();
    expect(mapaParametrosVigentes('2026-09-01', versionados).APORTE_EMP_PREVISIONAL.valor).toBe(3.5);
  });

  it('freezes parameters with source and validity metadata', () => {
    const frozen = congelarParametros('2026-06-30', versionados);
    const imm = frozen.find((row) => row.codigo === 'IMM');
    expect(imm).toMatchObject({
      codigo: 'IMM',
      valorAplicado: 553553,
      fechaVigencia: '2026-05-01',
      fuente: 'Ley 21.830'
    });
    expect(imm.descripcion).toBeTruthy();
    expect(imm.unidad).toBe('CLP');
  });
});

describe('US15 - taxable caps and income-tax brackets', () => {
  it('exposes the legal caps', () => {
    const afpSalud = PARAMETROS_INICIALES.find((row) => row.codigo === 'TOPE_IMPONIBLE_AFP_SALUD');
    const afc = PARAMETROS_INICIALES.find((row) => row.codigo === 'TOPE_IMPONIBLE_AFC');
    expect(afpSalud.valor).toBe(90);
    expect(afc.valor).toBe(135.2);
  });

  it('resolves bracket boundaries without gaps', () => {
    expect(resolverTramoImpuesto(0).id).toBe('tramo-1');
    expect(resolverTramoImpuesto(13.5).id).toBe('tramo-1');
    expect(resolverTramoImpuesto(13.5001).id).toBe('tramo-2');
    expect(resolverTramoImpuesto(30).id).toBe('tramo-2');
    expect(resolverTramoImpuesto(30.1).id).toBe('tramo-3');
    expect(resolverTramoImpuesto(70.1).id).toBe('tramo-5');
    expect(resolverTramoImpuesto(500).id).toBe('tramo-8');
  });

  it('uses the official brackets and factors', () => {
    const tramo = resolverTramoImpuesto(20);
    expect(tramo.factor).toBe(0.04);
    expect(tramo.rebajaUTM).toBe(0.54);
    expect(TRAMOS_IMPUESTO_INICIALES).toHaveLength(8);
    expect(TRAMOS_IMPUESTO_INICIALES.at(-1).hastaUTM).toBe(Infinity);
  });

  it('returns null for an invalid taxable base', () => {
    expect(resolverTramoImpuesto('no-numero')).toBeNull();
  });
});
