import { insert, list, readTable, remove, update, writeTable } from '../storage-rrhh.js';
import { loadEntities } from '../../storage.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { assertPeriodoAbierto, getPeriodo } from './periodos-service.js';
import {
  ESTADOS_NOVEDAD,
  TIPO_NOVEDAD_LABELS,
  crearNovedad as crearNovedadBase,
  resumenNovedades,
  validarNovedad
} from './novedades-data.js';
import { detectarDatosClinicos, sanitizarNovedad } from './novedades-privacidad.js';
import {
  aplicarAccionNovedad,
  puedeEditarNovedades,
  puedeRegistrarNovedades
} from './novedades-aprobacion.js';

export const NOVEDADES_TABLE = 'novedades';

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function fail(errors, code = 'NOVEDAD_INVALIDA') {
  const error = new Error(Array.isArray(errors) ? errors.join(' ') : String(errors));
  error.errors = Array.isArray(errors) ? errors : [String(errors)];
  error.code = code;
  throw error;
}

function contextoValidacion(periodoIdValue) {
  return {
    entities: loadEntities(),
    periodo: getPeriodo(periodoIdValue)
  };
}

function assertAlcanceJefatura(viewer, entityId) {
  if (viewer?.role !== 'jefatura' || !Array.isArray(viewer.equipo)) return;
  const team = new Set(viewer.equipo.map((value) => String(value)));
  if (!team.has(String(entityId))) {
    fail(
      'La novedad no pertenece a un trabajador de tu equipo.',
      'PERMISO_DENEGADO'
    );
  }
}

