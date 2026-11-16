import { list, insert } from '../storage-rrhh.js';
import {
  PARAMETROS_INICIALES,
  TRAMOS_IMPUESTO_INICIALES,
  congelarParametros,
  mapaParametrosVigentes,
  resolverParametro,
  resolverTramoImpuesto
} from '../calculo/parametros.js';

export const PARAMETROS_TABLE = 'parametros';
export const TRAMOS_TABLE = 'tramos_impuesto';

let seeded = false;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/** Load the initial legal parameters once per store. */
export function inicializarParametros({ force = false } = {}) {
  if (seeded && !force) return listParametros();
  const existentes = list(PARAMETROS_TABLE);
  if (force || existentes.length === 0) {
    for (const row of PARAMETROS_INICIALES) insert(PARAMETROS_TABLE, row, { prefix: 'par' });
  } else {
    const claves = new Set(
      existentes.map((row) => `${row.codigo}|${row.vigenciaDesde || ''}`)
    );
    for (const row of PARAMETROS_INICIALES) {
      if (!claves.has(`${row.codigo}|${row.vigenciaDesde || ''}`)) {
        insert(PARAMETROS_TABLE, row, { prefix: 'par' });
      }
    }
  }
  if (force || list(TRAMOS_TABLE).length === 0) {
    for (const row of TRAMOS_IMPUESTO_INICIALES) insert(TRAMOS_TABLE, row, { prefix: 'tra' });
  } else {
    const existentesTramos = list(TRAMOS_TABLE);
    const ids = new Set(existentesTramos.map((row) => row.id));
    for (const row of TRAMOS_IMPUESTO_INICIALES) {
      if (!ids.has(row.id)) insert(TRAMOS_TABLE, row, { prefix: 'tra' });
    }
  }
  seeded = true;
  return listParametros();
}

export function listParametros() {
  const rows = list(PARAMETROS_TABLE);
  return rows.length > 0 ? rows : PARAMETROS_INICIALES.map(clone);
}

export function listTramos() {
  const rows = list(TRAMOS_TABLE);
  return rows.length > 0 ? rows : TRAMOS_IMPUESTO_INICIALES.map(clone);
}

/** All parameters valid on a date, keyed by code. */
export function parametrosVigentes(fecha) {
  inicializarParametros();
  return mapaParametrosVigentes(fecha, listParametros());
}

export function obtenerParametro(codigo, fecha) {
  return resolverParametro(codigo, fecha, listParametros());
}

export function obtenerTramoImpuesto(baseUTM, fecha) {
  return resolverTramoImpuesto(baseUTM, listTramos(), fecha);
}

/** Add a new version of a legal parameter without editing history. */
export function agregarParametro(record) {
  if (!record || !record.codigo || !record.vigenciaDesde) {
    const error = new Error('El parámetro requiere código y fecha de vigencia.');
    error.errors = ['El parámetro requiere código y fecha de vigencia.'];
    throw error;
  }
  return insert(PARAMETROS_TABLE, record, { prefix: 'par' });
}

/** Snapshot used by a period at closing time. */
export function congelarParametrosDeFecha(fecha) {
  inicializarParametros();
  return congelarParametros(fecha, listParametros());
}

/** Reset the in-memory seed flag (tests and explicit demos only). */
export function resetSeedFlag() {
  seeded = false;
}
