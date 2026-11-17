/**
 * Demo data for the RRHH module.
 *
 * This module owns the sample dataset only. It reuses the existing RRHH
 * services to write records so permissions, validation, audit and the generic
 * entity exclusion rules remain unchanged.
 */

import { DOCUMENT_KEY, loadEntities, saveEntities } from '../../storage.js';
import { calcularLiquidacionTrabajador } from '../calculo/motor.js';
import { clearTable, list } from '../storage-rrhh.js';
import { resetAuditoria } from '../seguridad/auditoria.js';
import {
  CONCEPTOS_TABLE,
  inicializarConceptos,
  resetConceptosSeed
} from '../utils/conceptos-service.js';
import { clearCatalogos, crearCatalogo } from '../utils/catalogos-service.js';
import {
  clearContratos,
  contratosEnPeriodo,
  crearContrato,
  diasContratoEnPeriodo,
  listContratos
} from '../utils/contratos-service.js';
import {
  calcularPeriodo,
  clearLiquidaciones,
  listLiquidaciones,
  saveLiquidacion
} from '../utils/liquidacion-service.js';
import {
  aprobarNovedad,
  clearNovedades,
  crearNovedad,
  listNovedades
} from '../utils/novedades-service.js';
import {
  PARAMETROS_TABLE,
  TRAMOS_TABLE,
  inicializarParametros,
  parametrosVigentes,
  resetSeedFlag as resetParametrosSeed
} from '../utils/parametros-service.js';
import {
  getPeriodo,
  asegurarPeriodo,
  clearPeriodos,
  marcarPeriodoCalculado
} from '../utils/periodos-service.js';
import { rangoPeriodo } from '../utils/periodos.js';
import {
  clearTrabajadores,
  crearTrabajador,
  desactivarTrabajador,
  listTrabajadores
} from '../utils/trabajadores-service.js';

export const SEED_LOADED_KEY = 'erp_rrhh:seedLoaded';
export const SEED_DISABLE_FLAG = '__ERP_BASE_SEED_DISABLED__';

/** Deliberately invalid; exported only for validation tests. */
export const RUT_INVALIDO_EJEMPLO = '12.345.678-9';

export const PERIODO_CALCULADO = '2026-09';
export const PERIODO_ABIERTO = '2026-10';

const ADMIN = {
  role: 'administrador',
  usuario: 'Carga de datos de prueba',
  nombre: 'Carga de datos de prueba'
};

const JEFATURA = {
  role: 'jefatura',
  usuario: 'Jefatura de Operaciones',
  nombre: 'Jefatura de Operaciones'
};

