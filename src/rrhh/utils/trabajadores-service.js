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
import { listContratos, terminarContrato } from './contratos-service.js';
import { equipoDeJefatura } from './jefatura.js';
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

function failValidation(errors, code = 'TRABAJADOR_INVALIDO') {
  const error = new Error('Trabajador inválido.');
  error.errors = errors;
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

function normalizeRut(value) {
  return String(value ?? '')
    .replace(/[^0-9kK]/g, '')
    .toUpperCase();
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

function workerIsActive(entity, profile) {
  return Boolean(
    entity &&
      !entity.bajaLogica &&
      entity.activo !== false &&
      profile?.activo !== false &&
      profile?.estadoLaboral !== 'Desvinculado'
  );
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
  const entities = context.entities || loadEntities();
  const currentId = context.entityId || input.entityId || '';

  if (!name) errors.name = 'El nombre del trabajador es obligatorio.';
  if (!code) errors.code = 'El código del trabajador es obligatorio.';
  if (!rut) {
    errors.rut = 'El RUT del trabajador es obligatorio.';
  } else if (!validarRut(rut)) {
    errors.rut = 'El RUT no tiene un dígito verificador válido.';
  }

  if (code) {
    const normalizedCode = normalizeSearch(code);
    const duplicate = entities.find(
      (entity) =>
        entityIdOf(entity) !== currentId && normalizeSearch(entity.code) === normalizedCode
    );
    if (duplicate) errors.code = 'El código del trabajador ya está registrado.';
  }

  if (rut && validarRut(rut)) {
    const normalized = normalizeRut(rut);
    const duplicate = entities.find(
      (entity) =>
        entityIdOf(entity) !== currentId && normalizeRut(entity.taxId || entity.rut) === normalized
    );
    if (duplicate) errors.rut = 'El RUT ya está registrado en otra ficha de trabajador.';
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

  const jefeId = String(input.jefeId || '');
  if (jefeId) {
    if (currentId && jefeId === currentId) {
      errors.jefeId = 'Un trabajador no puede ser su propia jefatura.';
    } else {
      const jefe = entities.find((entity) => entityIdOf(entity) === jefeId);
      if (!jefe || !workerIsActive(jefe, profileFor(jefeId))) {
        errors.jefeId = 'La jefatura directa debe ser un trabajador activo.';
      }
    }
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

function join(entity, profile, catalogos, entities = []) {
  const byId = (id) => catalogos.find((row) => row.id === id) || null;
  const cargo = byId(profile?.cargoId);
  const departamento = byId(profile?.departamentoId);
  const centroCosto = byId(profile?.centroCostoId);
  const jefeId = profile?.jefeId || '';
  const jefe = entities.find((row) => entityIdOf(row) === jefeId);
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
    fechaDesvinculacion: profile?.fechaDesvinculacion || '',
    jefeId,
    jefeNombre: jefe?.name || '',
    estadoLaboral:
      profile?.estadoLaboral ||
      (entity.bajaLogica || entity.activo === false ? 'Desvinculado' : 'Activo'),
    activo: workerIsActive(entity, profile),
    bajaLogica: Boolean(entity.bajaLogica)
  };
}

/** List workers joined with their RRHH profile and catalog labels. */
export function listTrabajadores({
  term = '',
  criterio = 'nombre',
  cargoId = '',
  incluirBaja = false,
  viewer
} = {}) {
  const catalogos = listCatalogos({ incluirInactivos: true });
  const allEntities = loadEntities();
  let entities = allEntities;
  if (!incluirBaja) entities = entities.filter((entity) => !entity.bajaLogica);

  const team = equipoDeJefatura(viewer);
  if (team) {
    const allowed = new Set(team.map(String));
    entities = entities.filter((entity) => allowed.has(String(entityIdOf(entity))));
  }

  const rows = entities.map((entity) =>
    join(entity, profileFor(entityIdOf(entity)), catalogos, allEntities)
  );
  const sortByName = (items) => items.sort((a, b) => a.name.localeCompare(b.name));
  if (criterio === 'cargo') {
    if (!cargoId) return sortByName(rows);
    return sortByName(rows.filter((row) => String(row.cargoId) === String(cargoId)));
  }
  const field = { nombre: 'name', rut: 'rut', codigo: 'code' }[criterio] ?? 'name';
  const normalize = field === 'rut' ? normalizeRut : normalizeSearch;
  const query = normalize(term);
  if (!query) return sortByName(rows);
  return sortByName(rows.filter((row) => normalize(row[field]).startsWith(query)));
}

export function buscarTrabajadores(term, options = {}) {
  return listTrabajadores({ ...options, term });
}

export function getTrabajador(entityId) {
  const entities = loadEntities();
  const entity = entities.find((row) => entityIdOf(row) === entityId);
  if (!entity) return null;
  return join(entity, profileFor(entityId), listCatalogos({ incluirInactivos: true }), entities);
}

export function crearTrabajador(input = {}, viewer) {
  if (viewer && !puedeGestionarTrabajadores(viewer)) {
    fail('Tu rol no puede gestionar fichas de trabajadores.', 'PERMISO_DENEGADO');
  }
  const validation = validarTrabajador(input);
  if (!validation.valid) {
    failValidation(validation.errors);
  }

  const rut = String(input.rut ?? input.taxId ?? '').trim();
  const entity = addEntity({
    name: input.name,
    code: input.code,
    taxId: formatearRut(rut),
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
      fechaDesvinculacion: '',
      jefeId: input.jefeId || '',
      estadoLaboral: input.estadoLaboral || 'Activo',
      activo: true
    },
    { prefix: 'trab' }
  );

  registrarAuditoria({
    accion: 'crear',
    tabla: TRABAJADORES_TABLE,
    registroId: id,
    camposModificados: [
      'name',
      'code',
      'taxId',
      'cargoId',
      'departamentoId',
      'centroCostoId',
      'jefeId'
    ],
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
  if (current.estadoLaboral === 'Desvinculado' && merged.estadoLaboral === 'Activo') {
    fail('Un trabajador desvinculado no puede reactivarse.', 'REACTIVACION_PROHIBIDA');
  }
  if (current.estadoLaboral !== 'Desvinculado' && merged.estadoLaboral === 'Desvinculado') {
    fail(
      'La desvinculación se registra con fecha mediante la acción Desvincular.',
      'DESVINCULACION_REQUERIDA'
    );
  }

  const validation = validarTrabajador(merged, { entities, entityId });
  if (!validation.valid) {
    failValidation(validation.errors);
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
  for (const key of [
    'cargoId',
    'departamentoId',
    'centroCostoId',
    'fechaIngreso',
    'jefeId',
    'fechaDesvinculacion'
  ]) {
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
        fechaDesvinculacion: '',
        jefeId: '',
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

export function tieneNovedadesPendientes(entityId) {
  return list('novedades').some(
    (row) =>
      String(row.trabajadorEntityId || row.entity_id || '') === String(entityId) &&
      String(row.estado || '').toLowerCase() === 'pendiente'
  );
}

/**
 * Register a worker's desvinculación.
 */
export function desactivarTrabajador(entityId, fechaDesvinculacion, viewer) {
  let fecha = fechaDesvinculacion;
  let actor = viewer;
  if (fecha && typeof fecha === 'object' && !actor) {
    actor = fecha;
    fecha = '';
  }

  if (actor && !puedeGestionarTrabajadores(actor)) {
    fail('Tu rol no puede gestionar fichas de trabajadores.', 'PERMISO_DENEGADO');
  }
  const current = getTrabajador(entityId);
  if (!current) fail('El trabajador no existe.', 'TRABAJADOR_NO_ENCONTRADO');
  if (current.estadoLaboral === 'Desvinculado') {
    fail('El trabajador ya está desvinculado.', 'TRABAJADOR_YA_DESVINCULADO');
  }
  if (!fecha) {
    fail('La fecha de desvinculación es obligatoria.', 'FECHA_DESVINCULACION_REQUERIDA');
  }
  if (!isValidDate(fecha)) {
    fail(
      'La fecha de desvinculación debe tener formato AAAA-MM-DD.',
      'FECHA_DESVINCULACION_INVALIDA'
    );
  }
  if (current.fechaIngreso && fecha < current.fechaIngreso) {
    fail(
      'La fecha de desvinculación no puede ser anterior a la fecha de ingreso.',
      'FECHA_DESVINCULACION_INVALIDA'
    );
  }
  if (tieneNovedadesPendientes(entityId)) {
    fail(
      'El trabajador tiene novedades pendientes. Resuélvelas antes de desvincularlo.',
      'NOVEDADES_PENDIENTES'
    );
  }

  const contracts = listContratos({ entityId }).filter((row) => row.estado !== 'terminado');
  const contract = contracts.sort((a, b) =>
    String(b.fechaInicio).localeCompare(String(a.fechaInicio))
  )[0];
  if (contract) {
    terminarContrato(contract.id, fecha, actor);
  }

  const profile = profileFor(entityId);
  if (profile) {
    update(TRABAJADORES_TABLE, profile.id, {
      estadoLaboral: 'Desvinculado',
      activo: false,
      fechaDesvinculacion: fecha
    });
  } else {
    insert(
      TRABAJADORES_TABLE,
      {
        id: profileId(entityId),
        entityId,
        estadoLaboral: 'Desvinculado',
        activo: false,
        fechaDesvinculacion: fecha
      },
      { prefix: 'trab' }
    );
  }

  const reports = profiles().filter((row) => String(row.jefeId || '') === String(entityId));
  for (const report of reports) {
    update(TRABAJADORES_TABLE, report.id, { jefeId: '' });
  }

  registrarAuditoria({
    accion: 'desvincular',
    tabla: TRABAJADORES_TABLE,
    registroId: entityId,
    camposModificados: ['estadoLaboral', 'fechaDesvinculacion'],
    motivo: `Desvinculación con fecha ${fecha}`,
    actor: actor?.usuario || actor?.role,
    rol: actor?.role
  });

  return getTrabajador(entityId);
}

export function clearTrabajadores() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:trabajadores');
  return true;
}
