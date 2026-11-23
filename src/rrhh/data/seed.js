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
  cambiarEstadoLiquidacion,
  clearLiquidaciones,
  listLiquidaciones,
  listLiquidacionesPeriodo,
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
  TRAMOS_ASIGNACION_TABLE,
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
import { etiquetaPeriodo, rangoPeriodo } from '../utils/periodos.js';
import { calcularDigitoVerificador } from '../calculo/rut.js';
import { clearFeriados, crearFeriado } from '../utils/feriados-service.js';
import {
  aprobarSolicitud,
  clearSolicitudesVacacion,
  crearSolicitud
} from '../utils/vacaciones-service.js';
import { clearCargas, crearCarga } from '../utils/cargas-service.js';
import { hoyISO, sumarAnios, sumarDias } from '../utils/fechas.js';
import {
  actualizarTrabajador,
  clearTrabajadores,
  crearTrabajador,
  desactivarTrabajador,
  listTrabajadores
} from '../utils/trabajadores-service.js';

export const SEED_LOADED_KEY = 'erp_rrhh:seedLoaded';
export const SEED_CLOSED_PERIOD_KEY = 'erp_rrhh:seedClosedPeriod';
export const SEED_DISABLE_FLAG = '__ERP_BASE_SEED_DISABLED__';

/** Deliberately invalid; exported only for validation tests. */
export const RUT_INVALIDO_EJEMPLO = '12.345.678-9';

export const PERIODO_CERRADO = '2026-08';
export const PERIODO_CALCULADO = '2026-09';
export const PERIODO_ABIERTO = '2026-10';

