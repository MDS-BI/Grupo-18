import { insert, list, readTable, update } from '../storage-rrhh.js';
import { isValidDate, loadEntities } from '../../storage.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { asegurarPeriodo, assertPeriodoAbierto, getPeriodo } from './periodos-service.js';
import { getContratoVigente } from './contratos-service.js';
import { equipoDeJefatura } from './jefatura.js';
import { obtenerParametro } from './parametros-service.js';
import { rangoPeriodo } from './periodos.js';
import { errorFechaEnRango, errorFechaNoFutura, esPeriodoFuturo } from './limites-fechas.js';
import { hoyISO, sumarDias } from './fechas.js';

/** A medical leave may run into the future, up to one year from today. */
export const DIAS_MAXIMOS_LICENCIA_FUTURA = 365;
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

function profileFor(entityId) {
  return list('trabajadores').find((row) => String(row.entityId) === String(entityId)) || null;
}

function contextoValidacion(periodoIdValue, extra = {}) {
  const fecha = extra.fechaReferencia || rangoPeriodo(periodoIdValue).fechaInicio;
  const maximo = Number(obtenerParametro('MAX_HORAS_EXTRA', fecha)?.valor);
  return {
    entities: loadEntities(),
    periodo: getPeriodo(periodoIdValue),
    maxHorasExtraDia: Number.isFinite(maximo) && maximo > 0 ? maximo : 2,
    ...extra
  };
}

/**
 * Attendance records describe what already happened: they cannot start in the
 * future, and overtime or absences cannot end in the future either. A medical
 * leave may run past today (its periods must still exist and be open).
 */
function assertFechasNovedad(record) {
  const inicio = errorFechaNoFutura(record.fechaInicio, 'La fecha de inicio');
  if (inicio) fail(inicio, 'FECHA_FUTURA');
  if (record.tipo !== 'licencia_medica') {
    const fin = errorFechaNoFutura(record.fechaFin, 'La fecha de término');
    if (fin) {
      fail(`${fin} Solo una licencia médica puede extenderse más allá de hoy.`, 'FECHA_FUTURA');
    }
    return;
  }
  const limite = errorFechaEnRango(record.fechaFin, 'La fecha de término de la licencia', {
    hasta: sumarDias(hoyISO(), DIAS_MAXIMOS_LICENCIA_FUTURA),
    textoHasta: 'no puede estar a más de un año de hoy'
  });
  if (limite) fail(limite, 'FECHA_FUTURA');
}

/**
 * Future months a medical leave runs into. They are the only periods that may
 * be created ahead of time, and only once the whole leave has been validated.
 */
function periodosFuturosDeLicencia(record, parts) {
  if (record.tipo !== 'licencia_medica') return [];
  return [
    ...new Set(
      parts
        .map((part) => part.periodo)
        .filter((periodo) => esPeriodoFuturo(periodo) && !getPeriodo(periodo))
    )
  ];
}

