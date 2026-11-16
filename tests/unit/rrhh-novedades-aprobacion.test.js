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
const admin = { role: 'administrador', usuario: 'Administradora RRHH' };
const trabajador = { role: 'trabajador', usuario: 'Trabajador' };

const pendiente = {
  id: 'nov-1',
  tipo: 'horas_extra',
  cantidad: 2,
  estado: 'pendiente',
  trabajadorEntityId: 'trab-1',
  registradoPor: 'Analista'
};
const rechazada = { ...pendiente, estado: 'rechazada' };
const aprobada = { ...pendiente, estado: 'aprobada' };

describe('HU14 - novedad approval state machine', () => {
  it('defines the pending/approved/rejected/annulled transitions', () => {
    expect(transicionNovedadValida('pendiente', 'aprobar')).toBe(true);
    expect(transicionNovedadValida('pendiente', 'rechazar')).toBe(true);
    expect(transicionNovedadValida('pendiente', 'anular')).toBe(true);
    expect(transicionNovedadValida('rechazada', 'reenviar')).toBe(false);
    expect(transicionNovedadValida('aprobada', 'aprobar')).toBe(false);
    expect(transicionNovedadValida('anulada', 'aprobar')).toBe(false);
    expect(siguienteEstado('pendiente', 'aprobar')).toBe('aprobada');
    expect(siguienteEstado('pendiente', 'anular')).toBe('anulada');
    expect(siguienteEstado('rechazada', 'reenviar')).toBeNull();
  });

  it('grants registration/editing to Analista and approval to Jefatura/Admin', () => {
    expect(puedeRegistrarNovedades(analista)).toBe(true);
    expect(puedeEditarNovedades(analista)).toBe(true);
    expect(puedeAprobarNovedades(analista)).toBe(false);
    expect(puedeRegistrarNovedades(jefatura)).toBe(true);
    expect(puedeAprobarNovedades(jefatura)).toBe(true);
    expect(puedeAprobarNovedades(admin)).toBe(true);
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

  it('applies approval, rejection and annulment recording the actor', () => {
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

    const annulled = aplicarAccionNovedad(pendiente, 'anular', {
      viewer: analista,
      motivo: 'Registro duplicado'
    });
    expect(annulled.estado).toBe('anulada');
    expect(annulled.anuladoPor).toBe('Analista');
    expect(annulled.motivoAnulacion).toBe('Registro duplicado');
  });

  it('does not allow a user to approve or reject a novedad they registered', () => {
    const own = { ...pendiente, registradoPor: 'Jefa' };
    const result = validarAccionNovedad(own, 'aprobar', { viewer: jefatura });
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toMatch(/tú registraste/i);
  });

  it('keeps the administrator out of novedades covered by a direct jefatura', () => {
    const fromJefatura = {
      ...pendiente,
      registradoPor: 'Otra Jefa',
      registradoPorRol: 'jefatura',
      registradoPorId: 'trab-jefe'
    };
    const unrelatedAdmin = validarAccionNovedad(fromJefatura, 'aprobar', {
      viewer: admin,
      jefeId: 'trab-otro-jefe'
    });
    expect(unrelatedAdmin.valid).toBe(false);
    expect(unrelatedAdmin.errors.join(' ')).toMatch(/jefatura directa/i);

    const ownTeamAdmin = validarAccionNovedad(fromJefatura, 'aprobar', {
      viewer: admin,
      jefeId: 'trab-jefe'
    });
    expect(ownTeamAdmin.valid).toBe(true);
  });

  it('blocks every action when the period is closed', () => {
    const closed = { periodo: { id: '2026-09', estado: 'cerrado' } };
    const approve = validarAccionNovedad(pendiente, 'aprobar', { viewer: jefatura, ...closed });
    const annul = validarAccionNovedad(pendiente, 'anular', { viewer: analista, ...closed });
    expect(approve.valid).toBe(false);
    expect(approve.errors.join(' ')).toContain('cerrado');
    expect(annul.valid).toBe(false);
    expect(annul.errors.join(' ')).toContain('cerrado');
  });

  it('rejects invalid transitions and actions', () => {
    expect(validarAccionNovedad(rechazada, 'reenviar', { viewer: analista }).valid).toBe(false);
    expect(validarAccionNovedad(aprobada, 'aprobar', { viewer: jefatura }).valid).toBe(false);
    expect(() => aplicarAccionNovedad(pendiente, 'desconocida', { viewer: jefatura })).toThrow();
  });
});
