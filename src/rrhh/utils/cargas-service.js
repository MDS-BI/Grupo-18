/**
 * Family dependants and family allowance (US8, FR-092–FR-094).
 *
 * Dependants are third-party personal data: only the RR.HH. administrator and
 * the payroll analyst see them; a worker sees only their own; the jefatura has
 * no access. Dependants are never deleted, only ended with an end date.
 */

import { clearTable, findById, insert, list, update } from '../storage-rrhh.js';
import { formatearRut, limpiarRut, validarRut } from '../calculo/rut.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { getTrabajador } from './trabajadores-service.js';
import { rangoPeriodo } from './periodos.js';
import { aFechaISO, esFechaISO, rangosSeSuperponen, sumarAnios, sumarDias } from './fechas.js';
import { errorFechaNoFutura } from './limites-fechas.js';

export const CARGAS_TABLE = 'cargas-familiares';
export const PARENTESCOS = ['hijo', 'conyuge', 'padre_madre', 'otro'];
export const PARENTESCO_LABELS = {
  hijo: 'Hijo/a',
  conyuge: 'Cónyuge o conviviente civil',
  padre_madre: 'Madre/padre',
  otro: 'Otro'
};
export const TIPOS_CARGA = ['simple', 'maternal', 'invalidez'];
export const TIPO_CARGA_LABELS = { simple: 'Simple', maternal: 'Maternal', invalidez: 'Invalidez' };
export const DIAS_AVISO_EDAD = 30;

const FIN_ABIERTO = '9999-12-31';

function fail(errors, code = 'CARGA_INVALIDA') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(messages.join(' '));
  error.errors = messages;
  error.code = code;
  throw error;
}