export const SEED_DATASET = Object.freeze({
  periodos: [
    { id: PERIODO_CALCULADO, estado: 'abierto' },
    { id: PERIODO_ABIERTO, estado: 'abierto' }
  ],
  catalogos: [
    { tipo: 'cargo', codigo: 'CAR-RRHH', nombre: 'Analista de Remuneraciones' },
    { tipo: 'cargo', codigo: 'CAR-CONT', nombre: 'Contador' },
    { tipo: 'cargo', codigo: 'CAR-UX', nombre: 'Diseñadora UX' },
    { tipo: 'cargo', codigo: 'CAR-OP', nombre: 'Operario de Bodega' },
    { tipo: 'cargo', codigo: 'CAR-ASIS', nombre: 'Asistente Administrativa' },
    { tipo: 'departamento', codigo: 'RH', nombre: 'Recursos Humanos' },
    { tipo: 'departamento', codigo: 'FIN', nombre: 'Finanzas' },
    { tipo: 'departamento', codigo: 'PRO', nombre: 'Producto' },
    { tipo: 'departamento', codigo: 'OPE', nombre: 'Operaciones' },
    { tipo: 'centro_costo', codigo: 'CC-RRHH', nombre: 'RRHH Central' },
    { tipo: 'centro_costo', codigo: 'CC-FIN', nombre: 'Finanzas Central' },
    { tipo: 'centro_costo', codigo: 'CC-PRO', nombre: 'Producto Digital' },
    { tipo: 'centro_costo', codigo: 'CC-OPE', nombre: 'Bodega Norte' }
  ],
  trabajadores: [
    {
      key: 'ana',
      code: 'TR-001',
      name: 'Ana Rivas Molina',
      rut: '7.654.321-6',
      email: 'ana.rivas@ejemplo.cl',
      phone: '+56 9 4101 2233',
      address: 'Av. Providencia 1234, Santiago',
      afp: 'AFP Capital',
      salud: 'Fonasa 7%',
      cargo: 'Analista de Remuneraciones',
      cargoCodigo: 'CAR-RRHH',
      departamentoCodigo: 'RH',
      centroCostoCodigo: 'CC-RRHH',
      fechaIngreso: '2024-03-01',
      estadoLaboral: 'Activo'
    },
    {
      key: 'luis',
      code: 'TR-002',
      name: 'Luis Herrera Pavez',
      rut: '8.765.432-K',
      email: 'luis.herrera@ejemplo.cl',
      phone: '+56 9 4222 3344',
      address: 'Calle Huérfanos 890, Santiago',
      afp: 'AFP Modelo',
      salud: 'Isapre Consalud',
      cargo: 'Contador',
      cargoCodigo: 'CAR-CONT',
      departamentoCodigo: 'FIN',
      centroCostoCodigo: 'CC-FIN',
      fechaIngreso: '2023-08-15',
      estadoLaboral: 'Activo'
    },
    {
      key: 'camila',
      code: 'TR-003',
      name: 'Camila Soto Aguirre',
      rut: '9.876.543-3',
      email: 'camila.soto@ejemplo.cl',
      phone: '+56 9 4333 4455',
      address: 'Av. Apoquindo 3400, Las Condes',
      afp: 'AFP Habitat',
      salud: 'Fonasa 7%',
      cargo: 'Diseñadora UX',
      cargoCodigo: 'CAR-UX',
      departamentoCodigo: 'PRO',
      centroCostoCodigo: 'CC-PRO',
      fechaIngreso: '2025-01-10',
      estadoLaboral: 'Activo'
    },
    {
      key: 'mateo',
      code: 'TR-004',
      name: 'Mateo Fuentes Silva',
      rut: '10.987.654-2',
      email: 'mateo.fuentes@ejemplo.cl',
      phone: '+56 9 4444 5566',
      address: 'Camino a Melipilla 5600, Maipú',
      afp: 'AFP Cuprum',
      salud: 'Isapre Banmédica',
      cargo: 'Operario de Bodega',
      cargoCodigo: 'CAR-OP',
      departamentoCodigo: 'OPE',
      centroCostoCodigo: 'CC-OPE',
      fechaIngreso: '2022-11-02',
      estadoLaboral: 'Activo'
    },
    {
      key: 'renata',
      code: 'TR-005',
      name: 'Renata Muñoz Díaz',
      rut: '11.111.111-1',
      email: 'renata.munoz@ejemplo.cl',
      phone: '+56 9 4555 6677',
      address: 'Av. Ossa 1250, Ñuñoa',
      afp: 'AFP Provida',
      salud: 'Fonasa 7%',
      cargo: 'Asistente Administrativa',
      cargoCodigo: 'CAR-ASIS',
      departamentoCodigo: 'RH',
      centroCostoCodigo: 'CC-RRHH',
      fechaIngreso: '2024-06-03',
      estadoLaboral: 'Activo'
    }
  ],
  contratos: [
    {
      trabajadorKey: 'ana',
      tipoContrato: 'indefinido',
      sueldoBase: 1250000,
      jornadaHorasSemanales: 40,
      fechaInicio: '2024-03-01',
      modalidadGratificacion: 'art50',
      asignacionColacion: 45000,
      asignacionMovilizacion: 20000
    },
    {
      trabajadorKey: 'luis',
      tipoContrato: 'indefinido',
      sueldoBase: 980000,
      jornadaHorasSemanales: 40,
      fechaInicio: '2023-08-15',
      modalidadGratificacion: 'art50',
      asignacionColacion: 38000,
      asignacionMovilizacion: 0
    },
    {
      trabajadorKey: 'camila',
      tipoContrato: 'plazo_fijo',
      sueldoBase: 850000,
      jornadaHorasSemanales: 38,
      fechaInicio: '2025-01-10',
      fechaTermino: '2026-06-30',
      modalidadGratificacion: 'art50',
      asignacionColacion: 30000,
      asignacionMovilizacion: 15000
    },
    {
      trabajadorKey: 'mateo',
      tipoContrato: 'indefinido',
      sueldoBase: 553553,
      jornadaHorasSemanales: 45,
      fechaInicio: '2022-11-02',
      modalidadGratificacion: 'art50',
      asignacionColacion: 40000,
      asignacionMovilizacion: 25000
    },
    {
      trabajadorKey: 'renata',
      tipoContrato: 'part_time',
      sueldoBase: 720000,
      jornadaHorasSemanales: 30,
      fechaInicio: '2024-06-03',
      modalidadGratificacion: 'art50',
      asignacionColacion: 32000,
      asignacionMovilizacion: 0
    }
  ],
  novedades: [
    {
      trabajadorKey: 'ana',
      periodo: PERIODO_CALCULADO,
      tipo: 'horas_extra',
      cantidad: 30,
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-05',
      justificacion: 'Cierre de planilla y auditoría mensual; 30 horas autorizadas por jefatura.',
      observacion: 'Horas extra aprobadas para el cierre de septiembre.',
      estadoFinal: 'aprobada'
    },
    {
      trabajadorKey: 'luis',
      periodo: PERIODO_CALCULADO,
      tipo: 'licencia_medica',
      cantidad: 2,
      fechaInicio: '2026-09-10',
      fechaFin: '2026-09-11',
      observacion: '',
      estadoFinal: 'aprobada'
    },
    {
      trabajadorKey: 'mateo',
      periodo: PERIODO_CALCULADO,
      tipo: 'ausencia',
      cantidad: 1,
      fechaInicio: '2026-09-15',
      fechaFin: '2026-09-15',
      observacion: 'Atraso registrado como ausencia de un día.',
      estadoFinal: 'aprobada'
    },
    {
      trabajadorKey: 'mateo',
      periodo: PERIODO_CALCULADO,
      tipo: 'horas_extra',
      cantidad: 4,
      fechaInicio: '2026-09-20',
      fechaFin: '2026-09-21',
      observacion: 'Reposición de turno por bodega.',
      estadoFinal: 'aprobada'
    },
    {
      trabajadorKey: 'luis',
      periodo: PERIODO_ABIERTO,
      tipo: 'horas_extra',
      cantidad: 6,
      fechaInicio: '2026-10-05',
      fechaFin: '2026-10-07',
      observacion: 'Regularización pendiente de octubre.',
      estadoFinal: 'pendiente'
    }
  ],
  bonosImponibles: [
    {
      trabajadorKey: 'ana',
      periodo: PERIODO_CALCULADO,
      codigo: 'BONO',
      concepto: 'Bono imponible',
      monto: 150000,
      motivo: 'Bono imponible de ejemplo incluido en el cálculo de septiembre.'
    }
  ],
  desvinculaciones: [
    {
      trabajadorKey: 'renata',
      fecha: '2026-08-31'
    }
  ]
});

