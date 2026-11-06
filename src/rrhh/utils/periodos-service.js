import { insert, list, update } from '../storage-rrhh.js';
import { can } from '../seguridad/roles.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import {
  crearPeriodo,
  periodoAbierto,
  periodoCerrado,
  rangoPeriodo,
  transicionPeriodoValida,
  validarPeriodo
} from './periodos.js';
import { congelarParametrosDeFecha, obtenerParametro } from './parametros-service.js';

export const PERIODOS_TABLE = 'periodos';

export class PeriodoCerradoError extends Error {
  constructor(periodoId) {
    super(`El período ${periodoId} está cerrado: sus datos son de solo lectura.`);
    this.name = 'PeriodoCerradoError';
    this.code = 'PERIODO_CERRADO';
    this.periodoId = periodoId;
  }
}

export class PeriodoPermisoError extends Error {
  constructor(action) {
    super(`Tu rol no tiene permiso para ${action} el período.`);
    this.name = 'PeriodoPermisoError';
    this.code = 'PERMISO_DENEGADO';
  }
}

export function listPeriodos() {
  return list(PERIODOS_TABLE).sort((a, b) => String(b.id).localeCompare(String(a.id)));
}

export function getPeriodo(id) {
  if (!id) return null;
  return listPeriodos().find((row) => row.id === id || row.periodo === id) || null;
}

/** Ensure a period exists, creating it open if necessary. */
export function asegurarPeriodo(id, extra = {}) {
  const existing = getPeriodo(id);
  if (existing) return existing;
  const created = crearPeriodo({ id, estado: 'abierto', ...extra });
  return insert(PERIODOS_TABLE, created, { prefix: 'per' });
}

function periodoRecord(value) {
  if (!value) return null;
  return typeof value === 'object' ? value : getPeriodo(value);
}

export function isPeriodoCerrado(value) {
  return periodoCerrado(periodoRecord(value));
}

export function assertPeriodoAbierto(value) {
  const periodo = periodoRecord(value);
  if (periodoCerrado(periodo)) {
    throw new PeriodoCerradoError(periodo?.id || value);
  }
  return true;
}

/** Whether a role may close (or reopen) a period. */
export function puedeGestionarPeriodo(viewer) {
  return can(viewer?.role, 'canClosePeriodos');
}

/** Open a period. Jefatura/Administrador only. */
export function abrirPeriodo(id, viewer, extra = {}) {
  if (!puedeGestionarPeriodo(viewer)) throw new PeriodoPermisoError('abrir');
  const existing = getPeriodo(id);
  if (existing && existing.estado !== 'abierto') {
    if (!transicionPeriodoValida(existing.estado, 'abierto')) {
      throw new Error(`No se puede reabrir un período ${existing.estado}.`);
    }
    const reopened = update(PERIODOS_TABLE, existing.id, {
      estado: 'abierto',
      cerradoPor: null,
      fechaCierre: null,
      ...extra
    });
    registrarAuditoria({
      accion: 'abrir_periodo',
      tabla: PERIODOS_TABLE,
      registroId: existing.id,
      motivo: 'Reapertura del período',
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
    return reopened;
  }
  if (existing) return existing;
  const created = asegurarPeriodo(id, extra);
  registrarAuditoria({
    accion: 'abrir_periodo',
    tabla: PERIODOS_TABLE,
    registroId: created.id,
    motivo: 'Apertura del período',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return created;
}

/**
 * Close a period. Closing freezes UF, UTM, IMM and the whole legal parameter
 * set so later changes cannot alter historical liquidations.
 */
export function cerrarPeriodo(id, viewer, extra = {}) {
  if (!puedeGestionarPeriodo(viewer)) throw new PeriodoPermisoError('cerrar');
  const existing = getPeriodo(id) || asegurarPeriodo(id);
  if (periodoCerrado(existing)) throw new PeriodoCerradoError(id);
  if (!transicionPeriodoValida(existing.estado || 'abierto', 'cerrado')) {
    throw new Error('Transición de período inválida.');
  }

  const { fechaFin } = rangoPeriodo(existing.id);
  const parametrosCongelados = congelarParametrosDeFecha(fechaFin);
  const valorUF = Number(
    extra.valorUF ?? parametrosCongelados.find((row) => row.codigo === 'UF')?.valorAplicado ?? obtenerParametro('UF', fechaFin)?.valor
  );
  const valorUTM = Number(
    extra.valorUTM ?? parametrosCongelados.find((row) => row.codigo === 'UTM')?.valorAplicado ?? obtenerParametro('UTM', fechaFin)?.valor
  );
  const ingresoMinimo = Number(
    extra.ingresoMinimo ??
      parametrosCongelados.find((row) => row.codigo === 'IMM')?.valorAplicado ??
      obtenerParametro('IMM', fechaFin)?.valor
  );

  const closed = update(PERIODOS_TABLE, existing.id, {
    ...extra,
    estado: 'cerrado',
    cerradoPor: viewer?.usuario || viewer?.role || 'Jefatura',
    cerradoPorRol: viewer?.role || null,
    fechaCierre: new Date().toISOString(),
    valorUF: Number.isFinite(valorUF) ? valorUF : null,
    valorUTM: Number.isFinite(valorUTM) ? valorUTM : null,
    ingresoMinimo: Number.isFinite(ingresoMinimo) ? ingresoMinimo : null,
    parametrosCongelados
  });

  registrarAuditoria({
    accion: 'cerrar_periodo',
    tabla: PERIODOS_TABLE,
    registroId: existing.id,
    camposModificados: ['estado'],
    motivo: 'Cierre del período y congelamiento de parámetros',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return closed;
}

/** Mark an open period as calculated without closing it. */
export function marcarPeriodoCalculado(id) {
  const existing = getPeriodo(id);
  if (!existing) return asegurarPeriodo(id, { estado: 'calculado' });
  if (periodoCerrado(existing)) throw new PeriodoCerradoError(id);
  if (existing.estado === 'calculado') return existing;
  if (!transicionPeriodoValida(existing.estado, 'calculado')) return existing;
  return update(PERIODOS_TABLE, existing.id, { estado: 'calculado' });
}

export function validarPeriodoRecord(record) {
  return validarPeriodo(record);
}

/** Whether a period still accepts edits (missing periods are treated as open). */
export function puedeEditarEnPeriodo(value) {
  return periodoAbierto(periodoRecord(value));
}

export function clearPeriodos() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:periodos');
}
