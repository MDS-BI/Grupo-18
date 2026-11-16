import { registrarAuditoria } from './auditoria.js';
import { SENSITIVE_DATA, canAccessSensitive, canViewLine } from './roles.js';

export const MASK = '••••';

export class AccesoDenegadoError extends Error {
  constructor(dataType) {
    super(`Acceso denegado: tu rol no puede consultar ${dataType}.`);
    this.name = 'AccesoDenegadoError';
    this.dataType = dataType;
  }
}

/**
 * Data-layer guard. Denials are audited so failed attempts are traceable even
 * when the request did not originate from the interface.
 */
export function assertSensitiveAccess(role, dataType, context = {}) {
  if (canAccessSensitive(role, dataType)) return true;
  registrarAuditoria({
    accion: 'acceso_denegado',
    tabla: context.tabla || 'datos_sensibles',
    registroId: context.registroId || '',
    motivo: `Intento de acceso a ${dataType} sin permiso (rol ${role || 'desconocido'}).`,
    actor: role || 'desconocido',
    rol: role || 'desconocido'
  });
  throw new AccesoDenegadoError(dataType);
}

export function canAccess(role, dataType) {
  return canAccessSensitive(role, dataType);
}

/** Replace a sensitive value with a mask before it reaches the DOM. */
export function maskSensitive(value) {
  if (value === undefined || value === null || value === '') return MASK;
  return MASK;
}

/**
 * Return a copy of the liquidation safe for the viewer role. Unauthorized
 * lines are removed entirely, not merely hidden with CSS.
 */
export function filterLiquidacionForViewer(liquidacion, viewer = {}) {
  if (!liquidacion) return liquidacion;
  const lineas = (liquidacion.lineas || []).filter((line) => canViewLine(line, viewer));
  const filtered = { ...liquidacion, lineas };
  if (!canAccessSensitive(viewer.role, SENSITIVE_DATA.sueldos)) {
    filtered.sueldoBase = null;
    filtered.totalImponible = null;
    filtered.trabajador = liquidacion.trabajador
      ? {
          ...liquidacion.trabajador,
          banco: undefined,
          numeroCuenta: undefined
        }
      : liquidacion.trabajador;
  }
  return filtered;
}

/** Audit a successful sensitive read. */
export function auditarConsulta({ tabla, registroId, motivo = '' }) {
  return registrarAuditoria({ accion: 'ver_sensible', tabla, registroId, motivo });
}
