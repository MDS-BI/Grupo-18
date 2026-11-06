import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ESTADOS_PERIODO,
  crearPeriodo,
  etiquetaPeriodo,
  fechasDentroDePeriodo,
  periodoAbierto,
  periodoCerrado,
  periodoId,
  parsePeriodo,
  rangoPeriodo,
  transicionPeriodoValida,
  validarPeriodo
} from '../../src/rrhh/utils/periodos.js';
import {
  PeriodoCerradoError,
  PeriodoPermisoError,
  abrirPeriodo,
  asegurarPeriodo,
  assertPeriodoAbierto,
  cerrarPeriodo,
  getPeriodo,
  isPeriodoCerrado,
  listPeriodos,
  marcarPeriodoCalculado,
  puedeEditarEnPeriodo,
  puedeGestionarPeriodo
} from '../../src/rrhh/utils/periodos-service.js';
import { clearTable } from '../../src/rrhh/storage-rrhh.js';
import { resetSeedFlag } from '../../src/rrhh/utils/parametros-service.js';

const jefatura = { role: 'jefatura', usuario: 'Jefatura RRHH' };
const analista = { role: 'analista', usuario: 'Analista RRHH' };

let store;

beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  clearTable('periodos');
  clearTable('parametros');
  clearTable('tramos_impuesto');
  resetSeedFlag();
});

afterEach(() => {
  store.clear();
});

describe('US14 - period model', () => {
  it('builds and parses YYYY-MM identifiers', () => {
    expect(periodoId(2026, 9)).toBe('2026-09');
    expect(periodoId(2026, 13)).toBeNull();
    expect(parsePeriodo('2026-09')).toEqual({ anio: 2026, mes: 9 });
    expect(parsePeriodo('2026-13')).toBeNull();
    expect(parsePeriodo('septiembre')).toBeNull();
  });

  it('derives the label and the full month range', () => {
    expect(etiquetaPeriodo('2026-02')).toContain('2026');
    expect(rangoPeriodo('2026-02')).toEqual({
      fechaInicio: '2026-02-01',
      fechaFin: '2026-02-28'
    });
    expect(rangoPeriodo('2024-02').fechaFin).toBe('2024-02-29');
  });

  it('creates a normalized open period', () => {
    const periodo = crearPeriodo({ anio: 2026, mes: 9 });
    expect(periodo.id).toBe('2026-09');
    expect(periodo.estado).toBe('abierto');
    expect(periodo.anio).toBe(2026);
    expect(periodo.mes).toBe(9);
    expect(periodo.cerradoPor).toBeNull();
  });

  it('validates required fields and closed-period ownership', () => {
    expect(validarPeriodo(crearPeriodo({ id: '2026-09' })).valid).toBe(true);
    expect(validarPeriodo({ id: '2026-9' }).valid).toBe(false);
    expect(validarPeriodo({ id: '2026-09', anio: 2025 }).valid).toBe(false);
    expect(validarPeriodo({ id: '2026-09', estado: 'inventado' }).valid).toBe(false);
    const closed = validarPeriodo({ id: '2026-09', estado: 'cerrado' });
    expect(closed.valid).toBe(false);
    expect(closed.errors.join(' ')).toMatch(/cerr/i);
  });

  it('only allows valid lifecycle transitions', () => {
    expect(ESTADOS_PERIODO).toEqual(['abierto', 'calculado', 'cerrado']);
    expect(transicionPeriodoValida('abierto', 'calculado')).toBe(true);
    expect(transicionPeriodoValida('abierto', 'cerrado')).toBe(true);
    expect(transicionPeriodoValida('calculado', 'cerrado')).toBe(true);
    expect(transicionPeriodoValida('cerrado', 'abierto')).toBe(false);
  });

  it('reports open/closed state and date containment', () => {
    expect(periodoAbierto(null)).toBe(true);
    expect(periodoAbierto({ estado: 'abierto' })).toBe(true);
    expect(periodoCerrado({ estado: 'cerrado' })).toBe(true);
    expect(fechasDentroDePeriodo('2026-09', '2026-09-01', '2026-09-30')).toBe(true);
    expect(fechasDentroDePeriodo('2026-09', '2026-08-31', '2026-09-30')).toBe(false);
  });
});

describe('US14 - period service, roles and read-only closure', () => {
  it('opens periods and treats missing periods as editable', () => {
    expect(puedeEditarEnPeriodo('2026-09')).toBe(true);
    const period = asegurarPeriodo('2026-09');
    expect(period.estado).toBe('abierto');
    expect(isPeriodoCerrado('2026-09')).toBe(false);
    expect(() => assertPeriodoAbierto('2026-09')).not.toThrow();
  });

  it('only allows Jefatura or Administrador to manage periods', () => {
    expect(puedeGestionarPeriodo(jefatura)).toBe(true);
    expect(puedeGestionarPeriodo({ role: 'administrador' })).toBe(true);
    expect(puedeGestionarPeriodo(analista)).toBe(false);
    expect(() => cerrarPeriodo('2026-09', analista)).toThrow(PeriodoPermisoError);
    expect(() => abrirPeriodo('2026-09', analista)).toThrow(PeriodoPermisoError);
  });

  it('marks a period as calculated without closing it', () => {
    abrirPeriodo('2026-09', jefatura);
    const calculated = marcarPeriodoCalculado('2026-09');
    expect(calculated.estado).toBe('calculado');
    expect(isPeriodoCerrado('2026-09')).toBe(false);
  });

  it('closes a period, records the actor and freezes legal values', () => {
    abrirPeriodo('2026-09', jefatura);
    const closed = cerrarPeriodo('2026-09', jefatura);

    expect(closed.estado).toBe('cerrado');
    expect(closed.cerradoPor).toBe('Jefatura RRHH');
    expect(closed.fechaCierre).toBeTruthy();
    expect(closed.ingresoMinimo).toBe(553553);
    expect(closed.valorUTM).toBe(71649);
    expect(closed.valorUF).toBe(39500);
    expect(Array.isArray(closed.parametrosCongelados)).toBe(true);
    expect(closed.parametrosCongelados.some((row) => row.codigo === 'IMM')).toBe(true);
    expect(isPeriodoCerrado('2026-09')).toBe(true);
    expect(puedeEditarEnPeriodo('2026-09')).toBe(false);
    expect(() => assertPeriodoAbierto('2026-09')).toThrow(PeriodoCerradoError);
  });

  it('keeps a closed period strictly read-only', () => {
    abrirPeriodo('2026-09', jefatura);
    cerrarPeriodo('2026-09', jefatura);

    expect(() => cerrarPeriodo('2026-09', jefatura)).toThrow(PeriodoCerradoError);
    expect(() => marcarPeriodoCalculado('2026-09')).toThrow(PeriodoCerradoError);
    expect(getPeriodo('2026-09').estado).toBe('cerrado');
    expect(listPeriodos()).toHaveLength(1);
  });
});
