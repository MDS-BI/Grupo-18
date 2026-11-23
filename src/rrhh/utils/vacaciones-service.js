/**
 * Vacation requests, approval and balance (US7, FR-088–FR-091).
 *
 * - Accrual: 1,25 business days per complete month since the hire date
 *   (art. 67 CT), with an accumulated balance capped at 30 days (art. 70).
 * - Requests are counted in whole business days (Mon–Fri minus holidays).
 * - A request is validated against the balance projected to its start date.
 * - Approved vacations never discount days in the payroll (art. 71).
 */

import { findById, insert, list, update, clearTable } from '../storage-rrhh.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { getContratoVigente } from './contratos-service.js';
import { equipoDeJefatura, jefeDirectoDe } from './jefatura.js';
import { listNovedades } from './novedades-service.js';
import { getTrabajador } from './trabajadores-service.js';
import { crearFeriado, eliminarFeriado, fechasFeriado } from './feriados-service.js';
import {
  aFechaISO,
  esFechaISO,
  hoyISO,
  mesesCompletos,
  rangosSeSuperponen,
  redondear2,
  sumarDias,
  sumarMeses
} from './fechas.js';

export const VACACIONES_TABLE = 'solicitudes-vacacion';
export const DIAS_POR_MES = 1.25;
export const SALDO_MAXIMO = 30;
export const ESTADOS_VACACION = ['pendiente', 'aprobada', 'rechazada', 'anulada'];
export const ESTADO_VACACION_LABELS = {
  pendiente: 'Pendiente',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  anulada: 'Anulada'
};

const ROLES_CON_ACCESO = ['administrador', 'analista', 'jefatura', 'trabajador'];

function fail(errors, code = 'VACACION_INVALIDA') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(messages.join(' '));
  error.errors = messages;
  error.code = code;
  throw error;
}

function actor(viewer) {
  return viewer?.usuario || viewer?.role || 'Sistema';
}

function auditar(accion, registroId, campos, motivo, viewer) {
  registrarAuditoria({
    accion,
    tabla: VACACIONES_TABLE,
    registroId,
    camposModificados: campos,
    motivo,
    actor: actor(viewer),
    rol: viewer?.role
  });
}

/* ---------- Business days and balance ---------- */

/** Count business days (Mon–Fri) between two dates, excluding holidays. */
export function contarDiasHabiles(inicio, fin, feriados = fechasFeriado()) {
  if (!esFechaISO(inicio) || !esFechaISO(fin) || fin < inicio) return 0;
  const holidays = feriados instanceof Set ? feriados : new Set(feriados);
  let count = 0;
  for (let day = inicio; day <= fin; day = sumarDias(day, 1)) {
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    if (weekday !== 0 && weekday !== 6 && !holidays.has(day)) count += 1;
  }
  return count;
}

/** Days accrued from the hire date to `fecha` (no cap applied). */
export function diasDevengados(fechaIngreso, fecha = hoyISO()) {
  return redondear2(mesesCompletos(fechaIngreso, aFechaISO(fecha)) * DIAS_POR_MES);
}

function solicitudes() {
  return list(VACACIONES_TABLE);
}

function aprobadasDe(entityId, { excluirId } = {}) {
  return solicitudes()
    .filter(
      (row) =>
        String(row.entityId) === String(entityId) &&
        row.estado === 'aprobada' &&
        row.id !== excluirId
    )
    .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio));
}

/**
 * Month-by-month simulation: each complete month adds 1,25 days without
 * exceeding the 30-day cap, and approved vacations are deducted in order of
 * start date. Approved vacations starting after `hasta` are already committed,
 * so they are deducted at the end.
 */
function simularSaldo(fechaIngreso, hasta, aprobadas) {
  const meses = mesesCompletos(fechaIngreso, hasta);
  let saldo = 0;
  let index = 0;
  for (let mes = 1; mes <= meses; mes += 1) {
    const fechaAbono = sumarMeses(fechaIngreso, mes);
    while (index < aprobadas.length && aprobadas[index].fechaInicio < fechaAbono) {
      saldo -= Number(aprobadas[index].diasHabiles) || 0;
      index += 1;
    }
    saldo = Math.min(SALDO_MAXIMO, saldo + DIAS_POR_MES);
  }
  for (; index < aprobadas.length; index += 1) {
    saldo -= Number(aprobadas[index].diasHabiles) || 0;
  }
  return redondear2(saldo);
}

