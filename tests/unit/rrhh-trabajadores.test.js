import { describe, it, expect, beforeEach } from 'vitest';
import {
  catalogosPorTipo,
  crearCatalogo,
  eliminarCatalogo,
  listCatalogos,
  validarCatalogo
} from '../../src/rrhh/utils/catalogos-service.js';
import {
  actualizarTrabajador,
  buscarTrabajadores,
  crearTrabajador,
  desactivarTrabajador,
  getTrabajador,
  listTrabajadores,
  validarTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { loadEntities } from '../../src/storage.js';

const viewer = { role: 'analista', usuario: 'Analista RRHH' };

let store;

beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
});

function seedCatalogos() {
  const cargo = crearCatalogo(
    { tipo: 'cargo', codigo: 'CAR-01', nombre: 'Analista de remuneraciones' },
    viewer
  );
  const departamento = crearCatalogo(
    { tipo: 'departamento', codigo: 'RRHH', nombre: 'Recursos Humanos' },
    viewer
  );
  const centroCosto = crearCatalogo(
    { tipo: 'centro_costo', codigo: 'CC-100', nombre: 'Casa matriz' },
    viewer
  );
  return { cargo, departamento, centroCosto };
}

function workerPayload(ids, overrides = {}) {
  return {
    name: 'Ana Pérez',
    code: 'TRAB-001',
    rut: '12.345.678-5',
    email: 'ana.perez@example.com',
    fechaIngreso: '2024-01-15',
    cargoId: ids.cargo.id,
    departamentoId: ids.departamento.id,
    centroCostoId: ids.centroCosto.id,
    ...overrides
  };
}

function nombres(rows) {
  return rows.map((row) => row.name);
}

function seedBusqueda() {
  const ids = seedCatalogos();
  const otroCargo = crearCatalogo({ tipo: 'cargo', codigo: 'CAR-02', nombre: 'Contador' }, viewer);
  const ana = crearTrabajador(workerPayload(ids), viewer);
  const camila = crearTrabajador(
    workerPayload(ids, {
      name: 'Camila Soto',
      code: 'TRAB-002',
      rut: '7.654.321-6',
      email: 'camila@example.com',
      cargoId: otroCargo.id
    }),
    viewer
  );
  const cristina = crearTrabajador(
    workerPayload(ids, {
      name: 'Cristina Rojas',
      code: 'TRAB-003',
      rut: '9.876.543-3',
      email: 'cristina@example.com'
    }),
    viewer
  );
  return { ids, otroCargo, ana, camila, cristina };
}

