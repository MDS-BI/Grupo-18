/** Pure statistics helpers for management reports (US10). */

export function mediana(valores = []) {
  const numeros = valores
    .map(Number)
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (numeros.length === 0) return null;
  const medio = Math.floor(numeros.length / 2);
  return numeros.length % 2 === 0 ? (numeros[medio - 1] + numeros[medio]) / 2 : numeros[medio];
}

/** Percentage change from `anterior` to `actual`; null when there is no base. */
export function variacionPorcentual(actual, anterior) {
  const a = Number(actual);
  const b = Number(anterior);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  return Math.round(((a - b) / b) * 1000) / 10;
}

/** Gap between two medians as a percentage of the reference median. */
export function brechaPorcentual(referencia, comparada) {
  const r = Number(referencia);
  const c = Number(comparada);
  if (!Number.isFinite(r) || !Number.isFinite(c) || r === 0) return null;
  return Math.round(((r - c) / r) * 1000) / 10;
}
