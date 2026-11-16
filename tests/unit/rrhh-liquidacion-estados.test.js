import { describe, it, expect } from 'vitest';
import {
  ESTADOS_LIQUIDACION,
  TRANSICIONES_LIQUIDACION,
  TransicionLiquidacionError,
  assertCambioEstado,
  estadosSiguientes,
  puedeCambiarEstado,
  puedeEditarLiquidacion,
  transicionValida,
  validarCambioEstado
} from '../../src/rrhh/utils/liquidacion-estados.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const jefatura = { role: 'jefatura', usuario: 'Jefatura RRHH' };
const administrador = { role: 'administrador', usuario: 'Administrador' };
const gerencia = { role: 'gerencia', usuario: 'Gerencia' };

function liq(estado, extra = {}) {
  return {
    id: 'liq-1',
    estado,
    periodo: { id: '2026-09', estado: 'abierto' },
    ...extra
  };
}

describe('US15 - liquidation lifecycle', () => {
  it('declares every lifecycle state and its allowed transitions', () => {
    expect(ESTADOS_LIQUIDACION).toEqual([
      'borrador',
      'calculada',
      'aprobada',
      'pagada',
      'anulada'
    ]);
    expect(TRANSICIONES_LIQUIDACION.borrador).toContain('calculada');
    expect(TRANSICIONES_LIQUIDACION.calculada).toContain('aprobada');
    expect(TRANSICIONES_LIQUIDACION.aprobada).toContain('pagada');
    expect(TRANSICIONES_LIQUIDACION.pagada).toEqual([]);
    expect(TRANSICIONES_LIQUIDACION.anulada).toEqual([]);
  });

  it('accepts valid transitions and rejects invalid ones', () => {
    expect(transicionValida('borrador', 'calculada')).toBe(true);
    expect(transicionValida('calculada', 'aprobada')).toBe(true);
    expect(transicionValida('aprobada', 'pagada')).toBe(true);
    expect(transicionValida('calculada', 'pagada')).toBe(false);
    expect(transicionValida('pagada', 'anulada')).toBe(false);
    expect(transicionValida('anulada', 'aprobada')).toBe(false);
    expect(estadosSiguientes('calculada').sort()).toEqual(['anulada', 'aprobada', 'borrador']);
    expect(estadosSiguientes('pagada')).toEqual([]);
  });

  it('checks permissions by target state and role', () => {
    expect(puedeCambiarEstado(analista, 'calculada')).toBe(true);
    expect(puedeCambiarEstado(analista, 'aprobada')).toBe(false);
    expect(puedeCambiarEstado(jefatura, 'aprobada')).toBe(false);
    expect(puedeCambiarEstado(administrador, 'aprobada')).toBe(true);
    expect(puedeCambiarEstado(gerencia, 'pagada')).toBe(true);
    expect(puedeCambiarEstado(gerencia, 'anulada')).toBe(false);
  });

  it('validates a complete transition with actor and motive', () => {
    const validation = validarCambioEstado(liq('calculada'), 'aprobada', {
      viewer: administrador
    });
    expect(validation.valid).toBe(true);
    expect(validation.errors).toEqual([]);

    const denied = validarCambioEstado(liq('calculada'), 'aprobada', { viewer: analista });
    expect(denied.valid).toBe(false);
    expect(denied.errors.join(' ')).toMatch(/rol/i);

    const invalid = validarCambioEstado(liq('borrador'), 'pagada', {
      viewer: administrador
    });
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join(' ')).toMatch(/borrador.*pagada/i);
  });

  it('requires a motive to annul', () => {
    const missing = validarCambioEstado(liq('calculada'), 'anulada', {
      viewer: administrador
    });
    expect(missing.valid).toBe(false);
    expect(missing.errors.join(' ')).toMatch(/motivo/i);

    const valid = validarCambioEstado(liq('calculada'), 'anulada', {
      viewer: administrador,
      motivo: 'Error de calculo'
    });
    expect(valid.valid).toBe(true);
  });

  it('freezes every transition when the period is closed', () => {
    const validation = validarCambioEstado(liq('calculada'), 'aprobada', {
      viewer: administrador,
      periodo: { id: '2026-09', estado: 'cerrado' }
    });
    expect(validation.valid).toBe(false);
    expect(validation.errors.join(' ')).toMatch(/cerrado/i);

    const flag = validarCambioEstado(liq('calculada'), 'aprobada', {
      viewer: administrador,
      periodoCerrado: true
    });
    expect(flag.valid).toBe(false);

    const inline = validarCambioEstado(
      liq('calculada', { periodo: { id: '2026-09', cerrado: true } }),
      'aprobada',
      { viewer: administrador }
    );
    expect(inline.valid).toBe(false);
  });

  it('throws a coded error from the assertion helper', () => {
    let error;
    try {
      assertCambioEstado(liq('pagada'), 'aprobada', { viewer: administrador });
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeInstanceOf(TransicionLiquidacionError);
    expect(error.code).toBe('TRANSICION_INVALIDA');
  });

  it('only allows edits in draft/calculated states of an open period', () => {
    expect(puedeEditarLiquidacion(liq('borrador'), analista, { estado: 'abierto' })).toBe(true);
    expect(puedeEditarLiquidacion(liq('calculada'), analista, { estado: 'abierto' })).toBe(true);
    expect(puedeEditarLiquidacion(liq('aprobada'), analista, { estado: 'abierto' })).toBe(false);
    expect(puedeEditarLiquidacion(liq('calculada'), analista, { estado: 'cerrado' })).toBe(false);
    expect(puedeEditarLiquidacion(null, analista, { estado: 'abierto' })).toBe(false);
  });
});