function crearPeriodosDeLicencia(periodos, viewer) {
  for (const periodo of periodos) {
    const created = asegurarPeriodo(periodo);
    registrarAuditoria({
      accion: 'abrir_periodo',
      tabla: 'periodos',
      registroId: created.id,
      motivo: 'Período futuro creado automáticamente para una licencia médica que continúa',
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
  }
}

function assertPeriodoParaNovedad(periodoIdValue) {
  const periodo = getPeriodo(periodoIdValue);
  if (!periodo) {
    fail('El período no existe. Créalo antes de registrar novedades.', 'PERIODO_NO_ENCONTRADO');
  }
  assertPeriodoAbierto(periodo);
}

function assertTrabajadorActivo(entityId) {
  const profile = profileFor(entityId);
  if (profile && (profile.activo === false || profile.estadoLaboral === 'Desvinculado')) {
    fail('El trabajador está desvinculado y no admite novedades.', 'TRABAJADOR_DESVINCULADO');
  }
}

function assertContratoEnFechas(record) {
  const inicio = getContratoVigente(record.trabajadorEntityId, record.fechaInicio);
  const fin = getContratoVigente(record.trabajadorEntityId, record.fechaFin);
  if (!inicio || !fin) {
    fail(
      'El trabajador no tiene contrato vigente en las fechas de la novedad.',
      'SIN_CONTRATO_VIGENTE'
    );
  }
}

function assertAlcanceJefatura(viewer, entityId) {
  const team = equipoDeJefatura(viewer);
  if (!team) return;
  if (!team.map(String).includes(String(entityId))) {
    fail('La novedad no pertenece a un trabajador de tu equipo.', 'PERMISO_DENEGADO');
  }
}

function sumarDia(iso) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function diasEntre(inicio, fin) {
  const start = new Date(`${inicio}T00:00:00Z`);
  const end = new Date(`${fin}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) return 0;
  return Math.floor((end - start) / 86400000) + 1;
}

function redondearCantidad(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

/**
 * Split a novedad date range into one record per calendar month.
 *
 * Day-based novedades (medical leave and absence) get the number of calendar
 * days in each part. Hours are distributed proportionally to the days covered
 * by each month, with the remainder assigned to the last part so the total is
 * preserved exactly.
 */
function dividirPorMes(record) {
  const { fechaInicio, fechaFin } = record;
  if (!isValidDate(fechaInicio) || !isValidDate(fechaFin) || fechaFin < fechaInicio) {
    return [{ ...record }];
  }

  const totalDias = diasEntre(fechaInicio, fechaFin);
  const cantidadTotal = Number(record.cantidad) || 0;
  const porDias = record.unidad === 'dias';
  const parts = [];
  let cursor = fechaInicio;
  let assigned = 0;

  while (cursor <= fechaFin) {
    const periodo = cursor.slice(0, 7);
    const { fechaFin: finMes } = rangoPeriodo(periodo);
    const parteFin = fechaFin <= finMes ? fechaFin : finMes;
    const dias = diasEntre(cursor, parteFin);
    const isLast = parteFin === fechaFin;
    let cantidad;
    if (porDias) {
      cantidad = dias;
    } else if (isLast) {
      cantidad = redondearCantidad(cantidadTotal - assigned);
    } else {
      cantidad = redondearCantidad((cantidadTotal * dias) / totalDias);
      assigned = redondearCantidad(assigned + cantidad);
    }
    parts.push({
      ...record,
      periodo,
      fechaInicio: cursor,
      fechaFin: parteFin,
      cantidad
    });
    if (isLast) break;
    cursor = sumarDia(parteFin);
  }

  return parts;
}

function assertPeriodosDeNovedad(parts, { futurosPermitidos = [] } = {}) {
  const permitidos = new Set(futurosPermitidos);
  const missing = [
    ...new Set(
      parts
        .map((part) => part.periodo)
        .filter((periodo) => !getPeriodo(periodo) && !permitidos.has(periodo))
    )
  ];
  if (missing.length > 0) {
    fail(
      `No existe un período activo para ${missing.join(', ')}. Créalo antes de registrar la novedad.`,
      'PERIODO_NO_ENCONTRADO'
    );
  }
  for (const part of parts) {
    if (permitidos.has(part.periodo)) continue;
    assertPeriodoAbierto(part.periodo);
  }
}

export function listNovedades(filters = {}) {
  let rows = list(NOVEDADES_TABLE);
  if (filters.periodo) rows = rows.filter((row) => row.periodo === filters.periodo);
  if (filters.trabajadorEntityId) {
    rows = rows.filter(
      (row) =>
        String(row.trabajadorEntityId || row.entity_id) === String(filters.trabajadorEntityId)
    );
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
      row.estado !== 'anulada' &&
      row.trabajadorEntityId === candidate.trabajadorEntityId &&
      row.periodo === candidate.periodo &&
      row.tipo === candidate.tipo &&
      row.fechaInicio === candidate.fechaInicio &&
      row.fechaFin === candidate.fechaFin &&
      Number(row.cantidad) === Number(candidate.cantidad)
  );
}

function esTipoConFechas(tipo) {
  return tipo === 'licencia_medica' || tipo === 'ausencia';
}

function esSolapamiento(candidate, existing, ignoreId) {
  if (!esTipoConFechas(candidate.tipo)) return null;
  return (
    existing.find(
      (row) =>
        row.id !== ignoreId &&
        !row.bajaLogica &&
        row.estado !== 'anulada' &&
        row.estado !== 'rechazada' &&
        row.trabajadorEntityId === candidate.trabajadorEntityId &&
        esTipoConFechas(row.tipo) &&
        row.fechaInicio <= candidate.fechaFin &&
        candidate.fechaInicio <= row.fechaFin
    ) || null
  );
}

/**
 * Register a novedad. Only Analista/Administrador/Jefatura may do it.
 *
 * A range crossing calendar months is split into one record per month. Every
 * target period is validated before the first insert, so a missing or closed
 * period rejects the whole operation without partial records.
 */
export function crearNovedad(input, viewer) {
  if (viewer && !puedeRegistrarNovedades(viewer)) {
    fail('Tu rol no puede registrar novedades.', 'PERMISO_DENEGADO');
  }
  const base = crearNovedadBase({
    ...input,
    estado: 'pendiente',
    registradoPor: viewer?.usuario || viewer?.role || 'Sistema',
    registradoPorRol: viewer?.role || null,
    registradoPorId: viewer?.trabajadorId || null
  });
  assertFechasNovedad(base);
  const parts = dividirPorMes(base);
  const futuros = periodosFuturosDeLicencia(base, parts);
  assertPeriodosDeNovedad(parts, { futurosPermitidos: futuros });
  assertAlcanceJefatura(viewer, base.trabajadorEntityId);
  assertTrabajadorActivo(base.trabajadorEntityId);

  const existing = list(NOVEDADES_TABLE);
  const pending = [];
  for (const part of parts) {
    const record = crearNovedadBase({ ...part, periodo: part.periodo, estado: 'pendiente' });
    const validation = validarNovedad(
      record,
      contextoValidacion(record.periodo, { fechaReferencia: record.fechaInicio })
    );
    if (!validation.valid) fail(validation.errors);
    assertContratoEnFechas(record);
    const overlap = esSolapamiento(record, [...existing, ...pending]);
    if (overlap) {
      fail(
        `La licencia o ausencia se superpone con una novedad existente (${overlap.id}).`,
        'NOVEDAD_SUPERPUESTA'
      );
    }
    if (esDuplicada(record, [...existing, ...pending])) {
      fail(
        'Ya existe una novedad idéntica para el mismo trabajador y período.',
        'NOVEDAD_DUPLICADA'
      );
    }
    pending.push(record);
  }

  // Everything validated: only now create the future months the leave runs into.
  crearPeriodosDeLicencia(futuros, viewer);

  const stored = [];
  for (const record of pending) {
    const row = insert(NOVEDADES_TABLE, sanitizarNovedad(record), { prefix: 'nov' });
    stored.push(row);
    registrarAuditoria({
      accion: 'crear',
      tabla: NOVEDADES_TABLE,
      registroId: row.id,
      camposModificados: ['tipo', 'cantidad', 'fechaInicio', 'fechaFin'],
      motivo: `Registro de ${TIPO_NOVEDAD_LABELS[row.tipo] || row.tipo}`,
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
  }
  return stored.length === 1 ? stored[0] : stored;
}

/** Correct a pending novedad. Approved, rejected and annulled records are immutable. */
export function actualizarNovedad(id, changes, viewer) {
  const current = getNovedad(id);
  if (!current) fail('La novedad no existe.', 'NOVEDAD_NO_ENCONTRADA');
  if (viewer && !puedeEditarNovedades(viewer)) {
    fail('Tu rol no puede editar novedades.', 'PERMISO_DENEGADO');
  }
  if (current.estado !== 'pendiente') {
    fail(
      'Solo las novedades pendientes se pueden editar; registra una novedad nueva.',
      'NOVEDAD_INMUTABLE'
    );
  }
  assertPeriodoParaNovedad(current.periodo);
  const merged = crearNovedadBase({
    ...current,
    ...changes,
    id: current.id,
    estado: 'pendiente'
  });
  assertFechasNovedad(merged);
  if (dividirPorMes(merged).length > 1) {
    fail(
      'Para corregir un rango que cruza meses, anula esta novedad y registra una por cada período.',
      'NOVEDAD_MULTIPERIODO'
    );
  }
  if (merged.periodo !== current.periodo) {
    assertPeriodoParaNovedad(merged.periodo);
  }
  const validation = validarNovedad(
    merged,
    contextoValidacion(merged.periodo, { fechaReferencia: merged.fechaInicio })
  );
  if (!validation.valid) fail(validation.errors);
  assertAlcanceJefatura(viewer, merged.trabajadorEntityId);
  assertTrabajadorActivo(merged.trabajadorEntityId);
  assertContratoEnFechas(merged);
  const overlap = esSolapamiento(merged, list(NOVEDADES_TABLE), id);
  if (overlap) {
    fail(
      `La licencia o ausencia se superpone con una novedad existente (${overlap.id}).`,
      'NOVEDAD_SUPERPUESTA'
    );
  }
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
    motivo: 'Corrección de novedad pendiente',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

function aplicarAccion(id, accion, viewer, context = {}) {
  const current = getNovedad(id);
  if (!current) fail('La novedad no existe.', 'NOVEDAD_NO_ENCONTRADA');
  assertAlcanceJefatura(viewer, current.trabajadorEntityId);
  assertPeriodoParaNovedad(current.periodo);
  const periodo = getPeriodo(current.periodo);
  const profile = profileFor(current.trabajadorEntityId);
  const changes = aplicarAccionNovedad(current, accion, {
    ...context,
    viewer,
    periodo,
    equipo: equipoDeJefatura(viewer),
    jefeId: profile?.jefeId || ''
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

export function anularNovedad(id, viewer, motivo = '') {
  return aplicarAccion(id, 'anular', viewer, { motivo });
}

/**
 * Novedades are never deleted. Kept as a compatibility alias for callers that
 * still use the old name.
 */
export function eliminarNovedad(id, viewer) {
  const current = getNovedad(id);
  if (!current) return false;
  anularNovedad(id, viewer, 'Anulación de novedad');
  return true;
}

/**
 * Approved novedades are the only ones exposed to the payroll engine. Pending,
 * rejected and annulled records are never returned, not even as metadata.
 */
export function novedadesAprobadas(periodo, trabajadorEntityId) {
  return listNovedades({ periodo, estado: 'aprobada', trabajadorEntityId });
}

/** Counts and approved totals for a period. */
export function resumenPeriodo(periodo) {
  const rows = listNovedades({ periodo });
  const byEstado = { pendiente: 0, aprobada: 0, rechazada: 0, anulada: 0 };
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
    anuladas: byEstado.anulada,
    porEstado: byEstado,
    totalesAprobados: resumenNovedades(aprobadas)
  };
}

/** Only pending novedades block the payroll calculation. */
export function estadoElegibilidad(periodo) {
  const resumen = resumenPeriodo(periodo);
  const advertencias = [];
  if (resumen.pendientes > 0) {
    advertencias.push(
      `Hay ${resumen.pendientes} novedad(es) pendiente(s) sin resolver; el cálculo no puede iniciarse.`
    );
  }
  return {
    ...resumen,
    elegible: resumen.pendientes === 0,
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
 * Cascade behaviour when a worker is removed from the base module.
 *
 * Novedades are kept as historical records; pending ones must be resolved by
 * the desvinculación flow before the worker leaves the company.
 */
export function eliminarNovedadesDeTrabajador(entityId) {
  const rows = readTable(NOVEDADES_TABLE).filter(
    (row) => String(row.trabajadorEntityId || row.entity_id) === String(entityId)
  );
  if (rows.length > 0) {
    registrarAuditoria({
      accion: 'conservar',
      tabla: NOVEDADES_TABLE,
      registroId: entityId,
      motivo: 'Las novedades se conservan como registro histórico del trabajador'
    });
  }
  return {
    accion: 'conservar',
    eliminadas: 0,
    motivo:
      'Las novedades no se eliminan; se conservan para reproducir las liquidaciones históricas.'
  };
}

export function estadosDisponibles() {
  return [...ESTADOS_NOVEDAD];
}

export function clearNovedades() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:novedades');
}

/** Re-export for views that must display privacy warnings. */
export { detectarDatosClinicos };