export function listNovedades(filters = {}) {
  let rows = list(NOVEDADES_TABLE);
  if (filters.periodo) rows = rows.filter((row) => row.periodo === filters.periodo);
  if (filters.trabajadorEntityId) {
    rows = rows.filter((row) => row.trabajadorEntityId === filters.trabajadorEntityId);
  }
  if (filters.estado) rows = rows.filter((row) => row.estado === filters.estado);
  if (filters.tipo) rows = rows.filter((row) => row.tipo === filters.tipo);
  if (filters.incluirBaja !== true) rows = rows.filter((row) => !row.bajaLogica);
  return rows.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export function getNovedad(id) {
  return clone(list(NOVEDADES_TABLE).find((row) => row.id === id) || null);
}

function esDuplicada(candidate, existing, ignoreId) {
  return existing.some(
    (row) =>
      row.id !== ignoreId &&
      !row.bajaLogica &&
      row.estado !== 'rechazada' &&
      row.trabajadorEntityId === candidate.trabajadorEntityId &&
      row.periodo === candidate.periodo &&
      row.tipo === candidate.tipo &&
      row.fechaInicio === candidate.fechaInicio &&
      row.fechaFin === candidate.fechaFin &&
      Number(row.cantidad) === Number(candidate.cantidad)
  );
}

/** Register a novedad. Only Analista/Administrador/Jefatura may do it. */
export function crearNovedad(input, viewer) {
  if (viewer && !puedeRegistrarNovedades(viewer)) {
    fail('Tu rol no puede registrar novedades.', 'PERMISO_DENEGADO');
  }
  const record = crearNovedadBase({
    ...input,
    estado: 'pendiente',
    registradoPor: viewer?.usuario || viewer?.role || 'Sistema'
  });
  assertPeriodoAbierto(record.periodo);
  const validation = validarNovedad(record, contextoValidacion(record.periodo));
  if (!validation.valid) fail(validation.errors);
  assertAlcanceJefatura(viewer, record.trabajadorEntityId);
  if (esDuplicada(record, list(NOVEDADES_TABLE))) {
    fail('Ya existe una novedad idéntica para el mismo trabajador y período.', 'NOVEDAD_DUPLICADA');
  }
  const stored = insert(NOVEDADES_TABLE, sanitizarNovedad(record), { prefix: 'nov' });
  registrarAuditoria({
    accion: 'crear',
    tabla: NOVEDADES_TABLE,
    registroId: stored.id,
    camposModificados: ['tipo', 'cantidad', 'fechaInicio', 'fechaFin'],
    motivo: `Registro de ${TIPO_NOVEDAD_LABELS[stored.tipo] || stored.tipo}`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

/** Correct a pending or rejected novedad. Approved records are immutable. */
export function actualizarNovedad(id, changes, viewer) {
  const current = getNovedad(id);
  if (!current) fail('La novedad no existe.', 'NOVEDAD_NO_ENCONTRADA');
  if (viewer && !puedeEditarNovedades(viewer)) {
    fail('Tu rol no puede editar novedades.', 'PERMISO_DENEGADO');
  }
  if (current.estado === 'aprobada') {
    fail('Una novedad aprobada no se puede editar; anúlala o registra otra.', 'NOVEDAD_INMUTABLE');
  }
  assertPeriodoAbierto(current.periodo);
  const merged = crearNovedadBase({ ...current, ...changes, id: current.id });
  const validation = validarNovedad(merged, contextoValidacion(merged.periodo));
  if (!validation.valid) fail(validation.errors);
  assertAlcanceJefatura(viewer, merged.trabajadorEntityId);
  if (esDuplicada(merged, list(NOVEDADES_TABLE), id)) {
    fail('Ya existe una novedad idéntica para el mismo trabajador y período.', 'NOVEDAD_DUPLICADA');
  }
  const stored = update(
    NOVEDADES_TABLE,
    id,
    sanitizarNovedad({ ...merged, updatedAt: new Date().toISOString() })
  );
  registrarAuditoria({
    accion: 'editar',
    tabla: NOVEDADES_TABLE,
    registroId: id,
    camposModificados: Object.keys(changes || {}),
    motivo: 'Corrección de novedad',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

function aplicarAccion(id, accion, viewer, context = {}) {
  const current = getNovedad(id);
  if (!current) fail('La novedad no existe.', 'NOVEDAD_NO_ENCONTRADA');
  assertAlcanceJefatura(viewer, current.trabajadorEntityId);
  assertPeriodoAbierto(current.periodo);
  const periodo = getPeriodo(current.periodo);
  const changes = aplicarAccionNovedad(current, accion, {
    ...context,
    viewer,
    periodo
  });
  const stored = update(NOVEDADES_TABLE, id, changes);
  registrarAuditoria({
    accion,
    tabla: NOVEDADES_TABLE,
    registroId: id,
    camposModificados: ['estado'],
    motivo: context.motivo || `${accion} de novedad`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

export function aprobarNovedad(id, viewer) {
  return aplicarAccion(id, 'aprobar', viewer);
}

export function rechazarNovedad(id, viewer, motivo) {
  return aplicarAccion(id, 'rechazar', viewer, { motivo });
}

/** Correct and resubmit a rejected novedad. */
export function reenviarNovedad(id, changes, viewer) {
  if (changes && Object.keys(changes).length > 0) {
    actualizarNovedad(id, changes, viewer);
  }
  return aplicarAccion(id, 'reenviar', viewer);
}

export function eliminarNovedad(id, viewer) {
  const current = getNovedad(id);
  if (!current) return false;
  assertAlcanceJefatura(viewer, current.trabajadorEntityId);
  assertPeriodoAbierto(current.periodo);
  const deleted = remove(NOVEDADES_TABLE, id);
  if (deleted) {
    registrarAuditoria({
      accion: 'eliminar',
      tabla: NOVEDADES_TABLE,
      registroId: id,
      motivo: 'Eliminación de novedad',
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
  }
  return deleted;
}

/**
 * Approved novedades are the only ones exposed to the payroll engine. Pending
 * and rejected records are never returned, not even as metadata.
 */
export function novedadesAprobadas(periodo, trabajadorEntityId) {
  return listNovedades({ periodo, estado: 'aprobada', trabajadorEntityId });
}

/** Counts and approved totals for a period. */
export function resumenPeriodo(periodo) {
  const rows = listNovedades({ periodo });
  const byEstado = { pendiente: 0, aprobada: 0, rechazada: 0 };
  for (const row of rows) {
    if (byEstado[row.estado] !== undefined) byEstado[row.estado] += 1;
  }
  const aprobadas = rows.filter((row) => row.estado === 'aprobada');
  return {
    periodo,
    total: rows.length,
    pendientes: byEstado.pendiente,
    aprobadas: byEstado.aprobada,
    rechazadas: byEstado.rechazada,
    porEstado: byEstado,
    totalesAprobados: resumenNovedades(aprobadas)
  };
}

/**
 * Eligibility guard for later processing. Pending or rejected novedades block
 * the period until they are resolved.
 */
export function estadoElegibilidad(periodo) {
  const resumen = resumenPeriodo(periodo);
  const advertencias = [];
  if (resumen.pendientes > 0) {
    advertencias.push(
      `Hay ${resumen.pendientes} novedad(es) pendiente(s) sin aprobar; no son elegibles para el cálculo.`
    );
  }
  if (resumen.rechazadas > 0) {
    advertencias.push(
      `Hay ${resumen.rechazadas} novedad(es) rechazada(s); corrígelas y reenvíalas antes de procesar.`
    );
  }
  return {
    ...resumen,
    elegible: resumen.pendientes === 0 && resumen.rechazadas === 0,
    advertencias
  };
}

/** Whether a worker already has approved or paid liquidations. */
export function tieneLiquidacionesCerradas(entityId) {
  return readTable('liquidaciones').some(
    (row) =>
      (row.trabajador?.entityId === entityId ||
        row.trabajador?.id === entityId ||
        row.trabajadorEntityId === entityId) &&
      (row.estado === 'aprobada' || row.estado === 'pagada')
  );
}

/**
 * Cascade behaviour when a worker entity is deleted.
 *
 * Without closed liquidations the novedades are deleted. Otherwise the worker
 * must be logically deactivated and novedades are retained for the legal
 * payroll record.
 */
export function eliminarNovedadesDeTrabajador(entityId) {
  if (tieneLiquidacionesCerradas(entityId)) {
    return {
      accion: 'baja_logica',
      eliminadas: 0,
      motivo:
        'El trabajador tiene liquidaciones aprobadas o pagadas; aplica baja lógica y conserva sus novedades.'
    };
  }
  const rows = readTable(NOVEDADES_TABLE);
  const kept = rows.filter((row) => row.trabajadorEntityId !== entityId);
  const eliminadas = rows.length - kept.length;
  if (eliminadas > 0) {
    writeTable(NOVEDADES_TABLE, kept);
    registrarAuditoria({
      accion: 'eliminar',
      tabla: NOVEDADES_TABLE,
      registroId: entityId,
      motivo: 'Eliminación en cascada de novedades del trabajador'
    });
  }
  return { accion: 'eliminar', eliminadas, motivo: '' };
}

export function estadosDisponibles() {
  return [...ESTADOS_NOVEDAD];
}

export function clearNovedades() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:novedades');
}

/** Re-export for views that must display privacy warnings. */
export { detectarDatosClinicos };
