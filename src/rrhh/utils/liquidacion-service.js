import { createDemoLiquidacion, validateLiquidacion } from './liquidacion-data.js';

export const STORAGE_KEY = 'erp_rrhh:liquidaciones';

function getStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function readAll() {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(liquidaciones) {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY, JSON.stringify(liquidaciones));
}

/** Persist a liquidation snapshot, replacing an existing record with the same id. */
export function saveLiquidacion(liquidacion) {
  const validation = validateLiquidacion(liquidacion);
  if (!validation.valid) {
    const error = new Error(`Liquidación inválida: ${validation.errors.join(' ')}`);
    error.errors = validation.errors;
    throw error;
  }
  const liquidaciones = readAll();
  const index = liquidaciones.findIndex((item) => item.id === liquidacion.id);
  if (index >= 0) liquidaciones[index] = clone(liquidacion);
  else liquidaciones.push(clone(liquidacion));
  writeAll(liquidaciones);
  return clone(liquidacion);
}

/** List every stored liquidation snapshot. */
export function listLiquidaciones() {
  return readAll();
}

/**
 * Load a liquidation by id. With no id, return the first stored record or a
 * demo snapshot when the store is empty.
 */
export function loadLiquidacion(id) {
  const liquidaciones = readAll();
  if (id) return liquidaciones.find((item) => item.id === id) || null;
  if (liquidaciones.length > 0) return liquidaciones[0];
  return saveLiquidacion(createDemoLiquidacion());
}

/** Clear stored liquidations (used by tests and explicit resets). */
export function clearLiquidaciones() {
  const storage = getStorage();
  if (storage) storage.removeItem(STORAGE_KEY);
}