/**
 * Vacation balance of a worker at `fecha`.
 * For a terminated worker the balance is frozen at the termination date.
 */
export function saldoVacaciones(entityId, { fecha = hoyISO(), excluirId } = {}) {
  const trabajador = getTrabajador(entityId);
  if (!trabajador) return null;
  const desvinculado = trabajador.estadoLaboral === 'Desvinculado';
  let referencia = aFechaISO(fecha);
  if (
    desvinculado &&
    trabajador.fechaDesvinculacion &&
    trabajador.fechaDesvinculacion < referencia
  ) {
    referencia = trabajador.fechaDesvinculacion;
  }
  const devengados = diasDevengados(trabajador.fechaIngreso, referencia);
  const aprobadas = aprobadasDe(entityId, { excluirId });
  const aprobados = aprobadas.reduce((total, row) => total + (Number(row.diasHabiles) || 0), 0);
  const disponible = Math.max(0, simularSaldo(trabajador.fechaIngreso, referencia, aprobadas));
  return {
    entityId,
    fecha: referencia,
    devengados,
    aprobados,
    disponible,
    solicitable: Math.floor(disponible),
    alMaximo: disponible >= SALDO_MAXIMO,
    congelado: desvinculado
  };
}

/** Balance projected to the start date of a request (FR-088). */
export function saldoProyectado(entityId, fechaInicio, opciones = {}) {
  const hoy = aFechaISO(opciones.hoy);
  const fecha = esFechaISO(fechaInicio) && fechaInicio > hoy ? fechaInicio : hoy;
  return saldoVacaciones(entityId, { ...opciones, fecha });
}

/* ---------- Permissions and scope ---------- */

export function puedeVerVacaciones(viewer) {
  return ROLES_CON_ACCESO.includes(viewer?.role);
}

export function puedeSolicitarPara(viewer, entityId) {
  if (!viewer?.role) return false;
  if (viewer.role === 'administrador') return true;
  if (viewer.role === 'trabajador') return String(viewer.trabajadorId) === String(entityId);
  if (viewer.role === 'jefatura') {
    const team = equipoDeJefatura(viewer) || [];
    return team.includes(String(entityId));
  }
  return false;
}

/** Worker ids visible to the viewer, or `null` when every worker is visible. */
export function alcanceVacaciones(viewer) {
  if (viewer?.role === 'administrador' || viewer?.role === 'analista') return null;
  if (viewer?.role === 'trabajador') {
    return viewer.trabajadorId ? [String(viewer.trabajadorId)] : [];
  }
  if (viewer?.role === 'jefatura') return equipoDeJefatura(viewer) || [];
  return [];
}

function registradoPorViewer(solicitud, viewer) {
  return (
    solicitud.registradoPorRol === viewer?.role &&
    String(solicitud.registradoPorId || '') === String(viewer?.trabajadorId || '') &&
    String(solicitud.registradoPor || '') === String(viewer?.usuario || '')
  );
}

/**
 * Who may approve or reject: the worker's direct manager; the administrator
 * when the worker has no direct manager or when the manager registered it.
 */
export function puedeResolver(solicitud, viewer) {
  if (!solicitud || !viewer?.role) return false;
  if (registradoPorViewer(solicitud, viewer)) return false;
  const jefeId = jefeDirectoDe(solicitud.entityId);
  if (viewer.role === 'jefatura') {
    if (!jefeId) return false;
    return String(viewer.trabajadorId || '') === String(jefeId);
  }
  if (viewer.role === 'administrador') {
    if (!jefeId) return true;
    return (
      solicitud.registradoPorRol === 'jefatura' &&
      String(solicitud.registradoPorId || '') === String(jefeId)
    );
  }
  return false;
}

/* ---------- Validation ---------- */

function novedadesQueBloquean(entityId) {
  return listNovedades().filter(
    (row) =>
      String(row.trabajadorEntityId) === String(entityId) &&
      ['licencia_medica', 'ausencia'].includes(row.tipo) &&
      !['rechazada', 'anulada'].includes(row.estado)
  );
}

