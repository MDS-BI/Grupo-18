import { describe, it, expect } from 'vitest';
import {
  TIPOS_NOVEDAD,
  crearNovedad,
  diasNoTrabajados,
  resumenNovedades,
  validarNovedad
} from '../../src/rrhh/utils/novedades-data.js';
import {
  detectarDatosClinicos,
  sanitizarNovedad
} from '../../src/rrhh/utils/novedades-privacidad.js';

const entities = [{ entity_id: 'trab-1', id: 'id-1', name: 'Ana Pérez' }];

function base(overrides = {}) {
  return {
    trabajadorEntityId: 'trab-1',
    periodo: '2026-09',
    tipo: 'horas_extra',
    cantidad: 2,
    unidad: 'horas',
    fechaInicio: '2026-09-10',
    fechaFin: '2026-09-10',
    estado: 'pendiente',
    ...overrides
  };
}

function validate(overrides = {}, context = {}) {
  return validarNovedad(base(overrides), { entities, ...context });
}

describe('HU14 - novedad model validation', () => {
  it('accepts one valid record per supported type', () => {
    expect(TIPOS_NOVEDAD).toEqual(['horas_extra', 'licencia_medica', 'ausencia']);
    expect(validate().valid).toBe(true);
    expect(validate({ tipo: 'licencia_medica', cantidad: 3, unidad: 'dias', fechaFin: '2026-09-12' }).valid).toBe(true);
    expect(validate({ tipo: 'ausencia', cantidad: 1, unidad: 'dias' }).valid).toBe(true);
  });

  it('requires the worker reference, a valid period and a known type', () => {
    expect(validate({ trabajadorEntityId: '' }).errors.join(' ')).toContain('entity_id');
    expect(validate({ periodo: '09-2026' }).errors.join(' ')).toContain('YYYY-MM');
    expect(validate({ tipo: 'vacaciones' }).errors.join(' ')).toContain('tipo');
  });

  it('requires a positive quantity and integer days', () => {
    const zero = validate({ cantidad: 0 });
    expect(zero.valid).toBe(false);
    expect(zero.errors.join(' ')).toContain('mayor que cero');

    const decimalDays = validate({ tipo: 'ausencia', cantidad: 1.5, unidad: 'dias' });
    expect(decimalDays.valid).toBe(false);
    expect(decimalDays.errors.join(' ')).toContain('entero');
  });

  it('requires coherent dates inside the period', () => {
    const reversed = validate({ fechaInicio: '2026-09-12', fechaFin: '2026-09-10' });
    expect(reversed.errors.join(' ')).toContain('anterior');

    const outside = validate({ fechaInicio: '2026-08-31', fechaFin: '2026-09-01' });
    expect(outside.errors.join(' ')).toContain('dentro del período');
  });

  it('limits overtime to two hours per day', () => {
    const result = validate({ cantidad: 5, fechaInicio: '2026-09-10', fechaFin: '2026-09-10' });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('2 horas por día');
  });

  it('validates that the worker exists as a base Entity', () => {
    const result = validate({ trabajadorEntityId: 'missing' });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('no existe');
  });

  it('blocks medical leave with diagnosis fields or clinical text', () => {
    const clinical = validate({
      tipo: 'licencia_medica',
      cantidad: 3,
      unidad: 'dias',
      diagnostico: 'CIE-10 F32'
    });
    expect(clinical.valid).toBe(false);
    expect(clinical.errors.join(' ')).toContain('clínico');

    const text = validate({
      tipo: 'licencia_medica',
      cantidad: 3,
      unidad: 'dias',
      observacion: 'Diagnóstico de enfermedad respiratoria'
    });
    expect(text.valid).toBe(false);
    expect(text.errors.join(' ')).toContain('diagnósticos');
  });

  it('keeps only type and days for a medical leave when sanitizing', () => {
    const safe = sanitizarNovedad({
      ...base({ tipo: 'licencia_medica', cantidad: 4, unidad: 'dias' }),
      observacion: 'texto clínico',
      diagnostico: 'CIE-10',
      unknown: 'x'
    });
    expect(safe.observacion).toBe('');
    expect(safe).not.toHaveProperty('diagnostico');
    expect(safe).not.toHaveProperty('unknown');
    expect(safe.tipo).toBe('licencia_medica');
    expect(safe.cantidad).toBe(4);
  });

  it('detects prohibited clinical fields and text', () => {
    expect(detectarDatosClinicos({ diagnostico: 'x' }).length).toBeGreaterThan(0);
    expect(detectarDatosClinicos({ observacion: 'reposo médico' }).length).toBeGreaterThan(0);
    expect(detectarDatosClinicos({ observacion: 'Trámite administrativo' })).toEqual([]);
  });

  it('summarizes approved quantities by type', () => {
    const resumen = resumenNovedades([
      { tipo: 'horas_extra', cantidad: 4 },
      { tipo: 'licencia_medica', cantidad: 2 },
      { tipo: 'ausencia', cantidad: 1 }
    ]);
    expect(resumen).toMatchObject({ horasExtra: 4, diasLicencia: 2, diasAusencia: 1, total: 3 });
    expect(diasNoTrabajados([
      { tipo: 'licencia_medica', cantidad: 2 },
      { tipo: 'ausencia', cantidad: 1 },
      { tipo: 'horas_extra', cantidad: 4 }
    ])).toBe(3);
  });

  it('normalizes the record through crearNovedad', () => {
    const record = crearNovedad({ ...base(), unidad: undefined, observacion: 'ordinaria' });
    expect(record.unidad).toBe('horas');
    expect(record.estado).toBe('pendiente');
  });
});
