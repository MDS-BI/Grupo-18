import { BASE_FIELDS, getConfig } from './module-config.js';
import { validarRut } from './rrhh/calculo/rut.js';

export const ENTITY_KEY = 'erp_base_module:entities';
export const DOCUMENT_KEY = 'erp_base_module:documents';
export const NOVEDADES_KEY = 'erp_rrhh:novedades';
export const LIQUIDACIONES_KEY = 'erp_rrhh:liquidaciones';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return new Date().toISOString();
}

function readList(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}

function normalizeText(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function isValidDate(value) {
  if (typeof value !== 'string') return false;
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

function isBlank(value) {
  return (
    value === undefined || value === null || (typeof value === 'string' && value.trim() === '')
  );
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : NaN;
}

function declaredCustomFields(target) {
  const config = getConfig();
  return (config.customFields || []).filter((field) => field.target === target);
}

function customFieldValue(field, value) {
  if (field.type === 'number') return toNumber(value);
  return typeof value === 'string' ? value.trim() : value;
}

function copyBaseFields(source, target) {
  const result = {};
  for (const key of BASE_FIELDS[target]) {
    if (!Object.prototype.hasOwnProperty.call(source, key)) continue;
    const value = source[key];
    if (key === 'folio' || key === 'quantity') {
      result[key] = isBlank(value) ? undefined : toNumber(value);
    } else if (['subtotal', 'discount', 'taxAmount', 'totalAmount', 'creditLimit'].includes(key)) {
      result[key] = isBlank(value) ? undefined : toNumber(value);
    } else if (typeof value === 'string') {
      result[key] = value.trim();
    } else {
      result[key] = value;
    }
    if (result[key] === undefined) delete result[key];
  }
  return result;
}

function copyCustomFields(source, target) {
  const result = {};
  for (const field of declaredCustomFields(target)) {
    if (!Object.prototype.hasOwnProperty.call(source, field.key)) continue;
    const value = source[field.key];
    if (isBlank(value)) continue;
    result[field.key] = customFieldValue(field, value);
  }
  return result;
}

function validateCustomFields(record, target, errors) {
  for (const field of declaredCustomFields(target)) {
    const value = record[field.key];
    if (field.required && isBlank(value)) {
      errors[field.key] = `El campo "${field.label}" es obligatorio.`;
      continue;
    }
    if (isBlank(value)) continue;
    if (field.type === 'number' && !Number.isFinite(Number(value))) {
      errors[field.key] = `El campo "${field.label}" debe ser un número.`;
    } else if (field.type === 'select' && field.options && !field.options.includes(value)) {
      errors[field.key] = `El campo "${field.label}" debe ser uno de: ${field.options.join(', ')}.`;
    } else if (field.type === 'date' && !isValidDate(value)) {
      errors[field.key] = `El campo "${field.label}" debe ser una fecha válida (AAAA-MM-DD).`;
    }
  }
}

export function validateEntity(entity = {}) {
  const errors = {};
  if (isBlank(entity.name)) errors.name = 'El nombre es obligatorio.';
  if (isBlank(entity.code)) errors.code = 'El código es obligatorio.';
  if (!isBlank(entity.rut) && !validarRut(entity.rut)) {
    errors.rut = 'El RUT no tiene un dígito verificador válido.';
  }

  if (!isBlank(entity.email) && !EMAIL_PATTERN.test(String(entity.email).trim())) {
    errors.email = 'El correo electrónico no tiene un formato válido.';
  }
  if (!isBlank(entity.creditLimit)) {
    const limit = toNumber(entity.creditLimit);
    if (!Number.isFinite(limit) || limit < 0) {
      errors.creditLimit = 'El límite de crédito debe ser un número no negativo.';
    }
  }
  if (!isBlank(entity.targetDate) && !isValidDate(entity.targetDate)) {
    errors.targetDate = 'La fecha objetivo debe ser una fecha válida (AAAA-MM-DD).';
  }

  validateCustomFields(entity, 'entity', errors);
  return { valid: Object.keys(errors).length === 0, errors };
}

export function loadEntities() {
  return readList(ENTITY_KEY);
}

export function saveEntities(entities) {
  writeList(ENTITY_KEY, entities);
  return entities;
}

export function addEntity(input = {}) {
  const record = {
    ...copyBaseFields(input, 'entity'),
    ...copyCustomFields(input, 'entity')
  };
  const validation = validateEntity(record);
  if (!validation.valid) {
    const error = new Error('Entidad inválida.');
    error.errors = validation.errors;
    throw error;
  }
  const timestamp = now();
  const entity = {
    ...record,
    id: createId(),
    entity_id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const entities = loadEntities();
  entities.push(entity);
  saveEntities(entities);
  return entity;
}

export function updateEntity(id, updates = {}) {
  const entities = loadEntities();
  const index = entities.findIndex((entity) => entity.id === id);
  if (index === -1) {
    throw new Error('La entidad seleccionada ya no existe.');
  }
  const merged = {
    ...entities[index],
    ...copyBaseFields(updates, 'entity'),
    ...copyCustomFields(updates, 'entity'),
    updatedAt: now()
  };
  delete merged.entity_id;
  merged.entity_id = entities[index].entity_id;
  delete merged.id;
  merged.id = entities[index].id;
  delete merged.createdAt;
  merged.createdAt = entities[index].createdAt;

  const validation = validateEntity(merged);
  if (!validation.valid) {
    const error = new Error('Entidad inválida.');
    error.errors = validation.errors;
    throw error;
  }
  entities[index] = merged;
  saveEntities(entities);
  return merged;
}

function rrhhRows(key) {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function hasClosedLiquidations(entityId) {
  return rrhhRows(LIQUIDACIONES_KEY).some(
    (row) =>
      (row.trabajador?.entityId === entityId || row.trabajador?.id === entityId) &&
      (row.estado === 'aprobada' || row.estado === 'pagada')
  );
}

function deleteNovedadesForEntity(entityId) {
  try {
    const rows = rrhhRows(NOVEDADES_KEY);
    const kept = rows.filter((row) => row.trabajadorEntityId !== entityId);
    if (kept.length !== rows.length) {
      localStorage.setItem(NOVEDADES_KEY, JSON.stringify(kept));
    }
    return rows.length - kept.length;
  } catch {
    return 0;
  }
}

/**
 * Delete a worker entity.
 *
 * Without approved/paid liquidations, the entity and its novedades are removed.
 * When a closed liquidation exists the entity is logically deactivated instead,
 * so the legal payroll record remains reproducible.
 */
export function deleteEntity(id) {
  const entities = loadEntities();
  const index = entities.findIndex((item) => item.id === id);
  if (index === -1) return false;
  const entity = entities[index];

  if (hasClosedLiquidations(entity.entity_id)) {
    const timestamp = now();
    entities[index] = {
      ...entity,
      bajaLogica: true,
      activo: false,
      deletedAt: timestamp,
      updatedAt: timestamp
    };
    saveEntities(entities);
    return true;
  }

  saveEntities(entities.filter((item) => item.id !== id));
  deleteDocumentsForEntity(entity.entity_id);
  deleteNovedadesForEntity(entity.entity_id);
  return true;
}

export function searchEntities(term) {
  const query = normalizeText(term ?? '').trim();
  const entities = loadEntities();
  if (!query) return entities;
  return entities.filter((entity) =>
    Object.values(entity).some((value) => normalizeText(value ?? '').includes(query))
  );
}

export function validateDocument(document = {}) {
  const errors = {};
  const entityId = document.entity_id ?? document.entityId;

  if (isBlank(entityId)) {
    errors.entityId = 'La entidad seleccionada es obligatoria.';
  } else if (!loadEntities().some((entity) => entity.entity_id === entityId)) {
    errors.entityId = 'La entidad seleccionada no existe.';
  }

  if (isBlank(document.folio)) {
    errors.folio = 'El folio es obligatorio.';
  } else {
    const folio = toNumber(document.folio);
    if (!Number.isInteger(folio) || folio <= 0) {
      errors.folio = 'El folio debe ser un entero positivo.';
    }
  }

  if (isBlank(document.startDate)) {
    errors.startDate = 'La fecha de inicio es obligatoria.';
  } else if (!isValidDate(document.startDate)) {
    errors.startDate = 'La fecha de inicio debe ser una fecha válida (AAAA-MM-DD).';
  }

  if (isBlank(document.endDate)) {
    errors.endDate = 'La fecha de fin es obligatoria.';
  } else if (!isValidDate(document.endDate)) {
    errors.endDate = 'La fecha de fin debe ser una fecha válida (AAAA-MM-DD).';
  } else if (
    !isBlank(document.startDate) &&
    isValidDate(document.startDate) &&
    document.endDate < document.startDate
  ) {
    errors.endDate = 'La fecha de fin debe ser igual o posterior a la fecha de inicio.';
  }

  if (!isBlank(document.quantity)) {
    const quantity = toNumber(document.quantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      errors.quantity = 'La cantidad debe ser un entero positivo.';
    }
  }

  for (const [key, label] of [
    ['subtotal', 'El subtotal'],
    ['discount', 'El descuento'],
    ['taxAmount', 'El impuesto'],
    ['totalAmount', 'El importe total']
  ]) {
    if (isBlank(document[key])) continue;
    const amount = toNumber(document[key]);
    if (!Number.isFinite(amount) || amount < 0) {
      errors[key] = `${label} debe ser un número no negativo.`;
    }
  }

  if (!isBlank(document.subtotal) && !isBlank(document.discount)) {
    if (toNumber(document.discount) > toNumber(document.subtotal)) {
      errors.discount = 'El descuento no puede superar el subtotal.';
    }
  }

  validateCustomFields(document, 'document', errors);

  const lifecycle = getConfig().statusLifecycle;
  if (lifecycle && !isBlank(document.status)) {
    const status = String(document.status).trim();
    if (!lifecycle.statuses.includes(status)) {
      errors.status = `El estado debe ser uno de: ${lifecycle.statuses.join(', ')}.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function loadDocuments() {
  return readList(DOCUMENT_KEY);
}

export function saveDocuments(documents) {
  writeList(DOCUMENT_KEY, documents);
  return documents;
}

export function addDocument(input = {}) {
  const record = {
    ...copyBaseFields(input, 'document'),
    ...copyCustomFields(input, 'document')
  };
  record.entity_id = input.entity_id ?? input.entityId;
  const validation = validateDocument(record);
  if (!validation.valid) {
    const error = new Error('Documento inválido.');
    error.errors = validation.errors;
    throw error;
  }
  const timestamp = now();
  const document = {
    ...record,
    id: createId(),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  const documents = loadDocuments();
  documents.push(document);
  saveDocuments(documents);
  return document;
}

export function updateDocument(id, updates = {}) {
  const documents = loadDocuments();
  const index = documents.findIndex((document) => document.id === id);
  if (index === -1) {
    throw new Error('El documento seleccionado ya no existe.');
  }
  const current = documents[index];

  if (updates.status !== undefined && updates.status !== current.status) {
    const lifecycle = getConfig().statusLifecycle;
    if (lifecycle) {
      const allowed = lifecycle.transitions[current.status] || [];
      if (!allowed.includes(updates.status)) {
        throw new Error(`Transición de estado inválida: ${current.status} → ${updates.status}.`);
      }
    }
  }

  const merged = {
    ...current,
    ...copyBaseFields(updates, 'document'),
    ...copyCustomFields(updates, 'document'),
    updatedAt: now()
  };
  if (updates.entity_id !== undefined || updates.entityId !== undefined) {
    merged.entity_id = updates.entity_id ?? updates.entityId;
  }
  delete merged.id;
  merged.id = current.id;
  delete merged.createdAt;
  merged.createdAt = current.createdAt;

  const validation = validateDocument(merged);
  if (!validation.valid) {
    const error = new Error('Documento inválido.');
    error.errors = validation.errors;
    throw error;
  }
  documents[index] = merged;
  saveDocuments(documents);
  return merged;
}

export function deleteDocument(id) {
  const documents = loadDocuments();
  const next = documents.filter((document) => document.id !== id);
  saveDocuments(next);
  return next.length !== documents.length;
}

export function deleteDocumentsForEntity(entityId) {
  const documents = loadDocuments();
  const next = documents.filter((document) => document.entity_id !== entityId);
  saveDocuments(next);
  return documents.length - next.length;
}

export function clearAll() {
  localStorage.removeItem(ENTITY_KEY);
  localStorage.removeItem(DOCUMENT_KEY);
}