export function validarSolicitud(input = {}, { excluirId, hoy } = {}) {
  const errors = [];
  const entityId = String(input.entityId || '');
  const { fechaInicio, fechaFin } = input;
  const trabajador = entityId ? getTrabajador(entityId) : null;

  if (!trabajador) errors.push('Selecciona un trabajador válido.');
  if (!esFechaISO(fechaInicio)) errors.push('La fecha de inicio no es válida.');
  if (!esFechaISO(fechaFin)) errors.push('La fecha de término no es válida.');
  if (errors.length) return { valid: false, errors, diasHabiles: 0 };

  if (fechaFin < fechaInicio) {
    errors.push('La fecha de término debe ser igual o posterior a la fecha de inicio.');
    return { valid: false, errors, diasHabiles: 0 };
  }
  const diasHabiles = contarDiasHabiles(fechaInicio, fechaFin);
  if (diasHabiles === 0) {
    errors.push('El rango elegido no incluye días hábiles.');
  }
  if (!trabajador.activo || trabajador.estadoLaboral === 'Desvinculado') {
    errors.push('El trabajador está desvinculado y no puede tomar vacaciones.');
  }
  if (!getContratoVigente(entityId, fechaInicio) || !getContratoVigente(entityId, fechaFin)) {
    errors.push('El trabajador no tiene contrato vigente en las fechas solicitadas.');
  }

  const choqueVacacion = solicitudes().find(
    (row) =>
      String(row.entityId) === entityId &&
      row.id !== excluirId &&
      ['pendiente', 'aprobada'].includes(row.estado) &&
      rangosSeSuperponen(fechaInicio, fechaFin, row.fechaInicio, row.fechaFin)
  );
  if (choqueVacacion) {
    errors.push(
      `Se superpone con otra solicitud de vacaciones (${choqueVacacion.fechaInicio} a ${choqueVacacion.fechaFin}).`
    );
  }
  const choqueNovedad = novedadesQueBloquean(entityId).find((row) =>
    rangosSeSuperponen(fechaInicio, fechaFin, row.fechaInicio, row.fechaFin)
  );
  if (choqueNovedad) {
    const tipo = choqueNovedad.tipo === 'licencia_medica' ? 'una licencia médica' : 'una ausencia';
    errors.push(
      `Se superpone con ${tipo} registrada (${choqueNovedad.fechaInicio} a ${choqueNovedad.fechaFin}).`
    );
  }

  if (diasHabiles > 0 && errors.length === 0) {
    const saldo = saldoProyectado(entityId, fechaInicio, { excluirId, hoy });
    if (diasHabiles > saldo.solicitable) {
      errors.push(
        `La solicitud tiene ${diasHabiles} día(s) hábil(es) y el saldo disponible al ${saldo.fecha} es de ${saldo.disponible.toLocaleString('es-CL')} día(s): puedes solicitar como máximo ${saldo.solicitable} día(s) completo(s).`
      );
    }
  }
  return { valid: errors.length === 0, errors, diasHabiles };
}

/* ---------- Queries ---------- */

export function listSolicitudes({ viewer, entityId, estado } = {}) {
  const scope = viewer ? alcanceVacaciones(viewer) : null;
  const allowed = scope ? new Set(scope.map(String)) : null;
  const rows = solicitudes()
    .filter((row) => !allowed || allowed.has(String(row.entityId)))
    .filter((row) => !entityId || String(row.entityId) === String(entityId))
    .filter((row) => !estado || row.estado === estado)
    .map((row) => ({ ...row, trabajador: getTrabajador(row.entityId)?.name || row.entityId }));
  return rows.sort(
    (a, b) => a.trabajador.localeCompare(b.trabajador) || a.fechaInicio.localeCompare(b.fechaInicio)
  );
}

export function getSolicitud(id) {
  return findById(VACACIONES_TABLE, id);
}

/* ---------- Commands ---------- */

