import { describe, it, expect } from 'vitest';
import {
  assertRutValido,
  calcularDigitoVerificador,
  formatearRut,
  limpiarRut,
  separarRut,
  validarRut
} from '../../src/rrhh/calculo/rut.js';

describe('US15 - Chilean RUT validation', () => {
  it('normalizes dots, hyphens and whitespace', () => {
    expect(limpiarRut('12.345.678-5')).toBe('123456785');
    expect(limpiarRut(' 7.654.321-k ')).toBe('7654321K');
  });

  it('computes the module-11 check digit', () => {
    expect(calcularDigitoVerificador('12345678')).toBe('5');
    expect(calcularDigitoVerificador('1000005')).toBe('K');
    expect(calcularDigitoVerificador('7654321')).toBe('6');
    expect(calcularDigitoVerificador('11111111')).toBe('1');
    expect(calcularDigitoVerificador('')).toBe('');
  });

  it('splits and formats a RUT', () => {
    expect(separarRut('12.345.678-5')).toEqual({ body: '12345678', dv: '5' });
    expect(formatearRut('123456785')).toBe('12.345.678-5');
    expect(formatearRut('76543216')).toBe('7.654.321-6');
    expect(formatearRut('1000005K')).toBe('1.000.005-K');
    expect(formatearRut('')).toBe('');
  });

  it('accepts valid RUTs with and without formatting', () => {
    expect(validarRut('12.345.678-5')).toBe(true);
    expect(validarRut('123456785')).toBe(true);
    expect(validarRut('7.654.321-6')).toBe(true);
    expect(validarRut('1.000.005-K')).toBe(true);
    expect(validarRut('1000005k')).toBe(true);
  });

  it('rejects invalid check digits, formats and empty values', () => {
    expect(validarRut('12.345.678-9')).toBe(false);
    expect(validarRut('12.345.678')).toBe(false);
    expect(validarRut('12.345.678-')).toBe(false);
    expect(validarRut('1234567890')).toBe(false);
    expect(validarRut('')).toBe(false);
    expect(validarRut('0-0')).toBe(false);
  });

  it('throws a coded error from the assertion helper', () => {
    let error;
    try {
      assertRutValido('12.345.678-9');
    } catch (thrown) {
      error = thrown;
    }
    expect(error).toBeTruthy();
    expect(error.code).toBe('RUT_INVALIDO');
    expect(assertRutValido('12.345.678-5')).toBe('12.345.678-5');
  });
});