describe('US1 - catálogos base', () => {
  it('rejects unknown catalog types and missing code or name', () => {
    const result = validarCatalogo({ tipo: 'turno', codigo: '', nombre: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.tipo).toBeDefined();
    expect(result.errors.codigo).toBeDefined();
    expect(result.errors.nombre).toBeDefined();
  });

  it('keeps codes unique per type but allows the same code across types', () => {
    crearCatalogo({ tipo: 'cargo', codigo: 'OPS', nombre: 'Operario' }, viewer);
    const duplicate = validarCatalogo({ tipo: 'cargo', codigo: 'ops', nombre: 'Otro operario' });
    expect(duplicate.valid).toBe(false);
    expect(duplicate.errors.codigo).toBeDefined();

    const otherType = validarCatalogo({
      tipo: 'departamento',
      codigo: 'OPS',
      nombre: 'Operaciones'
    });
    expect(otherType.valid).toBe(true);
  });

  it('creates, lists and logically deactivates catalogs', () => {
    const { cargo, departamento } = seedCatalogos();
    expect(listCatalogos()).toHaveLength(3);
    expect(catalogosPorTipo('cargo').map((row) => row.id)).toEqual([cargo.id]);

    expect(eliminarCatalogo(departamento.id, viewer)).toBe(true);
    expect(listCatalogos()).toHaveLength(2);
    expect(listCatalogos({ incluirInactivos: true })).toHaveLength(3);
    expect(catalogosPorTipo('departamento')).toHaveLength(0);
  });

  it('denies catalog management to roles without the permission', () => {
    let error;
    try {
      crearCatalogo(
        { tipo: 'cargo', codigo: 'X', nombre: 'Prohibido' },
        { role: 'trabajador', usuario: 'Trabajador' }
      );
    } catch (thrown) {
      error = thrown;
    }
    expect(error?.code).toBe('PERMISO_DENEGADO');
  });
});

describe('US1 - fichas de trabajadores', () => {
  it('validates required fields, RUT, email and catalog references', () => {
    const result = validarTrabajador({
      name: '',
      code: '',
      rut: '12.345.678-9',
      email: 'no-es-correo',
      fechaIngreso: '2024-13-40',
      cargoId: 'cat-inexistente'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
    expect(result.errors.code).toBeDefined();
    expect(result.errors.rut).toBeDefined();
    expect(result.errors.email).toBeDefined();
    expect(result.errors.fechaIngreso).toBeDefined();
    expect(result.errors.cargoId).toBeDefined();
  });

  it('stores the RUT as the entity taxId and joins catalog labels', () => {
    const ids = seedCatalogos();
    const trabajador = crearTrabajador(workerPayload(ids), viewer);

    expect(trabajador.rut).toBe('12.345.678-5');
    expect(trabajador.cargo).toBe('Analista de remuneraciones');
    expect(trabajador.departamento).toBe('Recursos Humanos');
    expect(trabajador.centroCosto).toBe('Casa matriz');
    expect(trabajador.estadoLaboral).toBe('Activo');
    expect(trabajador.activo).toBe(true);

    const entity = loadEntities().find((row) => row.entity_id === trabajador.entityId);
    expect(entity.taxId).toBe('12.345.678-5');
  });

  it('filters names by prefix from the first character without crossing fields', () => {
    seedBusqueda();

    expect(listTrabajadores()).toHaveLength(3);
    expect(nombres(buscarTrabajadores('c', { criterio: 'nombre' }))).toEqual([
      'Camila Soto',
      'Cristina Rojas'
    ]);
    expect(nombres(buscarTrabajadores('ca', { criterio: 'nombre' }))).toEqual(['Camila Soto']);
    expect(nombres(buscarTrabajadores('camila s', { criterio: 'nombre' }))).toEqual([
      'Camila Soto'
    ]);
    expect(nombres(buscarTrabajadores('aNa'))).toEqual(['Ana Pérez']);
    expect(nombres(buscarTrabajadores('perez'))).toEqual([]);
    expect(nombres(buscarTrabajadores('7654', { criterio: 'nombre' }))).toEqual([]);
    expect(nombres(buscarTrabajadores('contador', { criterio: 'nombre' }))).toEqual([]);
  });

  it('filters RUT and code by prefix from the first character', () => {
    seedBusqueda();

    expect(nombres(buscarTrabajadores('1', { criterio: 'rut' }))).toEqual(['Ana Pérez']);
    expect(nombres(buscarTrabajadores('12', { criterio: 'rut' }))).toEqual(['Ana Pérez']);
    expect(nombres(buscarTrabajadores('12.345.678-5', { criterio: 'rut' }))).toEqual(['Ana Pérez']);
    expect(nombres(buscarTrabajadores('7', { criterio: 'rut' }))).toEqual(['Camila Soto']);

    expect(nombres(buscarTrabajadores('t', { criterio: 'codigo' }))).toEqual([
      'Ana Pérez',
      'Camila Soto',
      'Cristina Rojas'
    ]);
    expect(nombres(buscarTrabajadores('trab-002', { criterio: 'codigo' }))).toEqual([
      'Camila Soto'
    ]);
  });

  it('filters cargo by catalog id with an empty option meaning no filter', () => {
    const { ids, otroCargo } = seedBusqueda();

    expect(nombres(listTrabajadores({ criterio: 'cargo', cargoId: otroCargo.id }))).toEqual([
      'Camila Soto'
    ]);
    expect(nombres(listTrabajadores({ criterio: 'cargo', cargoId: ids.cargo.id }))).toEqual([
      'Ana Pérez',
      'Cristina Rojas'
    ]);
    expect(listTrabajadores({ criterio: 'cargo' })).toHaveLength(3);
  });

  it('keeps the jefatura scope for every search criterion', () => {
    const { ids, camila } = seedBusqueda();
    const jefatura = { role: 'jefatura', usuario: 'Jefatura A', equipo: [camila.entityId] };

    expect(nombres(listTrabajadores({ term: 'c', criterio: 'nombre', viewer: jefatura }))).toEqual([
      'Camila Soto'
    ]);
    expect(nombres(listTrabajadores({ term: '7', criterio: 'rut', viewer: jefatura }))).toEqual([
      'Camila Soto'
    ]);
    expect(
      nombres(listTrabajadores({ term: 'trab002', criterio: 'codigo', viewer: jefatura }))
    ).toEqual(['Camila Soto']);
    expect(
      nombres(listTrabajadores({ criterio: 'cargo', cargoId: ids.cargo.id, viewer: jefatura }))
    ).toEqual([]);
  });

  it('updates base data and the RRHH profile', () => {
    const ids = seedCatalogos();
    const trabajador = crearTrabajador(workerPayload(ids), viewer);
    const nuevoCargo = crearCatalogo(
      { tipo: 'cargo', codigo: 'CAR-02', nombre: 'Jefatura de personal' },
      viewer
    );

    const updated = actualizarTrabajador(
      trabajador.entityId,
      { name: 'Ana María Pérez', cargoId: nuevoCargo.id, email: 'ana.maria@example.com' },
      viewer
    );

    expect(updated.name).toBe('Ana María Pérez');
    expect(updated.email).toBe('ana.maria@example.com');
    expect(updated.cargo).toBe('Jefatura de personal');
    expect(getTrabajador(trabajador.entityId).name).toBe('Ana María Pérez');
  });

  it('marks a worker as desvinculado without deleting history', () => {
    const ids = seedCatalogos();
    const trabajador = crearTrabajador(workerPayload(ids), viewer);

    const stored = desactivarTrabajador(trabajador.entityId, '2024-06-30', viewer);
    expect(stored.estadoLaboral).toBe('Desvinculado');
    expect(stored.fechaDesvinculacion).toBe('2024-06-30');
    expect(getTrabajador(trabajador.entityId).activo).toBe(false);
    expect(listTrabajadores({ incluirBaja: true })).toHaveLength(1);
  });

  it('denies worker management to roles without the permission', () => {
    let error;
    try {
      crearTrabajador(
        { name: 'Sin permiso', code: 'TRAB-999' },
        { role: 'trabajador', usuario: 'Trabajador' }
      );
    } catch (thrown) {
      error = thrown;
    }
    expect(error?.code).toBe('PERMISO_DENEGADO');
  });
});
