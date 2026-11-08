/**
 * Worker files (fichas de trabajadores).
 *
 * The worker identity reuses the base `Entity` record (name, code, taxId/RUT,
 * contact data) while the RRHH-specific attributes live in the
 * `erp_rrhh:trabajadores` table linked by `entity_id`.
 */

import { addEntity, isValidDate, loadEntities, updateEntity } from '../../storage.js';
import { insert, list, update } from '../storage-rrhh.js';
import { formatearRut, validarRut } from '../calculo/rut.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { can } from '../seguridad/roles.js';
import { TIPO_CATALOGO_LABELS, listCatalogos } from './catalogos-service.js';

export const TRABAJADORES_TABLE = 'trabajadores';

export const ESTADOS_LABORALES = ['Activo', 'Desvinculado'];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CATALOG_FIELDS = [
  ['cargoId', 'cargo'],
  ['departamentoId', 'departamento'],
  ['centroCostoId', 'centro_costo']
];

function fail(errors, code = 'TRABAJADOR_INVALIDO') {
  const messages = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(messages.join(' '));
  error.errors = messages;
  error.code = code;
  throw error;
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizeSearch(value) {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function entityIdOf(entity) {
  return entity?.entity_id || entity?.id || '';
}

function profileId(entityId) {
  return `trab-${entityId}`;
}

function profiles() {
  return list(TRABAJADORES_TABLE);
}

function profileFor(entityId) {
  return profiles().find((row) => row.entityId === entityId) || null;
}

export function puedeGestionarTrabajadores(viewer) {
  return can(viewer?.role, 'canManageTrabajadores');
}

export function puedeVerTrabajadores(viewer) {
  return can(viewer?.role, 'canViewTrabajadores') || puedeGestionarTrabajadores(viewer);
}

/** Validate a worker form payload, including RUT and catalog references. */
export function validarTrabajador(input = {}, context = {}) {
  const errors = {};
  const name = String(input.name ?? '').trim();
  const code = String(input.code ?? '').trim();
  const rut = String(input.rut ?? input.taxId ?? '').trim();
  const email = String(input.email ?? '').trim();

  if (!name) errors.name = 'El nombre del trabajador es obligatorio.';
  if (!code) errors.code = 'El código del trabajador es obligatorio.';
  if (rut && !validarRut(rut)) {
    errors.rut = 'El RUT no tiene un dígito verificador válido.';
  }
  if (email && !EMAIL_PATTERN.test(email)) {
    errors.email = 'El correo electrónico no tiene un formato válido.';
  }
  if (input.fechaIngreso && !isValidDate(input.fechaIngreso)) {
    errors.fechaIngreso = 'La fecha de ingreso debe ser una fecha válida (AAAA-MM-DD).';
  }
  if (input.estadoLaboral && !ESTADOS_LABORALES.includes(input.estadoLaboral)) {
    errors.estadoLaboral = `El estado laboral debe ser uno de: ${ESTADOS_LABORALES.join(', ')}.`;
  }

  const catalogos = context.catalogos || listCatalogos({ incluirInactivos: true });
  for (const [field, tipo] of CATALOG_FIELDS) {
    const value = input[field];
    if (!value) continue;
    const found = catalogos.some((row) => row.id === value && row.tipo === tipo);
    if (!found) {
      errors[field] = `El ${TIPO_CATALOGO_LABELS[tipo] || tipo} seleccionado no existe.`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

function join(entity, profile, catalogos) {
  const byId = (id) => catalogos.find((row) => row.id === id) || null;
  const cargo = byId(profile?.cargoId);
  const departamento = byId(profile?.departamentoId);
  const centroCosto = byId(profile?.centroCostoId);
  return {
    id: entity.id,
    entityId: entityIdOf(entity),
    name: entity.name || '',
    code: entity.code || '',
    rut: entity.taxId || entity.rut || '',
    email: entity.email || '',
    phone: entity.phone || '',
    address: entity.address || '',
    cargoId: profile?.cargoId || '',
    cargo: cargo?.nombre || '',
    departamentoId: profile?.departamentoId || '',
    departamento: departamento?.nombre || '',
    centroCostoId: profile?.centroCostoId || '',
    centroCosto: centroCosto?.nombre || '',
    fechaIngreso: profile?.fechaIngreso || '',
    estadoLaboral:
      profile?.estadoLaboral || (entity.bajaLogica || entity.activo === false ? 'Desvinculado' : 'Activo'),
    activo: profile?.activo !== false && entity.activo !== false && !entity.bajaLogica,
    bajaLogica: Boolean(entity.bajaLogica)
  };
}

/** List workers joined with their RRHH profile and catalog labels. */
export function listTrabajadores({ term = '', incluirBaja = false, viewer } = {}) {
  const catalogos = listCatalogos({ incluirInactivos: true });
  let entities = loadEntities();
  if (!incluirBaja) entities = entities.filter((entity) => !entity.bajaLogica);

  if (viewer?.role === 'jefatura' && Array.isArray(viewer.equipo)) {
    const team = new Set(viewer.equipo.map(String));
    entities = entities.filter((entity) => team.has(String(entityIdOf(entity))));
  }

  const rows = entities.map((entity) => join(entity, profileFor(entityIdOf(entity)), catalogos));
  const query = normalizeSearch(term);
  if (!query) return rows.sort((a, b) => a.name.localeCompare(b.name));
  return rows
    .filter((row) =>
      [
        row.name,
        row.code,
        row.rut,
        row.email,
        row.cargo,
        row.departamento,
        row.centroCosto,
        row.estadoLaboral
      ].some((value) => normalizeSearch(value).includes(query))
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function buscarTrabajadores(term, options = {}) {
  return listTrabajadores({ ...options, term });
}

export function getTrabajador(entityId) {
  const entities = loadEntities();
  const entity = entities.find((row) => entityIdOf(row) === entityId);
  if (!entity) return null;
  return join(entity, profileFor(entityId), listCatalogos({ incluirInactivos: true }));
}

export function crearTrabajador(input = {}, viewer) {
  if (viewer && !puedeGestionarTrabajadores(viewer)) {
    fail('Tu rol no puede gestionar fichas de trabajadores.', 'PERMISO_DENEGADO');
  }
  const validation = validarTrabajador(input);
  if (!validation.valid) {
    const error = new Error('Trabajador inválido.');
    error.errors = validation.errors;
    error.code = 'TRABAJADOR_INVALIDO';
    throw error;
  }

  const rut = String(input.rut ?? input.taxId ?? '').trim();
  const entity = addEntity({
    name: input.name,
    code: input.code,
    taxId: rut ? formatearRut(rut) : '',
    email: input.email,
    phone: input.phone,
    address: input.address,
    description: input.description,
    category: input.category
  });

  const id = entityIdOf(entity);
  insert(
    TRABAJADORES_TABLE,
    {
      id: profileId(id),
      entityId: id,
      cargoId: input.cargoId || '',
      departamentoId: input.departamentoId || '',
      centroCostoId: input.centroCostoId || '',
      fechaIngreso: input.fechaIngreso || '',
      estadoLaboral: input.estadoLaboral || 'Activo',
      activo: true
    },
    { prefix: 'trab' }
  );

  registrarAuditoria({
    accion: 'crear',
    tabla: TRABAJADORES_TABLE,
    registroId: id,
    camposModificados: ['name', 'code', 'taxId', 'cargoId', 'departamentoId', 'centroCostoId'],
    motivo: 'Alta de ficha de trabajador',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });

  return getTrabajador(id);
}

export function actualizarTrabajador(entityId, changes = {}, viewer) {
  if (viewer && !puedeGestionarTrabajadores(viewer)) {
    fail('Tu rol no puede gestionar fichas de trabajadores.', 'PERMISO_DENEGADO');
  }
  const entities = loadEntities();
  const entity = entities.find((row) => entityIdOf(row) === entityId);
  if (!entity) fail('El trabajador no existe.', 'TRABAJADOR_NO_ENCONTRADO');

  const current = getTrabajador(entityId);
  const merged = { ...current, ...changes };
  const validation = validarTrabajador(merged);
  if (!validation.valid) {
    const error = new Error('Trabajador inválido.');
    error.errors = validation.errors;
    error.code = 'TRABAJADOR_INVALIDO';
    throw error;
  }

  const baseChanges = {};
  for (const key of ['name', 'code', 'email', 'phone', 'address', 'description', 'category']) {
    if (changes[key] !== undefined) baseChanges[key] = changes[key];
  }
  if (changes.rut !== undefined || changes.taxId !== undefined) {
    const rut = String(changes.rut ?? changes.taxId ?? '').trim();
    baseChanges.taxId = rut ? formatearRut(rut) : '';
  }
  updateEntity(entity.id, baseChanges);

  const id = entityIdOf(entity);
  const profile = profileFor(id);
  const profileChanges = {};
  for (const key of ['cargoId', 'departamentoId', 'centroCostoId', 'fechaIngreso', 'estadoLaboral']) {
    if (changes[key] !== undefined) profileChanges[key] = changes[key];
  }
  if (profile) {
    update(TRABAJADORES_TABLE, profile.id, profileChanges);
  } else {
    insert(
      TRABAJADORES_TABLE,
      {
        id: profileId(id),
        entityId: id,
        cargoId: '',
        departamentoId: '',
        centroCostoId: '',
        fechaIngreso: '',
        estadoLaboral: 'Activo',
        activo: true,
        ...profileChanges
      },
      { prefix: 'trab' }
    );
  }

  registrarAuditoria({
    accion: 'editar',
    tabla: TRABAJADORES_TABLE,
    registroId: id,
    camposModificados: Object.keys(changes),
    motivo: 'Actualización de ficha de trabajador',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });

  return getTrabajador(id);
}

/** Logical deactivation that keeps historical payroll records reproducible. */
export function desactivarTrabajador(entityId, viewer) {
  return actualizarTrabajador(entityId, { estadoLaboral: 'Desvinculado' }, viewer);
}

export function clearTrabajadores() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:trabajadores');
  return true;
}