export function crearSolicitud(input = {}, viewer, { hoy } = {}) {
  const entityId = String(input.entityId || '');
  if (!puedeSolicitarPara(viewer, entityId)) {
    fail(
      'No tienes autorización para registrar vacaciones de este trabajador.',
      'PERMISO_DENEGADO'
    );
  }
  const validation = validarSolicitud({ ...input, entityId }, { hoy });
  if (!validation.valid) fail(validation.errors);
  const created = insert(
    VACACIONES_TABLE,
    {
      entityId,
      fechaInicio: input.fechaInicio,
      fechaFin: input.fechaFin,
      diasHabiles: validation.diasHabiles,
      estado: 'pendiente',
      observacion: String(input.observacion || '').trim(),
      registradoPor: viewer?.usuario || '',
      registradoPorRol: viewer?.role || '',
      registradoPorId: viewer?.trabajadorId ? String(viewer.trabajadorId) : '',
      resueltoPor: '',
      motivoRechazo: ''
    },
    { prefix: 'vac' }
  );
  auditar(
    'crear',
    created.id,
    ['fechaInicio', 'fechaFin', 'diasHabiles', 'estado'],
    'Solicitud de vacaciones',
    viewer
  );
  return created;
}

export function editarSolicitud(id, changes = {}, viewer, { hoy } = {}) {
  const current = getSolicitud(id);
  if (!current) fail('La solicitud no existe.', 'VACACION_NO_ENCONTRADA');
  if (current.estado !== 'pendiente') {
    fail('Solo una solicitud pendiente puede editarse.', 'VACACION_NO_EDITABLE');
  }
  if (!registradoPorViewer(current, viewer) && viewer?.role !== 'administrador') {
    fail(
      'Solo quien registró la solicitud o el administrador/a pueden editarla.',
      'PERMISO_DENEGADO'
    );
  }
  const merged = { ...current, ...changes, entityId: current.entityId };
  const validation = validarSolicitud(merged, { excluirId: id, hoy });
  if (!validation.valid) fail(validation.errors);
  const updated = update(VACACIONES_TABLE, id, {
    fechaInicio: merged.fechaInicio,
    fechaFin: merged.fechaFin,
    diasHabiles: validation.diasHabiles,
    observacion: String(merged.observacion || '').trim()
  });
  auditar('editar', id, Object.keys(changes), 'Edición de solicitud de vacaciones', viewer);
  return updated;
}

export function aprobarSolicitud(id, viewer, { hoy } = {}) {
  const current = getSolicitud(id);
  if (!current) fail('La solicitud no existe.', 'VACACION_NO_ENCONTRADA');
  if (current.estado !== 'pendiente') {
    fail('Solo una solicitud pendiente puede aprobarse.', 'VACACION_NO_EDITABLE');
  }
  if (!puedeResolver(current, viewer)) {
    fail('No tienes autorización para aprobar esta solicitud.', 'PERMISO_DENEGADO');
  }
  const saldo = saldoProyectado(current.entityId, current.fechaInicio, { excluirId: id, hoy });
  if (current.diasHabiles > saldo.solicitable) {
    fail(
      `El saldo disponible al ${saldo.fecha} (${saldo.disponible.toLocaleString('es-CL')} día(s)) ya no alcanza para esta solicitud.`,
      'SALDO_INSUFICIENTE'
    );
  }
  const updated = update(VACACIONES_TABLE, id, {
    estado: 'aprobada',
    resueltoPor: actor(viewer),
    fechaResolucion: new Date().toISOString()
  });
  auditar('aprobar', id, ['estado'], 'Aprobación de vacaciones', viewer);
  return updated;
}

export function rechazarSolicitud(id, viewer, motivo = '') {
  const current = getSolicitud(id);
  if (!current) fail('La solicitud no existe.', 'VACACION_NO_ENCONTRADA');
  if (current.estado !== 'pendiente') {
    fail('Solo una solicitud pendiente puede rechazarse.', 'VACACION_NO_EDITABLE');
  }
  if (!puedeResolver(current, viewer)) {
    fail('No tienes autorización para rechazar esta solicitud.', 'PERMISO_DENEGADO');
  }
  if (!String(motivo).trim()) fail('El motivo del rechazo es obligatorio.', 'MOTIVO_REQUERIDO');
  const updated = update(VACACIONES_TABLE, id, {
    estado: 'rechazada',
    motivoRechazo: String(motivo).trim(),
    resueltoPor: actor(viewer),
    fechaResolucion: new Date().toISOString()
  });
  auditar('rechazar', id, ['estado', 'motivoRechazo'], 'Rechazo de vacaciones', viewer);
  return updated;
}

