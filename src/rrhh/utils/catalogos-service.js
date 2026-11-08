/**
 * Base catalogs for the RRHH module: cargos, departamentos and centros de costo.
 *
 * Catalogs live in their own table (`erp_rrhh:catalogos`) so the base Entity
 * schema stays untouched. Removing a catalog is a logical deactivation so
 * historical worker records never lose their labels.
 */

import { insert, list, now, readTable, update } from '../storage-rrhh.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { can } from '../seguridad/roles.js';

export const CATALOGOS_TABLE = 'catalogos';

export const TIPOS_CATALOGO = ['cargo', 'departamento', 'centro_costo'];

export const TIPO_CATALOGO_LABELS = {
  cargo: 'Cargo',
  departamento: 'Departamento',
  centro_costo: 'Centro de costo'
};

function fail(errors, code = 'CATALOGO_INVALIDO') {
  const list = Array.isArray(errors) ? errors : [String(errors)];
  const error = new Error(list.join(' '));
  error.errors = list;
  error.code = code;
  throw error;
}

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function puedeGestionarCatalogos(viewer) {
  return can(viewer?.role, 'canManageCatalogos');
}

export function puedeVerCatalogos(viewer) {
  return can(viewer?.role, 'canViewTrabajadores') || puedeGestionarCatalogos(viewer);
}

/** Validate a catalog record against the allowed types and uniqueness. */
export function validarCatalogo(input = {}, context = {}) {
  const errors = {};
  const tipo = input.tipo;
  const codigo = String(input.codigo ?? '').trim();
  const nombre = String(input.nombre ?? '').trim();

  if (!TIPOS_CATALOGO.includes(tipo)) {
    errors.tipo = `El tipo debe ser uno de: ${TIPOS_CATALOGO.join(', ')}.`;
  }
  if (!codigo) errors.codigo = 'El código del catálogo es obligatorio.';
  if (!nombre) errors.nombre = 'El nombre del catálogo es obligatorio.';

  const rows = context.catalogos || listCatalogos({ incluirInactivos: true });
  if (tipo && codigo) {
    const duplicate = rows.some(
      (row) =>
        row.id !== input.id &&
        row.activo !== false &&
        row.tipo === tipo &&
        normalizeText(row.codigo) === normalizeText(codigo)
    );
    if (duplicate) {
      errors.codigo = `Ya existe un ${TIPO_CATALOGO_LABELS[tipo] || tipo} con el código "${codigo}".`;
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function listCatalogos({ tipo, incluirInactivos = false } = {}) {
  let rows = list(CATALOGOS_TABLE);
  if (tipo) rows = rows.filter((row) => row.tipo === tipo);
  if (!incluirInactivos) rows = rows.filter((row) => row.activo !== false);
  return rows.sort(
    (a, b) => String(a.tipo).localeCompare(String(b.tipo)) || String(a.nombre).localeCompare(String(b.nombre))
  );
}

export function getCatalogo(id) {
  return clone(list(CATALOGOS_TABLE).find((row) => row.id === id) || null);
}

export function catalogosPorTipo(tipo, options = {}) {
  return listCatalogos({ ...options, tipo });
}

export function crearCatalogo(input = {}, viewer) {
  if (viewer && !puedeGestionarCatalogos(viewer)) {
    fail('Tu rol no puede gestionar catálogos base.', 'PERMISO_DENEGADO');
  }
  const validation = validarCatalogo(input);
  if (!validation.valid) {
    const error = new Error('Catálogo inválido.');
    error.errors = validation.errors;
    error.code = 'CATALOGO_INVALIDO';
    throw error;
  }
  const record = {
    tipo: input.tipo,
    codigo: String(input.codigo).trim(),
    nombre: String(input.nombre).trim(),
    descripcion: String(input.descripcion ?? '').trim(),
    activo: true
  };
  const stored = insert(CATALOGOS_TABLE, record, { prefix: 'cat' });
  registrarAuditoria({
    accion: 'crear',
    tabla: CATALOGOS_TABLE,
    registroId: stored.id,
    camposModificados: ['tipo', 'codigo', 'nombre'],
    motivo: `Creación de ${TIPO_CATALOGO_LABELS[stored.tipo] || stored.tipo}`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

export function actualizarCatalogo(id, changes = {}, viewer) {
  if (viewer && !puedeGestionarCatalogos(viewer)) {
    fail('Tu rol no puede gestionar catálogos base.', 'PERMISO_DENEGADO');
  }
  const current = getCatalogo(id);
  if (!current) fail('El catálogo no existe.', 'CATALOGO_NO_ENCONTRADO');
  const merged = {
    ...current,
    tipo: changes.tipo ?? current.tipo,
    codigo: changes.codigo !== undefined ? String(changes.codigo).trim() : current.codigo,
    nombre: changes.nombre !== undefined ? String(changes.nombre).trim() : current.nombre,
    descripcion:
      changes.descripcion !== undefined ? String(changes.descripcion).trim() : current.descripcion,
    activo: changes.activo !== undefined ? Boolean(changes.activo) : current.activo
  };
  const validation = validarCatalogo(merged, { catalogos: listCatalogos({ incluirInactivos: true }) });
  if (!validation.valid) {
    const error = new Error('Catálogo inválido.');
    error.errors = validation.errors;
    error.code = 'CATALOGO_INVALIDO';
    throw error;
  }
  const stored = update(CATALOGOS_TABLE, id, merged);
  registrarAuditoria({
    accion: 'editar',
    tabla: CATALOGOS_TABLE,
    registroId: id,
    camposModificados: Object.keys(changes),
    motivo: 'Actualización de catálogo',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return stored;
}

/**
 * Deactivate a catalog entry. It stays readable for historical records but is
 * no longer offered in worker forms.
 */
export function eliminarCatalogo(id, viewer) {
  if (viewer && !puedeGestionarCatalogos(viewer)) {
    fail('Tu rol no puede gestionar catálogos base.', 'PERMISO_DENEGADO');
  }
  const current = getCatalogo(id);
  if (!current) return false;
  update(CATALOGOS_TABLE, id, { activo: false, desactivadoEn: now() });
  registrarAuditoria({
    accion: 'eliminar',
    tabla: CATALOGOS_TABLE,
    registroId: id,
    motivo: 'Desactivación lógica de catálogo',
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return true;
}

export function clearCatalogos() {
  if (typeof localStorage !== 'undefined') localStorage.removeItem('erp_rrhh:catalogos');
  return readTable(CATALOGOS_TABLE).length === 0;
}
