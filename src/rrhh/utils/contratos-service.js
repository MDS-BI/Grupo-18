/**
 * Employment contracts.
 *
 * Every salary change is stored as a new contract row (or annex) with its own
 * validity range, so the previous contract is never overwritten. The engine
 * consumes the contract that is active at the period end date.
 */

import { isValidDate, loadEntities } from '../../storage.js';
import { insert, list, update } from '../storage-rrhh.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { can } from '../seguridad/roles.js';
import { obtenerParametro } from './parametros-service.js';
import { rangoPeriodo } from './periodos.js';
import { errorFechaEnRango, limiteContrato } from './limites-fechas.js';

export const CONTRATOS_TABLE = 'contratos';

export const TIPOS_CONTRATO = ['indefinido', 'plazo_fijo', 'obra_faena', 'part_time'];

export const TIPO_CONTRATO_LABELS = {
  indefinido: 'Indefinido',
  plazo_fijo: 'Plazo fijo',
  obra_faena: 'Obra o faena',
  part_time: 'Part time'
};

export const ESTADOS_CONTRATO = ['vigente', 'vencido', 'terminado'];

export const MODALIDADES_GRATIFICACION = ['art50', 'art47', 'ninguna'];

export const MODALIDAD_GRATIFICACION_LABELS = {
  art50: 'Art. 50 (25% con tope)',
  art47: 'Art. 47 (30% utilidades)',
  ninguna: 'Sin gratificación'
};

const MAX_JORNADA_FALLBACK = 45;
const SIN_FIN = '9999-12-31';

function fail(errors, code = 'CONTRATO_INVALIDO') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(messages.join(' '));
  error.errors = messages;
  error.code = code;
  throw error;
}

