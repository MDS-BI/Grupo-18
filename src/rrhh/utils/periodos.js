/**
 * Payroll period model (PERIODO_REMUNERACION).
 *
 * A period is identified by its `YYYY-MM` key. The lifecycle is
 * abierto → calculado → cerrado, where a closed period is strictly read-only
 * for both novedades and liquidations.
 */

export const ESTADOS_PERIODO = ['abierto', 'calculado', 'cerrado'];

export const ESTADO_PERIODO_LABELS = {
  abierto: 'Abierto',
  calculado: 'Calculado',
  cerrado: 'Cerrado'
};

const TRANSICIONES = {
  abierto: ['calculado', 'cerrado'],
  calculado: ['abierto', 'cerrado'],
  cerrado: []
};

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

/** Build the canonical `YYYY-MM` identifier for a year and month. */
export function periodoId(anio, mes) {
  const year = Number(anio);
  const month = Number(mes);
  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Parse a `YYYY-MM` identifier into `{ anio, mes }`, or null when invalid. */
export function parsePeriodo(id) {
  const match = String(id || '').match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const anio = Number(match[1]);
  const mes = Number(match[2]);
  if (mes < 1 || mes > 12) return null;
  return { anio, mes };
}

export function etiquetaPeriodo(id) {
  const parsed = parsePeriodo(id);
  if (!parsed) return 'Período sin definir';
  return `${MONTHS[parsed.mes - 1]} ${parsed.anio}`;
}

/** First and last day of the period, as ISO dates. */
export function rangoPeriodo(id) {
  const parsed = parsePeriodo(id);
  if (!parsed) return { fechaInicio: null, fechaFin: null };
  const lastDay = new Date(Date.UTC(parsed.anio, parsed.mes, 0)).getUTCDate();
  return {
    fechaInicio: `${id}-01`,
    fechaFin: `${id}-${String(lastDay).padStart(2, '0')}`
  };
}

/** Whether a period accepts modifications (novedades, recalculations, etc.). */
export function periodoAbierto(periodo) {
  if (!periodo) return true;
  return periodo.estado !== 'cerrado';
}

export function periodoCerrado(periodo) {
  return Boolean(periodo && periodo.estado === 'cerrado');
}

export function transicionPeriodoValida(desde, hasta) {
  return Boolean(TRANSICIONES[desde]?.includes(hasta));
}

/** Normalize a period record and report every structural problem. */
export function validarPeriodo(periodo) {
  const errors = [];
  if (!periodo || typeof periodo !== 'object' || Array.isArray(periodo)) {
    return { valid: false, errors: ['El período debe ser un objeto.'] };
  }
  const parsed = parsePeriodo(periodo.id || periodo.periodo);
  if (!parsed) {
    errors.push('El período requiere un identificador con formato YYYY-MM.');
  }
  if (periodo.anio !== undefined && Number(periodo.anio) !== parsed?.anio) {
    errors.push('El año del período no coincide con su identificador.');
  }
  if (periodo.mes !== undefined && Number(periodo.mes) !== parsed?.mes) {
    errors.push('El mes del período no coincide con su identificador.');
  }
  if (periodo.estado !== undefined && !ESTADOS_PERIODO.includes(periodo.estado)) {
    errors.push(`El estado debe ser uno de: ${ESTADOS_PERIODO.join(', ')}.`);
  }
  if (periodo.estado === 'cerrado' && !periodo.cerradoPor) {
    errors.push('Un período cerrado debe registrar quién lo cerró.');
  }
  return { valid: errors.length === 0, errors };
}

/** Create a normalized, open period record. */
export function crearPeriodo({ anio, mes, id, estado = 'abierto', ...rest } = {}) {
  const key = id || periodoId(anio, mes);
  const parsed = parsePeriodo(key);
  if (!parsed) {
    const error = new Error('Período inválido: se requiere año y mes válidos.');
    error.errors = ['El período requiere un identificador con formato YYYY-MM.'];
    throw error;
  }
  const { fechaInicio, fechaFin } = rangoPeriodo(key);
  return {
    ...rest,
    id: key,
    periodo: key,
    anio: parsed.anio,
    mes: parsed.mes,
    etiqueta: etiquetaPeriodo(key),
    fechaInicio,
    fechaFin,
    estado,
    ...(estado === 'abierto' ? { cerradoPor: null, fechaCierre: null } : {})
  };
}

/** Dates of a novedad must fall inside the period range. */
export function fechasDentroDePeriodo(periodoIdValue, fechaInicio, fechaFin) {
  const { fechaInicio: start, fechaFin: end } = rangoPeriodo(periodoIdValue);
  if (!start || !end) return false;
  if (!fechaInicio || !fechaFin) return false;
  return fechaInicio >= start && fechaFin <= end && fechaInicio <= fechaFin;
}
