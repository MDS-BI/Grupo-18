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

export const CONTRATOS_TABLE = 'contratos';

export const TIPOS_CONTRATO = ['indefinido', 'plazo_fijo', 'obra_faena', 'part_time'];

export const TIPO_CONTRATO_LABELS = {
  indefinido: 'Indefinido',
  plazo_fijo: 'Plazo fijo',
  obra_faena: 'Obra o faena',
  part_time: 'Part time'
};

export const ESTADOS_CONTRATO = ['vigente', 'terminado'];

export const MODALIDADES_GRATIFICACION = ['art50', 'art47', 'ninguna'];

export const MODALIDAD_GRATIFICACION_LABELS = {
  art50: 'Art. 50 (25% con tope)',
  art47: 'Art. 47 (30% utilidades)',
  ninguna: 'Sin gratificación'
};

const MAX_JORNADA = 45;

function fail(errors, code = 'CONTRATO_INVALIDO') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(messages.join(' '));
  error.errors = messages;
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
  } else if (!entities.some((entity) => (entity.entity_id || entity.id) === entityId)) {
    errors.entityId = 'El trabajador seleccionado no existe.';
  }

  const sueldoBase = asNumber(input.sueldoBase);
  if (!Number.isFinite(sueldoBase) || sueldoBase <= 0) {
    errors.sueldoBase = 'El sueldo base debe ser un número mayor que cero.';
  }

  const jornada = asNumber(input.jornadaHorasSemanales ?? input.jornadaSemanal);
  if (!Number.isFinite(jornada) || jornada <= 0 || jornada > MAX_JORNADA) {
    errors.jornadaHorasSemanales = `La jornada semanal debe ser mayor que cero y menor o igual a ${MAX_JORNADA} horas.`;
  }

  if (!TIPOS_CONTRATO.includes(input.tipoContrato)) {
    errors.tipoContrato = `El tipo de contrato debe ser uno de: ${TIPOS_CONTRATO.join(', ')}.`;
  }

  if (!isValidDate(input.fechaInicio)) {
    errors.fechaInicio = 'La fecha de inicio debe ser una fecha válida (AAAA-MM-DD).';
  }
  if (input.fechaTermino) {
    if (!isValidDate(input.fechaTermino)) {
      errors.fechaTermino = 'La fecha de término debe ser una fecha válida (AAAA-MM-DD).';
    } else if (isValidDate(input.fechaInicio) && input.fechaTermino < input.fechaInicio) {
      errors.fechaTermino = 'La fecha de término no puede ser anterior a la fecha de inicio.';
    }
  } else if (input.tipoContrato === 'plazo_fijo') {
    errors.fechaTermino = 'Un contrato a plazo fijo requiere fecha de término.';
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

  return { valid: Object.keys(errors).length === 0, errors };
}

export function listContratos({ entityId, incluirTerminados = true } = {}) {
  let rows = list(CONTRATOS_TABLE);
  if (entityId) {
    rows = rows.filter((row) => entityIdOf(row) === entityId);
  }
  if (!incluirTerminados) {
    rows = rows.filter((row) => row.estado !== 'terminado');
  }
  return rows.sort((a, b) => String(b.fechaInicio).localeCompare(String(a.fechaInicio)));
}

export function getContrato(id) {
  return clone(list(CONTRATOS_TABLE).find((row) => row.id === id) || null);
}

/** Contract active for a worker on a given date (defaults to today). */
export function getContratoVigente(entityId, fecha) {
  if (!entityId) return null;
  const date = fecha || todayISO();
  const candidates = listContratos({ entityId, incluirTerminados: true }).filter(
    (row) =>
      row.estado !== 'terminado' &&
      row.fechaInicio <= date &&
      (!row.fechaTermino || row.fechaTermino >= date)
  );
  return candidates[0] || null;
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
    observacion: String(input.observacion ?? '').trim()
  };
}

export function crearContrato(input = {}, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const validation = validarContrato(input);
  if (!validation.valid) {
    const error = new Error('Contrato inválido.');
    error.errors = validation.errors;
    error.code = 'CONTRATO_INVALIDO';
    throw error;
  }
  const stored = insert(CONTRATOS_TABLE, buildRecord(input), { prefix: 'con' });
  registrarAuditoria({
    accion: 'crear',
    tabla: CONTRATOS_TABLE,
    registroId: stored.id,
    camposModificados: ['entityId', 'sueldoBase', 'jornadaHorasSemanales', 'tipoContrato'],
    motivo: `Registro de contrato ${TIPO_CONTRATO_LABELS[stored.tipoContrato] || stored.tipoContrato}`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

export function actualizarContrato(id, changes = {}, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const current = getContrato(id);
  if (!current) fail('El contrato no existe.', 'CONTRATO_NO_ENCONTRADO');

  const merged = buildRecord({
    ...current,
    ...changes,
    entityId: entityIdOf(changes) || current.entityId
  });
  merged.estado = changes.estado ?? current.estado;
  const validation = validarContrato(merged);
  if (!validation.valid) {
    const error = new Error('Contrato inválido.');
    error.errors = validation.errors;
    error.code = 'CONTRATO_INVALIDO';
    throw error;
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
  return stored;
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
  if (fechaTermino && !isValidDate(fechaTermino)) {
    fail('La fecha de término debe tener formato AAAA-MM-DD.', 'CONTRATO_INVALIDO');
  }
  return update(CONTRATOS_TABLE, id, {
    estado: 'terminado',
    fechaTermino: fechaTermino || todayISO()
  });
}

export function eliminarContrato(id, viewer) {
  if (viewer && !puedeGestionarContratos(viewer)) {
    fail('Tu rol no puede gestionar contratos.', 'PERMISO_DENEGADO');
  }
  const current = getContrato(id);
  if (!current) return false;
  update(CONTRATOS_TABLE, id, { estado: 'terminado', bajaLogica: true });
  registrarAuditoria({
    accion: 'eliminar',
    tabla: CONTRATOS_TABLE,
    registroId: id,
    motivo: 'Baja lógica de contrato',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return true;
}

/**
 * Contracts active on a date, one per worker (the most recent validity),
 * already shaped for the payroll engine.
 */
export function contratosVigentesEn(fecha) {
  const date = fecha || todayISO();
  const byWorker = new Map();
  for (const row of listContratos({ incluirTerminados: true })) {
    if (row.estado === 'terminado' || row.bajaLogica) continue;
    if (row.fechaInicio > date) continue;
    if (row.fechaTermino && row.fechaTermino < date) continue;
    const current = byWorker.get(row.entityId);
    if (!current || row.fechaInicio > current.fechaInicio) byWorker.set(row.entityId, row);
  }
  return [...byWorker.values()].map((row) => ({
    id: row.id,
    entity_id: row.entityId,
    entityId: row.entityId,
    estado: 'vigente',
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
