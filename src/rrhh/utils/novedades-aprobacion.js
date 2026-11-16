import { can } from '../seguridad/roles.js';
import { periodoCerrado as esPeriodoCerrado } from './periodos.js';

export const ACCIONES_NOVEDAD = ['aprobar', 'rechazar', 'anular'];

const TRANSICIONES = {
  pendiente: { aprobar: 'aprobada', rechazar: 'rechazada', anular: 'anulada' },
  rechazada: {},
  aprobada: {},
  anulada: {}
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

export function puedeAnularNovedades(viewer) {
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

function trabajadorDe(novedad) {
  return novedad?.trabajadorEntityId || novedad?.entity_id || '';
}

function mismoActor(a, b) {
  return Boolean(a && b && String(a).trim().toLowerCase() === String(b).trim().toLowerCase());
}

function validarAlcance(novedad, viewer, context) {
  if (!['aprobar', 'rechazar'].includes(context.accion)) return [];
  const errors = [];
  const workerId = trabajadorDe(novedad);

  if (viewer.role === 'jefatura') {
    const team = Array.isArray(context.equipo) ? context.equipo : null;
    if (team && !team.map(String).includes(String(workerId))) {
      errors.push('La novedad pertenece a un trabajador fuera de tu jefatura.');
    }
  }

  if (viewer.role === 'administrador') {
    const jefeId = context.jefeId || context.trabajador?.jefeId || '';
    if (jefeId) {
      const registeredByJefatura = novedad.registradoPorRol === 'jefatura';
      const sameJefatura =
        !novedad.registradoPorId ||
        !jefeId ||
        String(novedad.registradoPorId) === String(jefeId);
      if (!registeredByJefatura || !sameJefatura) {
        errors.push(
          'El administrador solo aprueba novedades sin jefatura directa o registradas por la jefatura del equipo.'
        );
      }
    }
  }

  return errors;
}

/**
 * Validate an approval, rejection or annulment. The result is pure and can be
 * used by the service before it mutates storage.
 */
export function validarAccionNovedad(novedad, accion, context = {}) {
  const errors = [];
  const viewer = context.viewer || {};
  const accionContext = { ...context, accion };
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
  if (accion === 'anular' && !puedeAnularNovedades(viewer)) {
    errors.push('Tu rol no puede anular novedades.');
  }
  if (accion === 'rechazar' && !String(context.motivo || '').trim()) {
    errors.push('El rechazo requiere un motivo.');
  }
  if (['aprobar', 'rechazar'].includes(accion) && mismoActor(viewer.usuario, novedad.registradoPor)) {
    errors.push('No puedes aprobar ni rechazar una novedad que tú registraste.');
  }
  errors.push(...validarAlcance(novedad, viewer, accionContext));
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
  } else if (accion === 'anular') {
    changes.anuladoPor = actor;
    changes.fechaAnulacion = now;
    changes.motivoAnulacion = String(context.motivo || '').trim();
  }
  return changes;
}
