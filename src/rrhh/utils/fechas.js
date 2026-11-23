/**
 * Small date helpers shared by vacaciones, cargas and reportes.
 * Dates are ISO strings (YYYY-MM-DD) and are compared as calendar days.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function esFechaISO(value) {
  if (!ISO_DATE.test(String(value || ''))) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Today's local calendar date as YYYY-MM-DD. */
export function hoyISO(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function aFechaISO(value) {
  if (!value) return hoyISO();
  if (value instanceof Date) return hoyISO(value);
  return String(value).slice(0, 10);
}

export function sumarDias(iso, dias) {
  const date = new Date(`${iso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

export function sumarAnios(iso, anios) {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y + anios, m - 1, d));
  // 29-feb on a non-leap year rolls to 1-mar, which is the legal reading.
  return date.toISOString().slice(0, 10);
}

/** Same day `meses` months later (clamped to the last day of short months). */
export function sumarMeses(iso, meses) {
  const [y, m, d] = iso.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + meses, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

export function diasEntre(desde, hasta) {
  const a = new Date(`${desde}T00:00:00Z`);
  const b = new Date(`${hasta}T00:00:00Z`);
  return Math.round((b - a) / 86400000);
}

/** Number of complete months elapsed between two dates (never negative). */
export function mesesCompletos(desde, hasta) {
  if (!esFechaISO(desde) || !esFechaISO(hasta) || hasta < desde) return 0;
  const [y1, m1, d1] = desde.split('-').map(Number);
  const [y2, m2, d2] = hasta.split('-').map(Number);
  let meses = (y2 - y1) * 12 + (m2 - m1);
  if (d2 < d1) meses -= 1;
  return Math.max(0, meses);
}

export function rangosSeSuperponen(inicioA, finA, inicioB, finB) {
  return inicioA <= finB && inicioB <= finA;
}

export function redondear2(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}