export function puedeAnular(solicitud, viewer, { hoy } = {}) {
  if (!solicitud || !viewer?.role) return false;
  const propio =
    viewer.role === 'trabajador' && String(viewer.trabajadorId) === String(solicitud.entityId);
  if (solicitud.estado === 'pendiente') {
    return propio || viewer.role === 'administrador' || registradoPorViewer(solicitud, viewer);
  }
  if (solicitud.estado === 'aprobada') {
    const antesDeInicio = solicitud.fechaInicio > aFechaISO(hoy);
    return antesDeInicio && (propio || viewer.role === 'administrador');
  }
  return false;
}

export function anularSolicitud(id, viewer, { hoy } = {}) {
  const current = getSolicitud(id);
  if (!current) fail('La solicitud no existe.', 'VACACION_NO_ENCONTRADA');
  if (current.estado === 'aprobada' && current.fechaInicio <= aFechaISO(hoy)) {
    fail('Las vacaciones ya comenzaron: la solicitud no puede anularse.', 'VACACION_INICIADA');
  }
  if (!puedeAnular(current, viewer, { hoy })) {
    fail('No tienes autorización para anular esta solicitud.', 'PERMISO_DENEGADO');
  }
  const updated = update(VACACIONES_TABLE, id, { estado: 'anulada', anuladoPor: actor(viewer) });
  auditar('anular', id, ['estado'], 'Anulación de vacaciones', viewer);
  return updated;
}

/* ---------- Holidays: keep approved requests in sync ---------- */

function recalcularAprobadas(fecha, viewer) {
  const afectadas = solicitudes().filter(
    (row) => row.estado === 'aprobada' && row.fechaInicio <= fecha && fecha <= row.fechaFin
  );
  for (const row of afectadas) {
    const dias = contarDiasHabiles(row.fechaInicio, row.fechaFin);
    if (dias === row.diasHabiles) continue;
    update(VACACIONES_TABLE, row.id, { diasHabiles: dias });
    auditar(
      'editar',
      row.id,
      ['diasHabiles'],
      `Recálculo por cambio en el calendario de feriados (${fecha})`,
      viewer
    );
  }
  return afectadas.length;
}

export function registrarFeriado(input, viewer) {
  const feriado = crearFeriado(input, viewer);
  recalcularAprobadas(feriado.fecha, viewer);
  return feriado;
}

export function quitarFeriado(id, viewer) {
  const feriado = eliminarFeriado(id, viewer);
  recalcularAprobadas(feriado.fecha, viewer);
  return feriado;
}

/* ---------- Alerts and summaries ---------- */

export function alertasSaldoMaximo({ hoy } = {}) {
  const ids = [...new Set(list('trabajadores').map((row) => String(row.entityId)))];
  return ids
    .map((entityId) => ({
      entityId,
      trabajador: getTrabajador(entityId),
      saldo: saldoVacaciones(entityId, { fecha: hoy })
    }))
    .filter((row) => row.trabajador?.activo && row.saldo?.alMaximo)
    .map((row) => ({
      entityId: row.entityId,
      trabajador: row.trabajador.name,
      disponible: row.saldo.disponible
    }))
    .sort((a, b) => a.trabajador.localeCompare(b.trabajador));
}

export function resumenVacacionesTrabajador(entityId, { hoy } = {}) {
  const saldo = saldoVacaciones(entityId, { fecha: hoy });
  if (!saldo) return null;
  const desde = aFechaISO(hoy);
  const proxima =
    solicitudes()
      .filter(
        (row) =>
          String(row.entityId) === String(entityId) &&
          ['pendiente', 'aprobada'].includes(row.estado) &&
          row.fechaFin >= desde
      )
      .sort((a, b) => a.fechaInicio.localeCompare(b.fechaInicio))[0] || null;
  return { saldo, proxima };
}

export function clearSolicitudesVacacion() {
  clearTable(VACACIONES_TABLE);
}
