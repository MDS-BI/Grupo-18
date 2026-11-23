/**
 * Shared "sensible date" rules. The same limits feed the service validations
 * (so no screen or direct call can store an absurd date) and the `min`/`max`
 * attributes of the date pickers (so the user is never offered one).
 *
 * - Periods: nothing after the current month.
 * - Facts that already happened (hire, termination, attendance start, birth,
 *   recognition resolutions): not in the future.
 * - Plans (vacations, contracts): a bounded horizon ahead.
 * - Every date: not before 1900.
 */

import { hoyISO, sumarDias } from './fechas.js';
import { etiquetaPeriodo } from './periodos.js';

export const FECHA_MINIMA = '1900-01-01';
export const FECHA_MINIMA_LABORAL = '1950-01-01';
export const DIAS_ANTICIPACION_VACACIONES = 365;
export const DIAS_ANTICIPACION_CONTRATO = 365;
export const ANIOS_MAXIMOS_TERMINO_CONTRATO = 5;

function aISO(hoy) {
  if (!hoy) return hoyISO();
  return hoy instanceof Date ? hoyISO(hoy) : String(hoy).slice(0, 10);
}

/** Current payroll period as YYYY-MM. */
export function periodoActual(hoy) {
  return aISO(hoy).slice(0, 7);
}

export function esPeriodoFuturo(periodo, hoy) {
  return Boolean(periodo) && String(periodo) > periodoActual(hoy);
}

/** Keep only periods up to the current month (newest first). */
export function periodosHastaHoy(periodos = [], hoy) {
  return periodos.filter((id) => id && !esPeriodoFuturo(id, hoy));
}

export function mensajePeriodoFuturo(hoy) {
  return `No se puede usar un período futuro: el último período disponible es ${etiquetaPeriodo(periodoActual(hoy))}.`;
}

/** Error message when `fecha` is after today (or before the minimum), else null. */
export function errorFechaNoFutura(fecha, etiqueta, { hoy, minimo = FECHA_MINIMA } = {}) {
  if (!fecha) return null;
  if (fecha > aISO(hoy)) return `${etiqueta} no puede ser una fecha futura.`;
  if (fecha < minimo) return `${etiqueta} no puede ser anterior a ${minimo.slice(0, 4)}.`;
  return null;
}

/** Error message when `fecha` is outside [desde, hasta], else null. */
export function errorFechaEnRango(fecha, etiqueta, { desde, hasta, textoDesde, textoHasta }) {
  if (!fecha) return null;
  if (desde && fecha < desde) {
    return `${etiqueta} ${textoDesde || `no puede ser anterior a ${desde}`}.`;
  }
  if (hasta && fecha > hasta) {
    return `${etiqueta} ${textoHasta || `no puede ser posterior a ${hasta}`}.`;
  }
  return null;
}

export function limiteVacaciones(hoy) {
  const desde = aISO(hoy);
  return { min: desde, max: sumarDias(desde, DIAS_ANTICIPACION_VACACIONES) };
}

export function limiteContrato(hoy) {
  const base = aISO(hoy);
  return {
    minInicio: FECHA_MINIMA_LABORAL,
    maxInicio: sumarDias(base, DIAS_ANTICIPACION_CONTRATO),
    maxTermino: `${Number(base.slice(0, 4)) + ANIOS_MAXIMOS_TERMINO_CONTRATO}${base.slice(4)}`
  };
}

export function limiteFeriados(hoy) {
  const anio = Number(aISO(hoy).slice(0, 4));
  return { min: `${anio - 1}-01-01`, max: `${anio + 1}-12-31` };
}

/** Apply min/max to a date or month input (UI side of the same rules). */
export function acotarInput(node, { min, max } = {}) {
  if (!node) return node;
  if (min) node.min = node.type === 'month' ? min.slice(0, 7) : min;
  if (max) node.max = node.type === 'month' ? max.slice(0, 7) : max;
  return node;
}