function fechaRelativa(dias) {
  const fecha = new Date();
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

const VENCIMIENTO_CERCANO = fechaRelativa(12);

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
    { id: PERIODO_CERRADO, estado: 'cerrado' },
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
    },
    {
      key: 'claudia',
      code: 'TR-006',
      name: 'Claudia Morales Fuentes',
      rut: '12.000.001-2',
      email: 'claudia.morales@ejemplo.cl',
      phone: '+56 9 4666 7788',
      address: 'Av. Providencia 2200, Providencia',
      afp: 'AFP Capital',
      salud: 'Isapre Consalud',
      cargo: 'Contador',
      cargoCodigo: 'CAR-CONT',
      departamentoCodigo: 'FIN',
      centroCostoCodigo: 'CC-FIN',
      fechaIngreso: '2026-08-03',
      estadoLaboral: 'Activo',
      jefeKey: 'ana',
      estadoLiquidacion: 'borrador'
    },
    {
      key: 'carlos',
      code: 'TR-007',
      name: 'Carlos Mena Rojas',
      rut: '12.000.002-0',
      email: 'carlos.mena@ejemplo.cl',
      phone: '+56 9 4777 8899',
      address: 'Av. Ossa 900, Ñuñoa',
      afp: 'AFP Modelo',
      salud: 'Fonasa 7%',
      cargo: 'Operario de Bodega',
      cargoCodigo: 'CAR-OP',
      departamentoCodigo: 'OPE',
      centroCostoCodigo: 'CC-OPE',
      fechaIngreso: '2026-08-10',
      estadoLaboral: 'Activo',
      jefeKey: 'ana',
      estadoLiquidacion: 'borrador'
    },
    {
      key: 'cristobal',
      code: 'TR-008',
      name: 'Cristóbal Soto Aguirre',
      rut: '12.000.003-9',
      email: 'cristobal.soto@ejemplo.cl',
      phone: '+56 9 4888 9900',
      address: 'Calle Huérfanos 1500, Santiago',
      afp: 'AFP Habitat',
      salud: 'Isapre Banmédica',
      cargo: 'Analista de Remuneraciones',
      cargoCodigo: 'CAR-RRHH',
      departamentoCodigo: 'RH',
      centroCostoCodigo: 'CC-RRHH',
      fechaIngreso: '2026-08-17',
      estadoLaboral: 'Activo',
      jefeKey: 'ana',
      estadoLiquidacion: 'borrador'
    },
    {
      key: 'marta',
      code: 'TR-009',
      name: 'Marta Cáceres Vidal',
      rut: '12.000.004-7',
      email: 'marta.caceres@ejemplo.cl',
      phone: '+56 9 4999 0011',
      address: 'Av. Apoquindo 1800, Las Condes',
      afp: 'AFP Provida',
      salud: 'Fonasa 7%',
      cargo: 'Asistente Administrativa',
      cargoCodigo: 'CAR-ASIS',
      departamentoCodigo: 'RH',
      centroCostoCodigo: 'CC-RRHH',
      fechaIngreso: '2026-08-01',
      estadoLaboral: 'Activo',
      jefeKey: 'luis',
      estadoLiquidacion: 'aprobada'
    },
    {
      key: 'mauricio',
      code: 'TR-010',
      name: 'Mauricio Fuentes Ríos',
      rut: '12.000.005-5',
      email: 'mauricio.fuentes@ejemplo.cl',
      phone: '+56 9 4111 2233',
      address: 'Av. Providencia 1000, Providencia',
      afp: 'AFP Cuprum',
      salud: 'Isapre Consalud',
      cargo: 'Contador',
      cargoCodigo: 'CAR-CONT',
      departamentoCodigo: 'FIN',
      centroCostoCodigo: 'CC-FIN',
      fechaIngreso: '2026-08-05',
      estadoLaboral: 'Activo',
      jefeKey: 'luis',
      estadoLiquidacion: 'aprobada'
    },
    {
      key: 'marcela',
      code: 'TR-011',
      name: 'Marcela Ruiz Aguilar',
      rut: '12.000.006-3',
      email: 'marcela.ruiz@ejemplo.cl',
      phone: '+56 9 4222 3344',
      address: 'Av. Apoquindo 2500, Las Condes',
      afp: 'AFP Capital',
      salud: 'Fonasa 7%',
      cargo: 'Diseñadora UX',
      cargoCodigo: 'CAR-UX',
      departamentoCodigo: 'PRO',
      centroCostoCodigo: 'CC-PRO',
      fechaIngreso: '2026-08-12',
      estadoLaboral: 'Activo',
      jefeKey: 'luis',
      estadoLiquidacion: 'pagada'
    },
    {
      key: 'diego',
      code: 'TR-012',
      name: 'Diego Valenzuela Costa',
      rut: '12.000.007-1',
      email: 'diego.valenzuela@ejemplo.cl',
      phone: '+56 9 4333 4455',
      address: 'Camino a Melipilla 5000, Maipú',
      afp: 'AFP Modelo',
      salud: 'Fonasa 7%',
      cargo: 'Operario de Bodega',
      cargoCodigo: 'CAR-OP',
      departamentoCodigo: 'OPE',
      centroCostoCodigo: 'CC-OPE',
      fechaIngreso: '2026-08-20',
      estadoLaboral: 'Activo',
      jefeKey: 'luis',
      estadoLiquidacion: 'pagada'
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
    },
    {
      trabajadorKey: 'claudia',
      tipoContrato: 'indefinido',
      sueldoBase: 780000,
      jornadaHorasSemanales: 40,
      fechaInicio: '2026-08-03',
      modalidadGratificacion: 'art50',
      asignacionColacion: 30000,
      asignacionMovilizacion: 0
    },
    {
      trabajadorKey: 'carlos',
      tipoContrato: 'part_time',
      sueldoBase: 620000,
      jornadaHorasSemanales: 30,
      fechaInicio: '2026-08-10',
      modalidadGratificacion: 'art50',
      asignacionColacion: 25000,
      asignacionMovilizacion: 0
    },
    {
      trabajadorKey: 'cristobal',
      tipoContrato: 'indefinido',
      sueldoBase: 950000,
      jornadaHorasSemanales: 40,
      fechaInicio: '2026-08-17',
      modalidadGratificacion: 'art50',
      asignacionColacion: 35000,
      asignacionMovilizacion: 10000
    },
    {
      trabajadorKey: 'marta',
      tipoContrato: 'part_time',
      sueldoBase: 650000,
      jornadaHorasSemanales: 28,
      fechaInicio: '2026-08-01',
      modalidadGratificacion: 'art50',
      asignacionColacion: 28000,
      asignacionMovilizacion: 0
    },
    {
      trabajadorKey: 'mauricio',
      tipoContrato: 'indefinido',
      sueldoBase: 900000,
      jornadaHorasSemanales: 40,
      fechaInicio: '2026-08-05',
      modalidadGratificacion: 'art50',
      asignacionColacion: 32000,
      asignacionMovilizacion: 8000
    },
    {
      trabajadorKey: 'marcela',
      tipoContrato: 'plazo_fijo',
      sueldoBase: 880000,
      jornadaHorasSemanales: 38,
      fechaInicio: '2026-08-12',
      fechaTermino: VENCIMIENTO_CERCANO,
      modalidadGratificacion: 'art50',
      asignacionColacion: 30000,
      asignacionMovilizacion: 12000
    },
    {
      trabajadorKey: 'diego',
      tipoContrato: 'indefinido',
      sueldoBase: 620000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2026-08-20',
      modalidadGratificacion: 'art50',
      asignacionColacion: 30000,
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
    },
    {
      trabajadorKey: 'diego',
      fecha: '2026-09-20'
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
  clearFeriados();
  clearCargas();
  clearSolicitudesVacacion();
  clearNovedades();
  clearLiquidaciones();
  clearContratos();
  clearTrabajadores();
  clearPeriodos();
  clearCatalogos();
  clearTable(PARAMETROS_TABLE);
  clearTable(TRAMOS_TABLE);
  clearTable(TRAMOS_ASIGNACION_TABLE);
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
        estadoLaboral: definition.estadoLaboral,
        genero: GENEROS_SEED[definition.key] || ''
      },
      ADMIN
    );
    workers.set(definition.key, worker);
  }
  return workers;
}

