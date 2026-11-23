/**
 * Holiday calendar (US7). Holidays are excluded when counting the business
 * days of a vacation request. Only the RR.HH. administrator maintains it.
 *
 * Recalculating approved requests when a holiday changes lives in
 * vacaciones-service (`registrarFeriado` / `quitarFeriado`) to avoid a
 * circular import.
 */

import { clearTable, insert, list, remove } from '../storage-rrhh.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { esFechaISO } from './fechas.js';
import { errorFechaEnRango, limiteFeriados } from './limites-fechas.js';

export const FERIADOS_TABLE = 'feriados';

function fail(errors, code = 'FERIADO_INVALIDO') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(messages.join(' '));
  error.errors = messages;
  error.code = code;
  throw error;
}

export function puedeGestionarFeriados(viewer) {
  return viewer?.role === 'administrador';
}

export function listFeriados() {
  return list(FERIADOS_TABLE).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export function fechasFeriado() {
  return new Set(listFeriados().map((row) => row.fecha));
}

export function validarFeriado(input = {}) {
  const errors = [];
  const fecha = String(input.fecha || '').trim();
  const nombre = String(input.nombre || '').trim();
  if (!esFechaISO(fecha)) errors.push('La fecha del feriado no es válida.');
  if (!nombre) errors.push('El nombre del feriado es obligatorio.');
  if (esFechaISO(fecha)) {
    const { min, max } = limiteFeriados();
    const fueraDeRango = errorFechaEnRango(fecha, 'La fecha del feriado', {
      desde: min,
      hasta: max,
      textoDesde: `debe estar entre ${min.slice(0, 4)} y ${max.slice(0, 4)}`,
      textoHasta: `debe estar entre ${min.slice(0, 4)} y ${max.slice(0, 4)}`
    });
    if (fueraDeRango) errors.push(fueraDeRango);
  }
  if (esFechaISO(fecha) && listFeriados().some((row) => row.fecha === fecha)) {
    errors.push('Ya existe un feriado registrado en esa fecha.');
  }
  return { valid: errors.length === 0, errors };
}

export function crearFeriado(input = {}, viewer, { audit = true } = {}) {
  if (viewer && !puedeGestionarFeriados(viewer)) {
    fail(
      'Solo el administrador/a de RR.HH. puede mantener el calendario de feriados.',
      'PERMISO_DENEGADO'
    );
  }
  const validation = validarFeriado(input);
  if (!validation.valid) fail(validation.errors);
  const created = insert(
    FERIADOS_TABLE,
    { fecha: String(input.fecha).trim(), nombre: String(input.nombre).trim() },
    { prefix: 'fer' }
  );
  if (audit) {
    registrarAuditoria({
      accion: 'crear',
      tabla: FERIADOS_TABLE,
      registroId: created.id,
      camposModificados: ['fecha', 'nombre'],
      motivo: `Feriado ${created.fecha}`,
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
  }
  return created;
}

export function eliminarFeriado(id, viewer) {
  if (viewer && !puedeGestionarFeriados(viewer)) {
    fail(
      'Solo el administrador/a de RR.HH. puede mantener el calendario de feriados.',
      'PERMISO_DENEGADO'
    );
  }
  const current = listFeriados().find((row) => row.id === id);
  if (!current) fail('El feriado no existe.', 'FERIADO_NO_ENCONTRADO');
  remove(FERIADOS_TABLE, id);
  registrarAuditoria({
    accion: 'eliminar',
    tabla: FERIADOS_TABLE,
    registroId: id,
    camposModificados: ['fecha', 'nombre'],
    motivo: `Feriado ${current.fecha} eliminado`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return current;
}

export function clearFeriados() {
  clearTable(FERIADOS_TABLE);
}
