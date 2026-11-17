/** Format an integer amount as Chilean pesos, e.g. 1200000 -> "$1.200.000". */
export function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const rounded = Math.round(number);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${digits}`;
}

/** Format an ISO date (YYYY-MM-DD) as dd/mm/yyyy for the Chilean UI. */
export function formatDate(value) {
  if (!value) return '—';
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '—';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function trimDecimal(value) {
  return value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

/** Format a rate expressed as a fraction, e.g. 0.105 -> "10,5%". */
export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${trimDecimal(number * 100)}%`;
}

/** Format a factor, e.g. 1.5 -> "1,5". */
export function formatFactor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return trimDecimal(number);
}

export const formatCLP = formatMoney;
export const formatDateCL = formatDate;
