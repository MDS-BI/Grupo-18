import { can } from '../seguridad/roles.js';
import { periodoCerrado } from './periodos.js';

export const ESTADOS_LIQUIDACION = ['borrador', 'calculada', 'aprobada', 'pagada', 'anulada'];

export const ESTADO_LIQUIDACION_LABELS = {
  borrador: 'Borrador',
  calculada: 'Calculada',
  aprobada: 'Aprobada',
  pagada: 'Pagada',
  anulada: 'Anulada'
};

export const TRANSICIONES_LIQUIDACION = {
  borrador: ['calculada', 'anulada'],
  calculada: ['borrador', 'aprobada', 'anulada'],
  aprobada: ['pagada', 'anulada'],
  pagada: [],
  anulada: []
};

const PERMISO_POR_ESTADO = {
  calculada: 'canCalculate',
  aprobada: 'canApproveLiquidaciones',
  pagada: 'canPayLiquidaciones',
  anulada: 'canAnularLiquidaciones',
  borrador: 'canCalculate'
};

export class TransicionLiquidacionError extends Error {
  constructor(message, code = 'TRANSICION_INVALIDA') {
    super(message);
    this.name = 'TransicionLiquidacionError';
    this.code = code;
  }
}

export function transicionValida(desde, hasta) {
  return Boolean(TRANSICIONES_LIQUIDACION[desde]?.includes(hasta));
}

export function puedeCambiarEstado(viewer, hasta) {
  const permission = PERMISO_POR_ESTADO[hasta];
  return permission ? can(viewer?.role, permission) : false;
}

/**
 * Validate a lifecycle transition, the actor permission and the period lock.
 * A closed period freezes every stored liquidation.
 */
export function validarCambioEstado(liquidacion, hasta, context = {}) {
  const errors = [];
  if (!liquidacion) return { valid: false, errors: ['La liquidación no existe.'] };
  if (!ESTADOS_LIQUIDACION.includes(hasta)) {
    errors.push(`Estado desconocido: ${hasta}.`);
  } else if (!transicionValida(liquidacion.estado, hasta)) {
    errors.push(`No se puede pasar de ${liquidacion.estado} a ${hasta}.`);
  }
  if (!puedeCambiarEstado(context.viewer, hasta)) {
    errors.push(`Tu rol no puede dejar la liquidación en estado ${hasta}.`);
  }
  if (
    periodoCerrado(context.periodo) ||
    liquidacion.periodo?.cerrado === true ||
    context.periodoCerrado === true
  ) {
    errors.push('El período está cerrado: la liquidación es de solo lectura.');
  }
  if (hasta === 'anulada' && !String(context.motivo || '').trim()) {
    errors.push('La anulación requiere un motivo.');
  }
  return { valid: errors.length === 0, errors };
}

export function assertCambioEstado(liquidacion, hasta, context = {}) {
  const validation = validarCambioEstado(liquidacion, hasta, context);
  if (!validation.valid) {
    throw new TransicionLiquidacionError(validation.errors.join(' '));
  }
  return true;
}

export function estadosSiguientes(estado) {
  return [...(TRANSICIONES_LIQUIDACION[estado] || [])];
}

export function puedeEditarLiquidacion(liquidacion, viewer, periodo) {
  if (!liquidacion) return false;
  if (periodoCerrado(periodo) || liquidacion.periodo?.cerrado === true) return false;
  if (!['borrador', 'calculada'].includes(liquidacion.estado)) return false;
  return can(viewer?.role, 'canCalculate') || liquidacion.estado === 'borrador';
}