function storage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function isSeedDisabled() {
  return globalThis[SEED_DISABLE_FLAG] === true;
}

function hasStoredRrhhData() {
  const tables = [
    'trabajadores',
    'contratos',
    'novedades',
    'periodos',
    'liquidaciones',
    'catalogos'
  ];
  return tables.some((table) => list(table).length > 0);
}

function workerEntityIdsFromStorage() {
  const ids = new Set();
  for (const row of list('trabajadores')) {
    if (row.entityId) ids.add(String(row.entityId));
  }
  for (const table of ['novedades', 'liquidaciones']) {
    for (const row of list(table)) {
      const id = row.trabajadorEntityId || row.entity_id || row.trabajador?.entityId;
      if (id) ids.add(String(id));
    }
  }
  return ids;
}

function removePreviousWorkerEntities() {
  const ids = workerEntityIdsFromStorage();
  if (ids.size === 0) return;
  saveEntities(loadEntities().filter((entity) => !ids.has(String(entity.entity_id || entity.id))));
  const store = storage();
  if (!store) return;
  try {
    const documents = JSON.parse(store.getItem(DOCUMENT_KEY) || '[]');
    if (!Array.isArray(documents)) return;
    const remaining = documents.filter((document) => !ids.has(String(document.entity_id)));
    store.setItem(DOCUMENT_KEY, JSON.stringify(remaining));
  } catch {
    store.removeItem(DOCUMENT_KEY);
  }
}

