import { can } from '../seguridad/roles.js';
import { periodoCerrado as esPeriodoCerrado } from './periodos.js';

export const ACCIONES_NOVEDAD = ['aprobar', 'rechazar', 'reenviar'];

const TRANSICIONES = {
  pendiente: { aprobar: 'aprobada', rechazar: 'rechazada' },
  rechazada: { reenviar: 'pendiente' },
  aprobada: {}
};

export function puedeRegistrarNovedades(viewer) {
  return can(viewer?.role, 'canRegisterNovedades');
}

export function puedeEditarNovedades(viewer) {
  return can(viewer?.role, 'canEditNovedades');
}

export function puedeAprobarNovedades(viewer) {
  return can(viewer?.role, 'canApproveNovedades');
}

export function puedeRechazarNovedades(viewer) {
  return puedeAprobarNovedades(viewer);
}

export function puedeReenviarNovedades(viewer) {
  return puedeEditarNovedades(viewer);
}

export function transicionNovedadValida(estado, accion) {
  return Boolean(TRANSICIONES[estado]?.[accion]);
}

export function siguienteEstado(estado, accion) {
  return TRANSICIONES[estado]?.[accion] || null;
}

function periodoEstaCerrado(context = {}) {
  if (typeof context.periodoCerrado === 'boolean') return context.periodoCerrado;
  return esPeriodoCerrado(context.periodo);
}

/**
 * Validate an approval/rejection/resubmission. The result is pure and can be
 * used by the service before it mutates storage.
 */
export function validarAccionNovedad(novedad, accion, context = {}) {
  const errors = [];
  const viewer = context.viewer || {};
  if (!novedad) {
    return { valid: false, errors: ['La novedad no existe.'] };
  }
  if (!ACCIONES_NOVEDAD.includes(accion)) {
    errors.push(`Acción desconocida: ${accion}.`);
  }
  if (!TRANSICIONES[novedad.estado]?.[accion]) {
    errors.push(`No se puede ${accion} una novedad en estado ${novedad.estado}.`);
  }
  if (accion === 'aprobar' && !puedeAprobarNovedades(viewer)) {
    errors.push('Solo la Jefatura puede aprobar novedades.');
  }
  if (accion === 'rechazar' && !puedeRechazarNovedades(viewer)) {
    errors.push('Solo la Jefatura puede rechazar novedades.');
  }
  if (accion === 'reenviar' && !puedeReenviarNovedades(viewer)) {
    errors.push('Tu rol no puede corregir y reenviar novedades.');
  }
  if (accion === 'rechazar' && !String(context.motivo || '').trim()) {
    errors.push('El rechazo requiere un motivo.');
  }
  if (periodoEstaCerrado(context)) {
    errors.push('El período está cerrado: la novedad es de solo lectura.');
  }
  return { valid: errors.length === 0, errors };
}

/** Apply a valid transition and return the fields that must be persisted. */
export function aplicarAccionNovedad(novedad, accion, context = {}) {
  const validation = validarAccionNovedad(novedad, accion, context);
  if (!validation.valid) {
    const error = new Error(validation.errors.join(' '));
    error.errors = validation.errors;
    error.code = 'NOVEDAD_TRANSICION_INVALIDA';
    throw error;
  }
  const estado = siguienteEstado(novedad.estado, accion);
  const actor = context.viewer?.usuario || context.viewer?.role || 'Sistema';
  const now = new Date().toISOString();
  const changes = { estado, updatedAt: now };

  if (accion === 'aprobar') {
    changes.aprobadoPor = actor;
    changes.fechaAprobacion = now;
    changes.motivoRechazo = '';
  } else if (accion === 'rechazar') {
    changes.motivoRechazo = String(context.motivo).trim();
    changes.aprobadoPor = actor;
    changes.fechaAprobacion = now;
  } else if (accion === 'reenviar') {
    changes.motivoRechazo = '';
    changes.aprobadoPor = null;
    changes.fechaAprobacion = null;
  }
  return changes;
}
