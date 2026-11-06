/**
 * Generic storage for the RRHH extension tables.
 *
 * The base module keeps its own tables under `erp_base_module:*`. Every RRHH
 * table lives under its own `erp_rrhh:<tabla>` key so the base code can keep
 * evolving without migrations.
 */

export const RRHH_PREFIX = 'erp_rrhh:';

export function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

export function tableKey(table) {
  return table.startsWith(RRHH_PREFIX) ? table : `${RRHH_PREFIX}${table}`;
}

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

export function createId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function now() {
  return new Date().toISOString();
}

export function readTable(table) {
  if (!storageAvailable()) return [];
  try {
    const raw = localStorage.getItem(tableKey(table));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeTable(table, rows) {
  if (!storageAvailable()) return rows;
  localStorage.setItem(tableKey(table), JSON.stringify(rows));
  return rows;
}

export function clearTable(table) {
  if (storageAvailable()) localStorage.removeItem(tableKey(table));
}

export function list(table) {
  return readTable(table).map(clone);
}

export function findById(table, id) {
  return clone(readTable(table).find((row) => row.id === id) || null);
}

export function insert(table, record, { prefix = 'id', timestamps = true } = {}) {
  const rows = readTable(table);
  const timestamp = now();
  const stored = {
    ...clone(record),
    id: record.id || createId(prefix),
    ...(timestamps ? { createdAt: record.createdAt || timestamp, updatedAt: timestamp } : {})
  };
  rows.push(stored);
  writeTable(table, rows);
  return clone(stored);
}

export function update(table, id, changes) {
  const rows = readTable(table);
  const index = rows.findIndex((row) => row.id === id);
  if (index === -1) return null;
  rows[index] = {
    ...rows[index],
    ...clone(changes),
    id,
    updatedAt: now()
  };
  writeTable(table, rows);
  return clone(rows[index]);
}

export function remove(table, id) {
  const rows = readTable(table);
  const next = rows.filter((row) => row.id !== id);
  if (next.length === rows.length) return false;
  writeTable(table, next);
  return true;
}

export function replaceWhere(table, predicate, nextRows) {
  const rows = readTable(table);
  const kept = rows.filter((row) => !predicate(row));
  writeTable(table, [...kept, ...clone(nextRows)]);
  return [...kept, ...clone(nextRows)];
}