function resetOperationalData() {
  removePreviousWorkerEntities();
  clearNovedades();
  clearLiquidaciones();
  clearContratos();
  clearTrabajadores();
  clearPeriodos();
  clearCatalogos();
  clearTable(PARAMETROS_TABLE);
  clearTable(TRAMOS_TABLE);
  clearTable(CONCEPTOS_TABLE);
  resetAuditoria();
  resetParametrosSeed();
  resetConceptosSeed();
}

function catalogMap() {
  const map = new Map();
  for (const row of SEED_DATASET.catalogos) {
    const created = crearCatalogo(row, ADMIN);
    map.set(row.codigo, created.id);
  }
  return map;
}

function createWorkers(catalogs) {
  const workers = new Map();
  for (const definition of SEED_DATASET.trabajadores) {
    const worker = crearTrabajador(
      {
        name: definition.name,
        code: definition.code,
        rut: definition.rut,
        email: definition.email,
        phone: definition.phone,
        address: definition.address,
        description: `AFP: ${definition.afp} | Salud: ${definition.salud}`,
        category: definition.cargo,
        cargoId: catalogs.get(definition.cargoCodigo),
        departamentoId: catalogs.get(definition.departamentoCodigo),
        centroCostoId: catalogs.get(definition.centroCostoCodigo),
        fechaIngreso: definition.fechaIngreso,
        estadoLaboral: definition.estadoLaboral
      },
      ADMIN
    );
    workers.set(definition.key, worker);
  }
  return workers;
}

function createContracts(workers) {
  for (const definition of SEED_DATASET.contratos) {
    const worker = workers.get(definition.trabajadorKey);
    crearContrato(
      {
        ...definition,
        entityId: worker.entityId
      },
      ADMIN
    );
  }
}

function createNovedades(workers) {
  for (const definition of SEED_DATASET.novedades) {
    const worker = workers.get(definition.trabajadorKey);
    const created = crearNovedad(
      {
        trabajadorEntityId: worker.entityId,
        periodo: definition.periodo,
        tipo: definition.tipo,
        cantidad: definition.cantidad,
        fechaInicio: definition.fechaInicio,
        fechaFin: definition.fechaFin,
        justificacion: definition.justificacion,
        observacion: definition.observacion
      },
      JEFATURA
    );
    if (definition.estadoFinal === 'aprobada') {
      const rows = Array.isArray(created) ? created : [created];
      for (const row of rows) aprobarNovedad(row.id, ADMIN);
    }
  }
}

function applyDesvinculaciones(workers) {
  for (const item of SEED_DATASET.desvinculaciones) {
    const worker = workers.get(item.trabajadorKey);
    desactivarTrabajador(worker.entityId, item.fecha, ADMIN);
  }
}

function seedWorkerForCalculation(entity) {
  const entityId = entity.entityId || entity.entity_id || entity.id;
  return {
    id: entityId,
    entityId,
    nombre: entity.name,
    rut: entity.taxId || entity.rut,
    cargo: entity.cargo || entity.category || '',
    departamento: entity.departamento || entity.category || '',
    centroCosto: entity.centroCosto || entity.category || ''
  };
}

function buildBonoLine(bono, periodo) {
  return {
    id: `liq-line-bono-${bono.codigo.toLowerCase()}`,
    concepto: bono.concepto,
    tipo: 'haber',
    monto: bono.monto,
    base: bono.monto,
    tasa: 1,
    manual: true,
    motivo: bono.motivo,
    excluirDeTotales: true,
    formula: '{base}',
    parametroLegal: {
      codigo: bono.codigo,
      descripcion: bono.concepto,
      fechaVigencia: periodo.fechaInicio,
      valorAplicado: bono.monto,
      fuente: 'Datos de prueba RRHH',
      congeladoEnPeriodo: periodo.etiqueta
    }
  };
}