function auditar(accion, registroId, campos, motivo, viewer) {
  registrarAuditoria({
    accion,
    tabla: CARGAS_TABLE,
    registroId,
    camposModificados: campos,
    motivo,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
}

/* ---------- Permissions ---------- */

export function puedeVerCargas(viewer) {
  return ['administrador', 'analista', 'trabajador'].includes(viewer?.role);
}

export function puedeGestionarCargas(viewer) {
  return ['administrador', 'analista'].includes(viewer?.role);
}

function assertVer(viewer, entityId) {
  if (!puedeVerCargas(viewer)) {
    fail('No tienes autorización para ver cargas familiares.', 'PERMISO_DENEGADO');
  }
  if (
    viewer.role === 'trabajador' &&
    entityId &&
    String(viewer.trabajadorId) !== String(entityId)
  ) {
    fail('Solo puedes ver tus propias cargas familiares.', 'PERMISO_DENEGADO');
  }
}

/* ---------- Age limit and validity ---------- */

/** Date on which a dependant stops qualifying by age, or null when there is no limit. */
export function fechaLimiteEdad(carga) {
  if (!carga || carga.tipo === 'invalidez' || carga.parentesco !== 'hijo') return null;
  if (!esFechaISO(carga.fechaNacimiento)) return null;
  return sumarAnios(carga.fechaNacimiento, carga.estudiante ? 24 : 18);
}

/** Last day the dependant is valid, combining the end date and the age limit. */
export function finVigencia(carga) {
  const candidatos = [carga.vigenteHasta || FIN_ABIERTO];
  const limite = fechaLimiteEdad(carga);
  if (limite) candidatos.push(sumarDias(limite, -1));
  return candidatos.sort()[0];
}

export function vigenteEn(carga, fecha) {
  const day = aFechaISO(fecha);
  return carga.vigenteDesde <= day && day <= finVigencia(carga);
}

function vigenteEnRango(carga, inicio, fin) {
  return rangosSeSuperponen(carga.vigenteDesde, finVigencia(carga), inicio, fin);
}

/* ---------- Validation ---------- */

function normalizar(input = {}) {
  return {
    entityId: String(input.entityId || ''),
    nombre: String(input.nombre || '').trim(),
    rut: String(input.rut || '').trim(),
    parentesco: input.parentesco || '',
    fechaNacimiento: input.fechaNacimiento || '',
    tipo: input.tipo || 'simple',
    estudiante: Boolean(input.estudiante),
    resolucionNumero: String(input.resolucionNumero || '').trim(),
    resolucionFecha: input.resolucionFecha || '',
    vigenteDesde: input.vigenteDesde || '',
    vigenteHasta: input.vigenteHasta || ''
  };
}

/**
 * Validate a dependant. With `sinTrabajador` the worker checks are skipped, so
 * the dependants typed in the new-worker form can be validated before the
 * worker exists (and nothing is stored if any of them is invalid).
 */
export function validarCarga(input = {}, { excluirId, sinTrabajador = false } = {}) {
  const carga = normalizar(input);
  const errors = [];
  const trabajador = carga.entityId ? getTrabajador(carga.entityId) : null;
  if (sinTrabajador) {
    // The worker is created right after this validation.
  } else if (!trabajador) errors.push('Selecciona el trabajador al que pertenece la carga.');
  else if (!trabajador.activo) {
    errors.push('El trabajador está desvinculado: no se le pueden registrar cargas.');
  }
  if (!carga.nombre) errors.push('El nombre de la carga es obligatorio.');
  if (!validarRut(carga.rut)) errors.push('El RUT de la carga no es válido.');
  if (!PARENTESCOS.includes(carga.parentesco)) errors.push('Selecciona el parentesco.');
  if (!esFechaISO(carga.fechaNacimiento)) errors.push('La fecha de nacimiento no es válida.');
  else {
    const nacimiento = errorFechaNoFutura(carga.fechaNacimiento, 'La fecha de nacimiento');
    if (nacimiento) errors.push(nacimiento);
  }
  if (!TIPOS_CARGA.includes(carga.tipo)) errors.push('Selecciona el tipo de carga.');
  if (!carga.resolucionNumero) {
    errors.push('El número de la resolución de reconocimiento es obligatorio.');
  }
  if (!esFechaISO(carga.resolucionFecha)) {
    errors.push('La fecha de la resolución de reconocimiento es obligatoria.');
  } else {
    const resolucion = errorFechaNoFutura(carga.resolucionFecha, 'La fecha de la resolución');
    if (resolucion) errors.push(resolucion);
  }
  if (!esFechaISO(carga.vigenteDesde)) errors.push('La fecha de inicio de vigencia no es válida.');
  else {
    const desde = errorFechaNoFutura(carga.vigenteDesde, 'La fecha de inicio de vigencia');
    if (desde) errors.push(desde);
  }
  if (carga.vigenteHasta && !esFechaISO(carga.vigenteHasta)) {
    errors.push('La fecha de término de vigencia no es válida.');
  } else if (
    carga.vigenteHasta &&
    esFechaISO(carga.vigenteDesde) &&
    carga.vigenteHasta < carga.vigenteDesde
  ) {
    errors.push('La fecha de término debe ser igual o posterior al inicio de vigencia.');
  }

  if (errors.length === 0) {
    const rut = limpiarRut(carga.rut);
    const duplicada = list(CARGAS_TABLE).find(
      (row) =>
        row.id !== excluirId &&
        limpiarRut(row.rut) === rut &&
        rangosSeSuperponen(
          carga.vigenteDesde,
          finVigencia(carga),
          row.vigenteDesde,
          finVigencia(row)
        )
    );
    if (duplicada) {
      errors.push(
        String(duplicada.entityId) === carga.entityId
          ? 'Esta carga ya está registrada y vigente para el trabajador.'
          : 'La carga ya está reconocida y vigente para otro trabajador de la empresa.'
      );
    }
  }
  return { valid: errors.length === 0, errors, carga };
}

/* ---------- Queries ---------- */

export function listCargas({ viewer, entityId, incluirTerminadas = true, fecha } = {}) {
  if (viewer) {
    assertVer(viewer, entityId || (viewer.role === 'trabajador' ? viewer.trabajadorId : ''));
  }
  const ownId = viewer?.role === 'trabajador' ? String(viewer.trabajadorId) : '';
  const hoy = aFechaISO(fecha);
  return list(CARGAS_TABLE)
    .filter((row) => !ownId || String(row.entityId) === ownId)
    .filter((row) => !entityId || String(row.entityId) === String(entityId))
    .map((row) => ({
      ...row,
      trabajador: getTrabajador(row.entityId)?.name || row.entityId,
      vigente: vigenteEn(row, hoy),
      fechaLimiteEdad: fechaLimiteEdad(row)
    }))
    .filter((row) => incluirTerminadas || row.vigente)
    .sort((a, b) => a.trabajador.localeCompare(b.trabajador) || a.nombre.localeCompare(b.nombre));
}

export function getCarga(id) {
  return findById(CARGAS_TABLE, id);
}

/**
 * Weighted number of dependants that count for the allowance in a period:
 * valid at least one day of the period; an invalidity dependant counts double.
 */
export function cargasParaAsignacion(entityId, periodo) {
  const id = typeof periodo === 'string' ? periodo : periodo?.id || periodo?.periodo;
  const { fechaInicio, fechaFin } =
    typeof periodo === 'object' && periodo?.fechaInicio ? periodo : rangoPeriodo(id);
  return list(CARGAS_TABLE)
    .filter(
      (row) =>
        String(row.entityId) === String(entityId) && vigenteEnRango(row, fechaInicio, fechaFin)
    )
    .reduce((total, row) => total + (row.tipo === 'invalidez' ? 2 : 1), 0);
}

/** Dependants reaching the age limit within the next 30 days (FR-094). */
export function avisosEdadLimite({ hoy, dias = DIAS_AVISO_EDAD } = {}) {
  const desde = aFechaISO(hoy);
  const hasta = sumarDias(desde, dias);
  return list(CARGAS_TABLE)
    .map((row) => ({ row, limite: fechaLimiteEdad(row) }))
    .filter(
      ({ row, limite }) => limite && limite > desde && limite <= hasta && vigenteEn(row, desde)
    )
    .map(({ row, limite }) => ({
      id: row.id,
      entityId: row.entityId,
      trabajador: getTrabajador(row.entityId)?.name || row.entityId,
      carga: row.nombre,
      fechaFinVigencia: sumarDias(limite, -1)
    }))
    .sort((a, b) => a.fechaFinVigencia.localeCompare(b.fechaFinVigencia));
}

/** Number of valid dependants per worker on a date (one pass over the table). */
export function conteoCargasVigentes({ hoy } = {}) {
  const fecha = aFechaISO(hoy);
  const conteo = new Map();
  for (const row of list(CARGAS_TABLE)) {
    if (!vigenteEn(row, fecha)) continue;
    const key = String(row.entityId);
    conteo.set(key, (conteo.get(key) || 0) + 1);
  }
  return conteo;
}

export function resumenCargasTrabajador(entityId, { hoy } = {}) {
  const fecha = aFechaISO(hoy);
  const propias = list(CARGAS_TABLE).filter((row) => String(row.entityId) === String(entityId));
  return {
    vigentes: propias.filter((row) => vigenteEn(row, fecha)).length,
    proximoAviso:
      avisosEdadLimite({ hoy: fecha }).find((row) => String(row.entityId) === String(entityId)) ||
      null
  };
}

/* ---------- Commands ---------- */

export function crearCarga(input = {}, viewer) {
  if (!puedeGestionarCargas(viewer)) {
    fail('No tienes autorización para registrar cargas familiares.', 'PERMISO_DENEGADO');
  }
  const { valid, errors, carga } = validarCarga(input);
  if (!valid) fail(errors);
  const created = insert(
    CARGAS_TABLE,
    { ...carga, rut: formatearRut(carga.rut) },
    { prefix: 'carga' }
  );
  auditar('crear', created.id, Object.keys(carga), 'Registro de carga familiar', viewer);
  return created;
}

export function actualizarCarga(id, changes = {}, viewer) {
  if (!puedeGestionarCargas(viewer)) {
    fail('No tienes autorización para modificar cargas familiares.', 'PERMISO_DENEGADO');
  }
  const current = getCarga(id);
  if (!current) fail('La carga no existe.', 'CARGA_NO_ENCONTRADA');
  const { valid, errors, carga } = validarCarga(
    { ...current, ...changes, entityId: current.entityId },
    { excluirId: id }
  );
  if (!valid) fail(errors);
  const updated = update(CARGAS_TABLE, id, { ...carga, rut: formatearRut(carga.rut) });
  auditar('editar', id, Object.keys(changes), 'Modificación de carga familiar', viewer);
  return updated;
}

export function terminarCarga(id, fechaTermino, viewer) {
  if (!puedeGestionarCargas(viewer)) {
    fail('No tienes autorización para terminar cargas familiares.', 'PERMISO_DENEGADO');
  }
  const current = getCarga(id);
  if (!current) fail('La carga no existe.', 'CARGA_NO_ENCONTRADA');
  if (!esFechaISO(fechaTermino) || fechaTermino < current.vigenteDesde) {
    fail('Indica una fecha de término válida, igual o posterior al inicio de vigencia.');
  }
  const updated = update(CARGAS_TABLE, id, { vigenteHasta: fechaTermino });
  auditar('editar', id, ['vigenteHasta'], 'Término de carga familiar', viewer);
  return updated;
}

export function clearCargas() {
  clearTable(CARGAS_TABLE);
}
