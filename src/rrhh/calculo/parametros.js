/**
 * Legal parameter resolution.
 *
 * Legal values are versioned by validity date. A liquidation must snapshot the
 * resolved values at calculation time; this module is only used while
 * calculating, never while rendering an existing liquidation.
 */

export const UNIDADES_PARAMETRO = ['pct', 'UF', 'UTM', 'CLP', 'horas', 'IMM'];

function normalizarFecha(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return match ? match[0] : null;
}

/** Reference values. They can be overridden by the persisted parameter table. */
export const PARAMETROS_INICIALES = [
  { codigo: 'IMM', descripcion: 'Ingreso mínimo mensual', valor: 553553, unidad: 'CLP', vigenciaDesde: '2026-05-01', fuente: 'Ley 21.830' },
  { codigo: 'UF', descripcion: 'Unidad de fomento', valor: 39500, unidad: 'CLP', vigenciaDesde: '2026-01-01', fuente: 'Banco Central de Chile' },
  { codigo: 'UTM', descripcion: 'Unidad tributaria mensual', valor: 71649, unidad: 'CLP', vigenciaDesde: '2026-01-01', fuente: 'SII' },
  { codigo: 'TOPE_IMPONIBLE_AFP_SALUD', descripcion: 'Tope imponible AFP y salud', valor: 90, unidad: 'UF', vigenciaDesde: '2026-02-01', fuente: 'Superintendencia de Pensiones' },
  { codigo: 'TOPE_IMPONIBLE_AFC', descripcion: 'Tope imponible seguro de cesantía', valor: 135.2, unidad: 'UF', vigenciaDesde: '2026-01-01', fuente: 'Indicadores previsionales' },
  { codigo: 'TASA_AFP_TRABAJADOR', descripcion: 'Cotización obligatoria AFP', valor: 10, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'DL 3.500' },
  { codigo: 'COMISION_AFP', descripcion: 'Comisión de la administradora AFP', valor: 1.27, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Superintendencia de Pensiones' },
  { codigo: 'TASA_SALUD_LEGAL', descripcion: 'Cotización legal de salud', valor: 7, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Ley 18.933' },
  { codigo: 'TASA_AFC_TRAB_INDEF', descripcion: 'Seguro de cesantía trabajador (indefinido)', valor: 0.6, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Ley 19.728' },
  { codigo: 'TASA_AFC_TRAB_PLAZO', descripcion: 'Seguro de cesantía trabajador (plazo fijo)', valor: 0, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Ley 19.728' },
  { codigo: 'TASA_AFC_EMP_INDEF', descripcion: 'Seguro de cesantía empleador (indefinido)', valor: 2.4, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Ley 19.728' },
  { codigo: 'TASA_AFC_EMP_PLAZO', descripcion: 'Seguro de cesantía empleador (plazo fijo)', valor: 3.0, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Ley 19.728' },
  { codigo: 'APORTE_EMP_PREVISIONAL', descripcion: 'Aporte previsional del empleador (reforma)', valor: 3.5, unidad: 'pct', vigenciaDesde: '2026-08-01', fuente: 'Ley 21.735' },
  { codigo: 'MUTUAL', descripcion: 'Cotización mutual de seguridad', valor: 0.93, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Ley 16.744' },
  { codigo: 'JORNADA_MAX', descripcion: 'Jornada semanal máxima', valor: 42, unidad: 'horas', vigenciaDesde: '2026-04-26', fuente: 'Ley 21.561' },
  { codigo: 'RECARGO_HORA_EXTRA', descripcion: 'Recargo por horas extraordinarias', valor: 50, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Art. 32 Código del Trabajo' },
  { codigo: 'TOPE_GRATIF_ANUAL_IMM', descripcion: 'Tope anual de gratificación en IMM', valor: 4.75, unidad: 'IMM', vigenciaDesde: '2026-01-01', fuente: 'Art. 50 Código del Trabajo' },
  { codigo: 'TOPE_DESC_VOLUNTARIOS', descripcion: 'Tope legal de descuentos voluntarios', valor: 15, unidad: 'pct', vigenciaDesde: '2026-01-01', fuente: 'Art. 58 Código del Trabajo' }
];

/** Income-tax brackets. `hastaUTM: Infinity` closes the table. */
export const TRAMOS_IMPUESTO_INICIALES = [
  { id: 'tramo-1', desdeUTM: 0, hastaUTM: 13.5, factor: 0, rebajaUTM: 0, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-2', desdeUTM: 13.5, hastaUTM: 30, factor: 0.04, rebajaUTM: 0.54, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-3', desdeUTM: 30, hastaUTM: 50, factor: 0.08, rebajaUTM: 1.74, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-4', desdeUTM: 50, hastaUTM: 70, factor: 0.135, rebajaUTM: 4.49, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-5', desdeUTM: 70, hastaUTM: 90, factor: 0.23, rebajaUTM: 11.14, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-6', desdeUTM: 90, hastaUTM: 120, factor: 0.304, rebajaUTM: 17.78, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-7', desdeUTM: 120, hastaUTM: 310, factor: 0.35, rebajaUTM: 23.3, vigenciaDesde: '2026-01-01' },
  { id: 'tramo-8', desdeUTM: 310, hastaUTM: Infinity, factor: 0.4, rebajaUTM: 38.8, vigenciaDesde: '2026-01-01' }
];

function isVigente(parametro, fecha) {
  const desde = normalizarFecha(parametro.vigenciaDesde);
  const hasta = normalizarFecha(parametro.vigenciaHasta);
  if (desde && fecha < desde) return false;
  if (hasta && fecha > hasta) return false;
  return true;
}

/**
 * Resolve a parameter by code and date. When several records are valid the one
 * with the most recent `vigenciaDesde` wins.
 */
export function resolverParametro(codigo, fecha, parametros = PARAMETROS_INICIALES) {
  const target = normalizarFecha(fecha);
  if (!target) return null;
  const rows = Array.isArray(parametros) ? parametros : Object.values(parametros || {});
  const candidates = rows
    .filter((row) => row && row.codigo === codigo && isVigente(row, target))
    .sort((a, b) => String(b.vigenciaDesde || '').localeCompare(String(a.vigenciaDesde || '')));
  return candidates[0] || null;
}

/** Resolve a parameter value, with an optional fallback. */
export function valorParametro(codigo, fecha, parametros, fallback = null) {
  const row = resolverParametro(codigo, fecha, parametros);
  return row ? Number(row.valor) : fallback;
}

/** Map of every code valid on the given date, keeping newest vigencies. */
export function mapaParametrosVigentes(fecha, parametros = PARAMETROS_INICIALES) {
  const rows = Array.isArray(parametros) ? parametros : Object.values(parametros || {});
  const codes = new Set(rows.map((row) => row.codigo));
  const map = {};
  for (const code of codes) {
    const row = resolverParametro(code, fecha, rows);
    if (row) map[code] = row;
  }
  return map;
}

/** Freeze the parameters applicable on a date into an auditable array. */
export function congelarParametros(fecha, parametros = PARAMETROS_INICIALES) {
  return Object.values(mapaParametrosVigentes(fecha, parametros)).map((row) => ({
    codigo: row.codigo,
    descripcion: row.descripcion,
    valorAplicado: Number(row.valor),
    unidad: row.unidad,
    fechaVigencia: normalizarFecha(row.vigenciaDesde),
    fuente: row.fuente
  }));
}

export function resolverTramoImpuesto(baseUTM, tramos = TRAMOS_IMPUESTO_INICIALES, fecha) {
  const value = Number(baseUTM);
  if (!Number.isFinite(value)) return null;
  const rows = tramos
    .filter((row) => !fecha || isVigente(row, normalizarFecha(fecha)))
    .sort((a, b) => a.desdeUTM - b.desdeUTM);
  return (
    rows.find((row) => value > Number(row.desdeUTM) && value <= Number(row.hastaUTM)) ||
    rows.find((row) => value === 0 && Number(row.desdeUTM) === 0) ||
    null
  );
}

/** Convert a percentage parameter (e.g. 7) to a rate (0.07). */
export function tasaDesdePorcentaje(valor) {
  return Number(valor) / 100;
}