function applyBonos(workers) {
  const periodo = getPeriodo(PERIODO_CALCULADO);
  if (!periodo) return;
  const range = rangoPeriodo(PERIODO_CALCULADO);
  const parametros = parametrosVigentes(range.fechaFin);
  const contratos = listContratos();

  for (const bono of SEED_DATASET.bonosImponibles) {
    const entity = workers.get(bono.trabajadorKey);
    const contrato = contratosEnPeriodo(PERIODO_CALCULADO, {
      entityId: entity.entityId,
      contratos
    })[0];
    if (!contrato) continue;
    const liquidacion = listLiquidaciones().find(
      (row) => row.trabajador?.entityId === entity.entityId && row.periodoId === PERIODO_CALCULADO
    );
    if (!liquidacion) continue;

    const propios = contratos.filter(
      (row) => String(row.entityId || row.entity_id) === String(entity.entityId)
    );
    const novedades = listNovedades({ periodo: PERIODO_CALCULADO, estado: 'aprobada' }).filter(
      (row) => String(row.trabajadorEntityId || row.entity_id) === String(entity.entityId)
    );
    const resultado = calcularLiquidacionTrabajador({
      trabajador: seedWorkerForCalculation(entity),
      contrato,
      novedades,
      parametros,
      periodo,
      diasTrabajados: diasContratoEnPeriodo(PERIODO_CALCULADO, propios),
      bonosImponibles: bono.monto,
      fechaPago: range.fechaFin
    });

    saveLiquidacion({
      ...liquidacion,
      lineas: [resultado.lineas[0], buildBonoLine(bono, periodo), ...resultado.lineas.slice(1)],
      totales: resultado.totales,
      bases: resultado.bases,
      descuentos: resultado.descuentos,
      impuesto: resultado.impuesto,
      aportesEmpleador: resultado.aportesEmpleador,
      totalAportesEmpleador: resultado.totalAportesEmpleador,
      costoEmpleador: resultado.costoEmpleador,
      novedadesAplicadas: resultado.novedadesAplicadas,
      advertencias: resultado.advertencias
    });
  }
}

export function getSeedSummary() {
  return {
    trabajadores: listTrabajadores({ incluirBaja: true }).length,
    contratos: listContratos().length,
    novedades: listNovedades().length,
    periodos: list('periodos').length,
    liquidaciones: listLiquidaciones().length,
    catalogos: list('catalogos').length
  };
}

export function loadSeedData({ reset = true, mark = true } = {}) {
  if (isSeedDisabled() || !storage()) return null;

  if (reset) resetOperationalData();
  inicializarParametros({ force: true });
  inicializarConceptos({ force: true });

  for (const definition of SEED_DATASET.periodos) {
    asegurarPeriodo(definition.id, { estado: definition.estado });
  }

  const catalogs = catalogMap();
  const workers = createWorkers(catalogs);
  createContracts(workers);
  createNovedades(workers);
  applyDesvinculaciones(workers);

  const workerIds = workerEntityIdsFromStorage();
  calcularPeriodo({
    periodo: PERIODO_CALCULADO,
    trabajadores: loadEntities().filter((entity) =>
      workerIds.has(String(entity.entity_id || entity.id))
    ),
    contratos: listContratos(),
    viewer: ADMIN
  });
  marcarPeriodoCalculado(PERIODO_CALCULADO);
  applyBonos(workers);

  if (mark) storage().setItem(SEED_LOADED_KEY, 'loaded');
  return getSeedSummary();
}

export function restoreSeedData() {
  return loadSeedData({ reset: true, mark: true });
}

export function ensureSeedOnFirstBoot() {
  if (isSeedDisabled() || !storage()) return false;
  if (storage().getItem(SEED_LOADED_KEY)) return false;
  if (hasStoredRrhhData()) {
    storage().setItem(SEED_LOADED_KEY, 'skipped-existing-data');
    return false;
  }
  loadSeedData({ reset: false, mark: true });
  return true;
}