/** Optional, sensitive field used only by the pay-equity report (US10). */
const GENEROS_SEED = {
  ana: 'Femenino',
  luis: 'Masculino',
  camila: 'Femenino',
  mateo: 'Masculino',
  renata: 'Femenino',
  claudia: 'Femenino',
  carlos: 'Masculino',
  cristobal: 'Masculino',
  marta: 'Femenino',
  mauricio: 'Masculino',
  marcela: 'Femenino',
  diego: 'Prefiere no informar'
};

/** Chilean public holidays of 2026 (reference calendar for US7). */
const FERIADOS_SEED = [
  ['2026-01-01', 'Año Nuevo'],
  ['2026-04-03', 'Viernes Santo'],
  ['2026-04-04', 'Sábado Santo'],
  ['2026-05-01', 'Día Nacional del Trabajo'],
  ['2026-05-21', 'Día de las Glorias Navales'],
  ['2026-06-29', 'San Pedro y San Pablo'],
  ['2026-07-16', 'Día de la Virgen del Carmen'],
  ['2026-08-15', 'Asunción de la Virgen'],
  ['2026-09-18', 'Independencia Nacional'],
  ['2026-09-19', 'Día de las Glorias del Ejército'],
  ['2026-10-12', 'Encuentro de Dos Mundos'],
  ['2026-10-31', 'Día de las Iglesias Evangélicas'],
  ['2026-11-01', 'Día de Todos los Santos'],
  ['2026-12-08', 'Inmaculada Concepción'],
  ['2026-12-25', 'Navidad']
];

function createFeriados() {
  for (const [fecha, nombre] of FERIADOS_SEED) {
    crearFeriado({ fecha, nombre }, ADMIN, { audit: false });
  }
}

function rutSeed(body) {
  return `${body}-${calcularDigitoVerificador(body)}`;
}

/** Dependants: Mateo (bracket B) gets the allowance; one child turns 18 soon. */
function createCargas(workers) {
  const mateo = workers.get('mateo');
  const carlos = workers.get('carlos');
  const base = { tipo: 'simple', resolucionFecha: '2025-01-15', vigenteDesde: '2025-01-01' };
  crearCarga(
    {
      ...base,
      entityId: mateo.entityId,
      nombre: 'Tomás Fuentes Rojas',
      rut: rutSeed('23456789'),
      parentesco: 'hijo',
      fechaNacimiento: '2018-04-12',
      resolucionNumero: 'IPS-2025-0412'
    },
    ADMIN
  );
  crearCarga(
    {
      ...base,
      entityId: mateo.entityId,
      nombre: 'Josefa Fuentes Rojas',
      rut: rutSeed('22345678'),
      parentesco: 'hijo',
      fechaNacimiento: sumarAnios(sumarDias(hoyISO(), 15), -18),
      resolucionNumero: 'IPS-2025-0413'
    },
    ADMIN
  );
  crearCarga(
    {
      ...base,
      entityId: carlos.entityId,
      nombre: 'Paula Díaz Morales',
      rut: rutSeed('16789012'),
      parentesco: 'conyuge',
      fechaNacimiento: '1990-09-30',
      tipo: 'invalidez',
      resolucionNumero: 'IPS-2026-0815',
      resolucionFecha: '2026-08-15',
      vigenteDesde: '2026-08-10'
    },
    ADMIN
  );
}

/** Next Monday at least `dias` days from today, so demo ranges are business days. */
function lunesDesde(dias) {
  let day = sumarDias(hoyISO(), dias);
  while (new Date(`${day}T00:00:00Z`).getUTCDay() !== 1) day = sumarDias(day, 1);
  return day;
}

