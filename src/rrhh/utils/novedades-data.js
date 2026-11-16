import { parsePeriodo, rangoPeriodo } from './periodos.js';
import { detectarDatosClinicos } from './novedades-privacidad.js';

export const TIPOS_NOVEDAD = ['horas_extra', 'licencia_medica', 'ausencia'];

export const TIPO_NOVEDAD_LABELS = {
  horas_extra: 'Horas extra',
  licencia_medica: 'Licencia médica',
  ausencia: 'Ausencia'
};

export const UNIDAD_POR_TIPO = {
  horas_extra: 'horas',
  licencia_medica: 'dias',
  ausencia: 'dias'
};

export const ESTADOS_NOVEDAD = ['pendiente', 'aprobada', 'rechazada'];

export const ESTADO_NOVEDAD_LABELS = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada'
};

/** Normalize legacy type names used by previous drafts. */
export function normalizarTipo(tipo) {
  if (tipo === 'ausencia_injustificada') return 'ausencia';
  return tipo;
}

export function unidadParaTipo(tipo) {
  return UNIDAD_POR_TIPO[normalizarTipo(tipo)] || null;
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

/**
 * Validate a novedad.
 *
 * `context` may provide `entities` (base workers) and `periodo` (period
 * record) so the service can validate references and closed periods.
 */
export function validarNovedad(novedad, context = {}) {
  const errors = [];
  if (!novedad || typeof novedad !== 'object' || Array.isArray(novedad)) {
    return { valid: false, errors: ['La novedad debe ser un objeto.'] };
  }

  const tipo = normalizarTipo(novedad.tipo);
  if (!novedad.trabajadorEntityId && !novedad.entity_id) {
    errors.push('La novedad debe indicar el trabajador (entity_id).');
  }
  if (!parsePeriodo(novedad.periodo)) {
    errors.push('El período de la novedad debe tener formato YYYY-MM.');
  }
  if (!TIPOS_NOVEDAD.includes(tipo)) {
    errors.push(`El tipo debe ser uno de: ${TIPOS_NOVEDAD.join(', ')}.`);
  }

  const cantidad = asNumber(novedad.cantidad);
  if (!Number.isFinite(cantidad) || cantidad <= 0) {
    errors.push('La cantidad debe ser un número mayor que cero.');
  } else if (unidadParaTipo(tipo) === 'dias' && !Number.isInteger(cantidad)) {
    errors.push('Los días deben ser un número entero.');
  }

  const unidad = novedad.unidad || unidadParaTipo(tipo);
  if (unidad !== unidadParaTipo(tipo)) {
    errors.push(`La unidad debe ser "${unidadParaTipo(tipo)}" para el tipo ${tipo}.`);
  }

  if (!novedad.fechaInicio || !novedad.fechaFin) {
    errors.push('La novedad requiere fecha de inicio y fecha de fin.');
  } else if (novedad.fechaFin < novedad.fechaInicio) {
    errors.push('La fecha de fin no puede ser anterior a la fecha de inicio.');
  } else if (parsePeriodo(novedad.periodo)) {
    const { fechaInicio, fechaFin } = rangoPeriodo(novedad.periodo);
    if (novedad.fechaInicio < fechaInicio || novedad.fechaFin > fechaFin) {
      errors.push('Las fechas de la novedad deben estar dentro del período.');
    }
  }

  if (tipo === 'horas_extra' && Number.isFinite(cantidad)) {
    const dias = Math.max(
      1,
      Math.round(
        (Date.parse(novedad.fechaFin || novedad.fechaInicio) -
          Date.parse(novedad.fechaInicio)) /
          86400000
      ) + 1
    );
    if (cantidad > dias * 2) {
      errors.push('Las horas extra no pueden superar 2 horas por día (art. 31 CT).');
    }
  }

  if (novedad.estado !== undefined && !ESTADOS_NOVEDAD.includes(novedad.estado)) {
    errors.push(`El estado debe ser uno de: ${ESTADOS_NOVEDAD.join(', ')}.`);
  }

  const clinical = detectarDatosClinicos(novedad);
  if (clinical.length > 0) errors.push(...clinical);

  if (context.entities && (novedad.trabajadorEntityId || novedad.entity_id)) {
    const id = novedad.trabajadorEntityId || novedad.entity_id;
    const exists = context.entities.some((entity) => entity.entity_id === id || entity.id === id);
    if (!exists) errors.push('El trabajador indicado no existe en las entidades.');
  }

  if (context.periodo && context.periodo.estado === 'cerrado') {
    errors.push('El período está cerrado: no se pueden modificar novedades.');
  }

  return { valid: errors.length === 0, errors };
}

/** Build a normalized novedad with only whitelisted, non-clinical fields. */
export function crearNovedad(input = {}) {
  const tipo = normalizarTipo(input.tipo);
  return {
    id: input.id,
    trabajadorEntityId: input.trabajadorEntityId || input.entity_id,
    periodo: input.periodo,
    tipo,
    cantidad: Number(input.cantidad),
    unidad: input.unidad || unidadParaTipo(tipo),
    fechaInicio: input.fechaInicio,
    fechaFin: input.fechaFin,
    observacion: tipo === 'licencia_medica' ? '' : input.observacion || '',
    estado: input.estado || 'pendiente',
    registradoPor: input.registradoPor || null,
    aprobadoPor: input.aprobadoPor || null,
    fechaAprobacion: input.fechaAprobacion || null,
    motivoRechazo: input.motivoRechazo || '',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt
  };
}

/** Summarize approved novedades by type. */
export function resumenNovedades(novedades = []) {
  const resumen = {
    horasExtra: 0,
    diasLicencia: 0,
    diasAusencia: 0,
    total: novedades.length
  };
  for (const novedad of novedades) {
    const tipo = normalizarTipo(novedad.tipo);
    const cantidad = Number(novedad.cantidad) || 0;
    if (tipo === 'horas_extra') resumen.horasExtra += cantidad;
    else if (tipo === 'licencia_medica') resumen.diasLicencia += cantidad;
    else if (tipo === 'ausencia') resumen.diasAusencia += cantidad;
  }
  return resumen;
}

/** Days that reduce the proportional salary (medical leave and absence). */
export function diasNoTrabajados(novedades = []) {
  return novedades.reduce((total, novedad) => {
    const tipo = normalizarTipo(novedad.tipo);
    if (tipo === 'licencia_medica' || tipo === 'ausencia') {
      return total + (Number(novedad.cantidad) || 0);
    }
    return total;
  }, 0);
}
