import { describe, it, expect } from 'vitest';
import {
  aplicarAccionNovedad,
  puedeAprobarNovedades,
  puedeEditarNovedades,
  puedeRegistrarNovedades,
  siguienteEstado,
  transicionNovedadValida,
  validarAccionNovedad
} from '../../src/rrhh/utils/novedades-aprobacion.js';

const analista = { role: 'analista', usuario: 'Analista' };
const jefatura = { role: 'jefatura', usuario: 'Jefa' };
const trabajador = { role: 'trabajador', usuario: 'Trabajador' };

const pendiente = {
  id: 'nov-1',
  tipo: 'horas_extra',
  cantidad: 2,
  estado: 'pendiente'
};
const rechazada = { ...pendiente, estado: 'rechazada' };

describe('HU14 - novedad approval state machine', () => {
  it('defines the pending/approved/rejected transitions', () => {
    expect(transicionNovedadValida('pendiente', 'aprobar')).toBe(true);
    expect(transicionNovedadValida('pendiente', 'rechazar')).toBe(true);
    expect(transicionNovedadValida('rechazada', 'reenviar')).toBe(true);
    expect(transicionNovedadValida('aprobada', 'aprobar')).toBe(false);
    expect(siguienteEstado('pendiente', 'aprobar')).toBe('aprobada');
    expect(siguienteEstado('rechazada', 'reenviar')).toBe('pendiente');
  });

  it('grants registration/editing to Analista and approval to Jefatura', () => {
    expect(puedeRegistrarNovedades(analista)).toBe(true);
    expect(puedeEditarNovedades(analista)).toBe(true);
    expect(puedeAprobarNovedades(analista)).toBe(false);
    expect(puedeRegistrarNovedades(jefatura)).toBe(true);
    expect(puedeAprobarNovedades(jefatura)).toBe(true);
    expect(puedeRegistrarNovedades(trabajador)).toBe(false);
    expect(puedeAprobarNovedades(trabajador)).toBe(false);
  });

  it('rejects approval by a role without permission', () => {
    const result = validarAccionNovedad(pendiente, 'aprobar', { viewer: analista });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('Jefatura');
  });

  it('requires a reason to reject', () => {
    const missing = validarAccionNovedad(pendiente, 'rechazar', { viewer: jefatura });
    expect(missing.valid).toBe(false);
    expect(missing.errors.join(' ')).toContain('motivo');

    const ok = validarAccionNovedad(pendiente, 'rechazar', {
      viewer: jefatura,
      motivo: 'Documento incompleto'
    });
    expect(ok.valid).toBe(true);
  });

  it('applies the transition and records the actor', () => {
    const approved = aplicarAccionNovedad(pendiente, 'aprobar', { viewer: jefatura });
    expect(approved.estado).toBe('aprobada');
    expect(approved.aprobadoPor).toBe('Jefa');
    expect(approved.fechaAprobacion).toBeTruthy();

    const rejected = aplicarAccionNovedad(pendiente, 'rechazar', {
      viewer: jefatura,
      motivo: 'Sin respaldo'
    });
    expect(rejected.estado).toBe('rechazada');
    expect(rejected.motivoRechazo).toBe('Sin respaldo');

    const resubmitted = aplicarAccionNovedad(rechazada, 'reenviar', { viewer: analista });
    expect(resubmitted.estado).toBe('pendiente');
    expect(resubmitted.motivoRechazo).toBe('');
    expect(resubmitted.aprobadoPor).toBeNull();
  });

  it('blocks every action when the period is closed', () => {
    const closed = { periodo: { id: '2026-09', estado: 'cerrado' } };
    const approve = validarAccionNovedad(pendiente, 'aprobar', { viewer: jefatura, ...closed });
    const resubmit = validarAccionNovedad(rechazada, 'reenviar', { viewer: analista, ...closed });
    expect(approve.valid).toBe(false);
    expect(approve.errors.join(' ')).toContain('cerrado');
    expect(resubmit.valid).toBe(false);
    expect(resubmit.errors.join(' ')).toContain('cerrado');
  });

  it('rejects invalid transitions and actions', () => {
    expect(validarAccionNovedad(pendiente, 'reenviar', { viewer: analista }).valid).toBe(false);
    expect(validarAccionNovedad({ ...pendiente, estado: 'aprobada' }, 'aprobar', { viewer: jefatura }).valid).toBe(false);
    expect(() => aplicarAccionNovedad(pendiente, 'desconocida', { viewer: jefatura })).toThrow();
  });
});