/** One approved request (Ana, no direct manager) and one pending for the jefatura. */
function createVacaciones(workers) {
  const ana = workers.get('ana');
  const claudia = workers.get('claudia');
  try {
    const inicioAna = lunesDesde(21);
    const aprobada = crearSolicitud(
      {
        entityId: ana.entityId,
        fechaInicio: inicioAna,
        fechaFin: sumarDias(inicioAna, 4),
        observacion: 'Vacaciones de verano'
      },
      { role: 'trabajador', usuario: ana.name, trabajadorId: ana.entityId }
    );
    aprobarSolicitud(aprobada.id, ADMIN);
    const inicioClaudia = lunesDesde(35);
    crearSolicitud(
      {
        entityId: claudia.entityId,
        fechaInicio: inicioClaudia,
        fechaFin: sumarDias(inicioClaudia, 1),
        observacion: 'Trámite personal'
      },
      { role: 'trabajador', usuario: claudia.name, trabajadorId: claudia.entityId }
    );
  } catch {
    // Demo data must never block the seed (e.g. a holiday lands on the range).
  }
}

function applyJefaturas(workers) {
  for (const definition of SEED_DATASET.trabajadores) {
    if (!definition.jefeKey) continue;
    const jefe = workers.get(definition.jefeKey);
    const worker = workers.get(definition.key);
    actualizarTrabajador(worker.entityId, { jefeId: jefe.entityId }, ADMIN);
  }
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

const TRANSICIONES_LIQUIDACION_SEED = {
  borrador: ['borrador'],
  aprobada: ['aprobada'],
  pagada: ['aprobada', 'pagada']
};

function applyEstadosLiquidacion(workers) {
  const liquidaciones = listLiquidacionesPeriodo(PERIODO_CALCULADO);
  for (const definition of SEED_DATASET.trabajadores) {
    const transiciones = TRANSICIONES_LIQUIDACION_SEED[definition.estadoLiquidacion] || [];
    if (!transiciones.length) continue;
    const worker = workers.get(definition.key);
    const liquidacion = liquidaciones.find((row) => row.trabajador?.entityId === worker.entityId);
    if (!liquidacion) continue;
    for (const estado of transiciones) {
      cambiarEstadoLiquidacion(liquidacion.id, estado, { viewer: ADMIN });
    }
  }
}

/**
 * Historical, closed-period liquidations.
 *
 * The Trabajador role may only consult liquidaciones from closed periods, so
 * the demo dataset needs at least one closed period with paid liquidations.
 * They are derived from the calculated snapshot to keep amounts consistent.
 */
function crearLiquidacionesPeriodoCerrado() {
  asegurarPeriodo(PERIODO_CERRADO, { estado: 'cerrado' });
  const origen = listLiquidacionesPeriodo(PERIODO_CALCULADO);
  if (origen.length === 0) return;
  const rango = rangoPeriodo(PERIODO_CERRADO);
  const periodo = {
    id: PERIODO_CERRADO,
    anio: 2026,
    mes: 8,
    etiqueta: etiquetaPeriodo(PERIODO_CERRADO),
    fechaInicio: rango.fechaInicio,
    fechaFin: rango.fechaFin,
    cerrado: true
  };

  for (const liquidacion of origen) {
    const entityId = liquidacion.trabajador?.entityId || liquidacion.trabajador?.id;
    if (!entityId) continue;
    const id = `liq-${PERIODO_CERRADO}-${entityId}`;
    saveLiquidacion({
      ...liquidacion,
      id,
      document_id: id,
      numero: `LIQ-${PERIODO_CERRADO}-${entityId}`,
      estado: 'pagada',
      periodoId: PERIODO_CERRADO,
      periodo: { ...periodo },
      fechaEmision: rango.fechaFin
    });
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
  applyJefaturas(workers);
  createContracts(workers);
  createNovedades(workers);
  createFeriados();
  createCargas(workers);
  applyDesvinculaciones(workers);
  createVacaciones(workers);

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
  applyEstadosLiquidacion(workers);
  crearLiquidacionesPeriodoCerrado();

  if (mark) {
    storage().setItem(SEED_LOADED_KEY, 'loaded');
    storage().setItem(SEED_CLOSED_PERIOD_KEY, 'loaded');
  }
  return getSeedSummary();
}

export function restoreSeedData() {
  return loadSeedData({ reset: true, mark: true });
}

/** Patch existing demo data so Trabajador sessions have closed-period liquidaciones. */
export function ensureClosedPeriodLiquidations() {
  if (isSeedDisabled() || !storage()) return false;
  if (storage().getItem(SEED_CLOSED_PERIOD_KEY)) return false;
  crearLiquidacionesPeriodoCerrado();
  storage().setItem(SEED_CLOSED_PERIOD_KEY, 'loaded');
  return true;
}

export function ensureSeedOnFirstBoot() {
  if (isSeedDisabled() || !storage()) return false;
  if (storage().getItem(SEED_LOADED_KEY)) return ensureClosedPeriodLiquidations();
  if (hasStoredRrhhData()) {
    storage().setItem(SEED_LOADED_KEY, 'skipped-existing-data');
    return ensureClosedPeriodLiquidations();
  }
  loadSeedData({ reset: false, mark: true });
  return true;
}
