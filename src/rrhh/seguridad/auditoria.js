import { getSession } from './session.js';

export const AUDITORIA_KEY = 'erp_rrhh:auditoria';

const ALLOWED_ACTIONS = new Set([
  'ver_sensible',
  'crear',
  'editar',
  'eliminar',
  'aprobar',
  'rechazar',
  'reenviar',
  'calcular',
  'cambio_estado',
  'pagar',
  'anular',
  'cerrar_periodo',
  'abrir_periodo',
  'exportar',
  'acceso_denegado'
]);

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function readAuditoria() {
  if (!storageAvailable()) return [];
  try {
    const raw = localStorage.getItem(AUDITORIA_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAuditoria(rows) {
  if (!storageAvailable()) return rows;
  localStorage.setItem(AUDITORIA_KEY, JSON.stringify(rows));
  return rows;
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `aud-${crypto.randomUUID()}`;
  }
  return `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Append one immutable entry to the audit log.
 *
 * Only field names are stored for changes, never field values, so the log
 * itself cannot become a second copy of sensitive payroll data.
 */
export function registrarAuditoria({
  accion,
  tabla = '',
  registroId = '',
  camposModificados = [],
  motivo = '',
  actor,
  rol,
  fecha
} = {}) {
  const session = getSession();
  const entry = {
    id: createId(),
    fecha: fecha || new Date().toISOString(),
    usuario: actor || session.usuario || 'Sistema',
    rol: rol || session.rol || 'desconocido',
    accion: ALLOWED_ACTIONS.has(accion) ? accion : accion || 'editar',
    tabla,
    registroId,
    camposModificados: Array.isArray(camposModificados)
      ? camposModificados.map(String)
      : [],
    motivo: motivo ? String(motivo) : ''
  };
  const rows = readAuditoria();
  rows.push(entry);
  writeAuditoria(rows);
  return clone(entry);
}

/** Ordered, read-only audit query. */
export function listAuditoria(filters = {}) {
  let rows = readAuditoria();
  if (filters.tabla) rows = rows.filter((row) => row.tabla === filters.tabla);
  if (filters.registroId) rows = rows.filter((row) => row.registroId === filters.registroId);
  if (filters.rol) rows = rows.filter((row) => row.rol === filters.rol);
  if (filters.accion) rows = rows.filter((row) => row.accion === filters.accion);
  if (filters.desde) rows = rows.filter((row) => row.fecha >= filters.desde);
  if (filters.hasta) rows = rows.filter((row) => row.fecha <= filters.hasta);
  return rows.map(clone);
}

export function traceAuditoria({ tabla, registroId }) {
  return listAuditoria({ tabla, registroId });
}

/** Editing an audit entry is always rejected, for every role. */
export function editarAuditoria() {
  throw new Error('La bitácora de auditoría es de solo inserción: no se permite editar registros.');
}

/** Deleting an audit entry is always rejected, for every role. */
export function eliminarAuditoria() {
  throw new Error('La bitácora de auditoría es de solo inserción: no se permite eliminar registros.');
}

/** Audited query helper used by sensitive services. */
export function auditarConsultaSensible({ tabla, registroId, motivo = '', accion = 'ver_sensible' }) {
  return registrarAuditoria({ accion, tabla, registroId, motivo });
}

/** Test/demo reset. There is deliberately no UI action that calls this. */
export function resetAuditoria() {
  if (storageAvailable()) localStorage.removeItem(AUDITORIA_KEY);
}
