/**
 * Privacy guard for novedades (Ley 21.719).
 *
 * Medical leave records store only the type and the number of days. Diagnoses,
 * CIE codes, treatments and any free text that could identify a health
 * condition are rejected before persistence.
 */

export const CAMPOS_PERMITIDOS = [
  'id',
  'trabajadorEntityId',
  'entity_id',
  'periodo',
  'tipo',
  'cantidad',
  'unidad',
  'fechaInicio',
  'fechaFin',
  'observacion',
  'estado',
  'registradoPor',
  'aprobadoPor',
  'fechaAprobacion',
  'motivoRechazo',
  'createdAt',
  'updatedAt'
];

export const CAMPOS_PROHIBIDOS = [
  'diagnostico',
  'diagnóstico',
  'codigoCie',
  'codigoCIE',
  'cie10',
  'cie',
  'detalleClinico',
  'detalleClínico',
  'enfermedad',
  'sintomas',
  'síntomas',
  'tratamiento',
  'medicamento',
  'patologia',
  'patología',
  'informeMedico',
  'textoClinico'
];

const CLAVE_CLINICA =
  /(diagn|cie|cl[ií]nic|enfermedad|s[ií]ntoma|tratamiento|medicament|patolog|reposo|informe.?m[eé]dico)/i;

const TEXTO_CLINICO =
  /(diagn[oó]stico|\bcie(?:[-\s]?\d+)?\b|enfermedad|s[ií]ntoma|tratamiento|medicamento|patolog[ií]a|reposo m[eé]dico|licencia por)/i;

function texto(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Return a list of privacy violations found on a novedad-like object.
 * Empty array means the record is safe to persist.
 */
export function detectarDatosClinicos(input = {}) {
  const errors = [];
  if (!input || typeof input !== 'object') return errors;

  for (const key of Object.keys(input)) {
    if (CAMPOS_PROHIBIDOS.includes(key) || (CLAVE_CLINICA.test(key) && key !== 'observacion')) {
      errors.push(`No se permite almacenar el campo clínico "${key}".`);
    }
  }

  const observacion = texto(input.observacion);
  if (observacion && TEXTO_CLINICO.test(observacion)) {
    errors.push('La observación no puede contener diagnósticos ni detalles clínicos.');
  }
  if (observacion.length > 500) {
    errors.push('La observación no puede superar 500 caracteres.');
  }

  return errors;
}

export function contieneDatosClinicos(input) {
  return detectarDatosClinicos(input).length > 0;
}

/**
 * Build the exact record that may be persisted. Unknown keys are dropped and
 * medical leaves keep only type and days (plus the operational dates/status).
 */
export function sanitizarNovedad(input = {}) {
  const output = {};
  for (const key of CAMPOS_PERMITIDOS) {
    if (input[key] !== undefined) output[key] = input[key];
  }
  if (output.tipo === 'licencia_medica') {
    output.observacion = '';
  }
  return output;
}

/** Redact clinical-looking free text while keeping the rest of the record. */
export function redactarObservacion(value) {
  const safe = texto(value);
  if (!safe) return '';
  return TEXTO_CLINICO.test(safe) ? '[Observación no clínica omitida por privacidad]' : safe;
}