function failValidation(errors, code = 'CONTRATO_INVALIDO') {
  const error = new Error('Contrato inválido.');
  error.errors = errors;
  error.code = code;
  throw error;
}

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function dayBefore(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

function entityIdOf(input = {}) {
  return input.entityId || input.entity_id || '';
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function limitarJornada(fecha) {
  const parametro = isValidDate(fecha) ? obtenerParametro('JORNADA_MAX', fecha) : null;
  const value = Number(parametro?.valor);
  return Number.isFinite(value) && value > 0 ? value : MAX_JORNADA_FALLBACK;
}

function rangoDe(periodo) {
  if (!periodo) return { fechaInicio: null, fechaFin: null };
  if (typeof periodo === 'string') return rangoPeriodo(periodo);
  return {
    fechaInicio: periodo.fechaInicio || null,
    fechaFin: periodo.fechaFin || null
  };
}

function inicioDe(row) {
  return row?.fechaInicio || '0000-01-01';
}

function finDe(row) {
  return row?.fechaTermino || SIN_FIN;
}

function solapan(a, b) {
  return inicioDe(a) <= finDe(b) && inicioDe(b) <= finDe(a);
}

function cubreFecha(row, fecha) {
  if (!isValidDate(fecha)) return false;
  return inicioDe(row) <= fecha && finDe(row) >= fecha;
}

function solapaPeriodo(row, rango) {
  if (!rango.fechaInicio || !rango.fechaFin) return true;
  return inicioDe(row) <= rango.fechaFin && finDe(row) >= rango.fechaInicio;
}

/** Effective state for a contract on a reference date. */
export function estadoContratoEn(row, referencia = todayISO()) {
  if (!row) return '';
  if (row.estado === 'terminado') return 'terminado';
  if (row.fechaTermino && row.fechaTermino < referencia) return 'vencido';
  return 'vigente';
}

function withEffectiveState(row, referencia = todayISO()) {
  return { ...clone(row), estado: estadoContratoEn(row, referencia) };
}

function profileDe(entityId) {
  return list('trabajadores').find((row) => String(row.entityId) === String(entityId)) || null;
}

export function puedeGestionarContratos(viewer) {
  return can(viewer?.role, 'canManageContratos');
}

export function puedeVerContratos(viewer) {
  return can(viewer?.role, 'canViewTrabajadores') || puedeGestionarContratos(viewer);
}

/** Validate a contract payload and its worker reference. */
export function validarContrato(input = {}, context = {}) {
  const errors = {};
  const entityId = entityIdOf(input);
  const entities = context.entities || loadEntities();

  if (!entityId) {
    errors.entityId = 'El contrato debe indicar un trabajador.';
  } else {
    const entity = entities.find((row) => (row.entity_id || row.id) === entityId);
    if (!entity) {
      errors.entityId = 'El trabajador seleccionado no existe.';
    } else {
      const profile = profileDe(entityId);
      const inactive =
        entity.bajaLogica ||
        entity.activo === false ||
        profile?.activo === false ||
        profile?.estadoLaboral === 'Desvinculado';
      if (inactive) {
        errors.entityId = 'El trabajador está desvinculado y no admite nuevos contratos.';
      }
    }
  }

  const sueldoBase = asNumber(input.sueldoBase);
  if (!Number.isFinite(sueldoBase) || sueldoBase <= 0) {
    errors.sueldoBase = 'El sueldo base debe ser un número mayor que cero.';
  } else if (isValidDate(input.fechaInicio)) {
    const minimo = Number(obtenerParametro('IMM', input.fechaInicio)?.valor || 0);
    if (minimo > 0 && sueldoBase < minimo) {
      errors.sueldoBase = `El sueldo base no puede ser inferior al ingreso mínimo vigente (${minimo}).`;
    }
  }

  const jornada = asNumber(input.jornadaHorasSemanales ?? input.jornadaSemanal);
  const maxJornada = limitarJornada(input.fechaInicio);
  if (!Number.isFinite(jornada) || jornada <= 0 || jornada > maxJornada) {
    errors.jornadaHorasSemanales = `La jornada semanal debe ser mayor que cero y menor o igual a ${maxJornada} horas.`;
  }

  if (!TIPOS_CONTRATO.includes(input.tipoContrato)) {
    errors.tipoContrato = `El tipo de contrato debe ser uno de: ${TIPOS_CONTRATO.join(', ')}.`;
  }

  const limites = limiteContrato();
  if (!isValidDate(input.fechaInicio)) {
    errors.fechaInicio = 'La fecha de inicio debe ser una fecha válida (AAAA-MM-DD).';
  } else {
    const fueraDeRango = errorFechaEnRango(input.fechaInicio, 'La fecha de inicio', {
      desde: limites.minInicio,
      hasta: limites.maxInicio,
      textoDesde: `no puede ser anterior a ${limites.minInicio.slice(0, 4)}`,
      textoHasta: 'no puede estar a más de un año en el futuro'
    });
    if (fueraDeRango) errors.fechaInicio = fueraDeRango;
  }
  if (input.fechaTermino) {
    if (!isValidDate(input.fechaTermino)) {
      errors.fechaTermino = 'La fecha de término debe ser una fecha válida (AAAA-MM-DD).';
    } else if (isValidDate(input.fechaInicio) && input.fechaTermino < input.fechaInicio) {
      errors.fechaTermino = 'La fecha de término no puede ser anterior a la fecha de inicio.';
    } else if (input.fechaTermino > limites.maxTermino) {
      errors.fechaTermino = 'La fecha de término no puede estar a más de 5 años en el futuro.';
    }
  } else if (input.tipoContrato === 'plazo_fijo') {
    errors.fechaTermino = 'Un contrato a plazo fijo requiere fecha de término.';
  }
  if (input.tipoContrato === 'indefinido' && input.fechaTermino) {
    errors.fechaTermino = 'Un contrato indefinido no puede tener fecha de término.';
  }

  const modalidad = input.modalidadGratificacion || 'art50';
  if (!MODALIDADES_GRATIFICACION.includes(modalidad)) {
    errors.modalidadGratificacion = `La modalidad de gratificación debe ser una de: ${MODALIDADES_GRATIFICACION.join(', ')}.`;
  }

  for (const [key, label] of [
    ['asignacionColacion', 'La asignación de colación'],
    ['asignacionMovilizacion', 'La asignación de movilización']
  ]) {
    if (input[key] === undefined || input[key] === '') continue;
    const value = asNumber(input[key]);
    if (!Number.isFinite(value) || value < 0) {
      errors[key] = `${label} debe ser un número no negativo.`;
    }
  }

  if (!context.omitirSolapamiento && entityId && isValidDate(input.fechaInicio)) {
    const rows = context.contratos || list(CONTRATOS_TABLE);
    const overlapping = rows.find(
      (row) =>
        row.id !== context.ignoreId &&
        !row.bajaLogica &&
        entityIdOf(row) === entityId &&
        solapan(input, row)
    );
    if (overlapping) {
      errors.vigencia =
        'La vigencia del contrato se superpone con otro contrato del mismo trabajador.';
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function listContratos({ entityId, incluirTerminados = true, referencia } = {}) {
  let rows = list(CONTRATOS_TABLE);
  if (entityId) {
    rows = rows.filter((row) => entityIdOf(row) === entityId);
  }
  if (!incluirTerminados) {
    rows = rows.filter((row) => row.estado !== 'terminado');
  }
  return rows
    .map((row) => withEffectiveState(row, referencia || todayISO()))
    .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)));
}

export function getContrato(id) {
  const row = list(CONTRATOS_TABLE).find((item) => item.id === id);
  return row ? withEffectiveState(row) : null;
}

/** Contract active for a worker on a given date (defaults to today). */
export function getContratoVigente(entityId, fecha) {
  if (!entityId) return null;
  const date = fecha || todayISO();
  const candidates = list(CONTRATOS_TABLE)
    .filter((row) => !row.bajaLogica && entityIdOf(row) === entityId && cubreFecha(row, date))
    .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)));
  return candidates[0] ? withEffectiveState(candidates[0], date) : null;
}

/**
 * Contracts that overlap a payroll period.
 *
 * Terminated and expired contracts are intentionally included: they may cover
 * part or all of a historical period.
 */
export function contratosEnPeriodo(periodo, { entityId, contratos } = {}) {
  const range = rangoDe(periodo);
  const rows = contratos || list(CONTRATOS_TABLE);
  return rows
    .filter((row) => !row.bajaLogica && solapaPeriodo(row, range))
    .filter((row) => !entityId || entityIdOf(row) === entityId)
    .map((row) => withEffectiveState(row, range.fechaFin || todayISO()))
    .sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)));
}

/** Pick the most recent contract that overlaps the period. */
export function contratoParaPeriodo(periodo, entityId, contratos) {
  return contratosEnPeriodo(periodo, { entityId, contratos })[0] || null;
}

function sumarDia(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

/**
 * Days of service covered by one or more contracts during a period.
 *
 * The payroll engine uses commercial 30-day months, so a period completely
 * covered by the worker's contracts always contributes 30 days. Partial
 * coverage is counted by calendar day.
 */
export function diasContratoEnPeriodo(periodo, contratos = []) {
  const range = rangoDe(periodo);
  if (!range.fechaInicio || !range.fechaFin) return 0;
  const rows = (Array.isArray(contratos) ? contratos : [contratos]).filter(
    (row) => row && !row.bajaLogica && solapaPeriodo(row, range)
  );
  if (rows.length === 0) return 0;

  const fullyCovered = rows.some(
    (row) => inicioDe(row) <= range.fechaInicio && finDe(row) >= range.fechaFin
  );
  if (fullyCovered) return 30;

  let days = 0;
  let cursor = range.fechaInicio;
  while (cursor <= range.fechaFin) {
    if (rows.some((row) => cubreFecha(row, cursor))) days += 1;
    cursor = sumarDia(cursor);
  }
  return Math.min(30, days);
}

function buildRecord(input) {
  const entityId = entityIdOf(input);
  return {
    entityId,
    entity_id: entityId,
    tipoContrato: input.tipoContrato,
    sueldoBase: asNumber(input.sueldoBase),
    jornadaHorasSemanales: asNumber(input.jornadaHorasSemanales ?? input.jornadaSemanal),
    fechaInicio: input.fechaInicio,
    fechaTermino: input.fechaTermino || '',
    modalidadGratificacion: input.modalidadGratificacion || 'art50',
    asignacionColacion: asNumber(input.asignacionColacion ?? 0),
    asignacionMovilizacion: asNumber(input.asignacionMovilizacion ?? 0),
    estado: input.estado || 'vigente',
    motivoTermino: input.motivoTermino || '',
    observacion: String(input.observacion ?? '').trim()
  };
}

export function crearContrato(input = {}, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const validation = validarContrato(input);
  if (!validation.valid) {
    failValidation(validation.errors);
  }
  const record = buildRecord({
    ...input,
    estado: estadoContratoEn(input, todayISO())
  });
  const stored = insert(CONTRATOS_TABLE, record, { prefix: 'con' });
  registrarAuditoria({
    accion: 'crear',
    tabla: CONTRATOS_TABLE,
    registroId: stored.id,
    camposModificados: ['entityId', 'sueldoBase', 'jornadaHorasSemanales', 'tipoContrato'],
    motivo: `Registro de contrato ${TIPO_CONTRATO_LABELS[stored.tipoContrato] || stored.tipoContrato}`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return withEffectiveState(stored);
}

export function actualizarContrato(id, changes = {}, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const current = getContrato(id);
  if (!current) fail('El contrato no existe.', 'CONTRATO_NO_ENCONTRADO');

  const errors = {};
  if (changes.entityId !== undefined && changes.entityId !== current.entityId) {
    errors.entityId = 'El trabajador de un contrato no puede modificarse; crea un contrato nuevo.';
  }
  if (changes.entity_id !== undefined && changes.entity_id !== current.entityId) {
    errors.entityId = 'El trabajador de un contrato no puede modificarse; crea un contrato nuevo.';
  }
  for (const key of ['fechaInicio', 'fechaTermino']) {
    if (changes[key] !== undefined && String(changes[key] || '') !== String(current[key] || '')) {
      errors[key] =
        'Las vigencias de un contrato no se editan; registra un nuevo contrato para el cambio.';
    }
  }
  if (
    changes.estado !== undefined &&
    changes.estado !== current.estado &&
    changes.estado !== 'vencido'
  ) {
    errors.estado = 'El estado del contrato solo cambia mediante la terminación.';
  }
  if (Object.keys(errors).length > 0) failValidation(errors);

  const merged = buildRecord({
    ...current,
    ...changes,
    entityId: current.entityId
  });
  merged.estado =
    current.estado === 'terminado' ? 'terminado' : estadoContratoEn(merged, todayISO());
  const validation = validarContrato(merged, { ignoreId: id });
  if (!validation.valid) {
    failValidation(validation.errors);
  }
  const stored = update(CONTRATOS_TABLE, id, merged);
  registrarAuditoria({
    accion: 'editar',
    tabla: CONTRATOS_TABLE,
    registroId: id,
    camposModificados: Object.keys(changes),
    motivo: 'Actualización de contrato',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return withEffectiveState(stored);
}

/**
 * Register a salary change as a new contract, closing the previous one the day
 * before the new validity starts. History is never overwritten.
 */
export function registrarCambioSueldo(entityId, input = {}, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const fechaInicio = input.fechaInicio || todayISO();
  const previous = getContratoVigente(entityId, fechaInicio);
  if (previous && previous.fechaInicio < fechaInicio) {
    update(CONTRATOS_TABLE, previous.id, {
      estado: 'terminado',
      fechaTermino: dayBefore(fechaInicio),
      motivoTermino: 'Cambio de sueldo / nuevo anexo'
    });
  }
  return crearContrato(
    {
      ...input,
      entityId,
      fechaInicio,
      tipoContrato: input.tipoContrato || previous?.tipoContrato || 'indefinido',
      jornadaHorasSemanales:
        input.jornadaHorasSemanales ?? input.jornadaSemanal ?? previous?.jornadaHorasSemanales,
      modalidadGratificacion:
        input.modalidadGratificacion || previous?.modalidadGratificacion || 'art50'
    },
    viewer
  );
}

export function terminarContrato(id, fechaTermino, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const current = getContrato(id);
  if (!current) fail('El contrato no existe.', 'CONTRATO_NO_ENCONTRADO');
  const fecha = fechaTermino || todayISO();
  if (!isValidDate(fecha)) {
    fail('La fecha de término debe tener formato AAAA-MM-DD.', 'CONTRATO_INVALIDO');
  }
  if (fecha < current.fechaInicio) {
    fail('La fecha de término no puede ser anterior a la fecha de inicio.', 'CONTRATO_INVALIDO');
  }
  const stored = update(CONTRATOS_TABLE, id, {
    estado: 'terminado',
    fechaTermino: fecha
  });
  registrarAuditoria({
    accion: 'terminar',
    tabla: CONTRATOS_TABLE,
    registroId: id,
    camposModificados: ['estado', 'fechaTermino'],
    motivo: `Término de contrato con fecha ${fecha}`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return withEffectiveState(stored);
}

/** Contracts are historical records; deletion is forbidden by design. */
export function eliminarContrato() {
  fail(
    'Los contratos no se eliminan. Usa la terminación para cerrar su vigencia.',
    'ELIMINACION_CONTRATO_PROHIBIDA'
  );
}

/**
 * Contracts active on a date, one per worker (the most recent validity),
 * already shaped for the payroll engine.
 */
export function contratosVigentesEn(fecha) {
  const date = fecha || todayISO();
  const byWorker = new Map();
  for (const row of listContratos({ incluirTerminados: true, referencia: date })) {
    if (row.estado === 'terminado' || row.bajaLogica) continue;
    if (!cubreFecha(row, date)) continue;
    const current = byWorker.get(entityIdOf(row));
    if (!current || row.fechaInicio > current.fechaInicio) byWorker.set(entityIdOf(row), row);
  }
  return [...byWorker.values()].map((row) => ({
    id: row.id,
    entity_id: entityIdOf(row),
    entityId: entityIdOf(row),
    estado: estadoContratoEn(row, date),
    sueldoBase: row.sueldoBase,
    jornadaHorasSemanales: row.jornadaHorasSemanales,
    tipoContrato: row.tipoContrato,
    modalidadGratificacion: row.modalidadGratificacion,
    asignacionColacion: row.asignacionColacion,
    asignacionMovilizacion: row.asignacionMovilizacion,
    fechaInicio: row.fechaInicio,
    fechaTermino: row.fechaTermino
  }));
}

export function clearContratos() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:contratos');
  return true;
}
