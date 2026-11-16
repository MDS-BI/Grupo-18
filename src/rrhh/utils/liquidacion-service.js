import { createDemoLiquidacion, validateLiquidacion } from './liquidacion-data.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { can } from '../seguridad/roles.js';
import { validarRut } from '../calculo/rut.js';
import {
  calcularLiquidacionTrabajador,
  resolverParametroDeCalculo
} from '../calculo/motor.js';
import {
  assertCambioEstado,
  ESTADO_LIQUIDACION_LABELS
} from './liquidacion-estados.js';
import {
  asegurarPeriodo,
  getPeriodo,
  isPeriodoCerrado,
  marcarPeriodoCalculado,
  PeriodoCerradoError
} from './periodos-service.js';
import { estadoElegibilidad, novedadesAprobadas } from './novedades-service.js';
import { etiquetaPeriodo, parsePeriodo, rangoPeriodo } from './periodos.js';
import { parametrosVigentes } from './parametros-service.js';
import { resumenCostoEmpleador } from './costo-empleador.js';

export const STORAGE_KEY = 'erp_rrhh:liquidaciones';
export const LIQUIDACIONES_TABLE = 'liquidaciones';

function getStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
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

function saveLiquidaciones(liquidaciones) {
  for (const liquidacion of liquidaciones) {
    const validation = validateLiquidacion(liquidacion);
    if (!validation.valid) {
      const error = new Error(`Liquidación inválida: ${validation.errors.join(' ')}`);
      error.errors = validation.errors;
      throw error;
    }
  }
  const stored = readAll();
  for (const liquidacion of liquidaciones) {
    const index = stored.findIndex((item) => item.id === liquidacion.id);
    if (index >= 0) stored[index] = clone(liquidacion);
    else stored.push(clone(liquidacion));
  }
  writeAll(stored);
  return liquidaciones.map(clone);
}

/** List every stored liquidation snapshot. */
export function listLiquidaciones() {
  return readAll().map(clone);
}

export function listLiquidacionesPeriodo(periodoId) {
  if (!periodoId) return listLiquidaciones();
  return listLiquidaciones().filter(
    (row) => row.periodoId === periodoId || row.periodo?.id === periodoId || row.periodo?.periodo === periodoId
  );
}

export function getLiquidacion(id) {
  return clone(readAll().find((item) => item.id === id) || null);
}

/**
 * Load a liquidation by id. With no id, return the first stored record or a
 * demo snapshot when the store is empty.
 */
export function loadLiquidacion(id, viewer) {
  const liquidaciones = readAll();
  let result;
  if (id) result = liquidaciones.find((item) => item.id === id) || null;
  else if (liquidaciones.length > 0) result = liquidaciones[0];
  else result = saveLiquidacion(createDemoLiquidacion());
  if (result && viewer) {
    registrarAuditoria({
      accion: 'ver_sensible',
      tabla: LIQUIDACIONES_TABLE,
      registroId: result.id,
      motivo: 'Consulta de liquidación',
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
  }
  return clone(result);
}

/** Clear stored liquidations (used by tests and explicit resets). */
export function clearLiquidaciones() {
  const storage = getStorage();
  if (storage) storage.removeItem(STORAGE_KEY);
}

function normalizarPeriodo(periodo) {
  if (!periodo) {
    const today = new Date();
    const id = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return asegurarPeriodo(id);
  }
  const id = typeof periodo === 'string' ? periodo : periodo.id || periodo.periodo;
  const existing = getPeriodo(id);
  if (existing) return existing;
  const parsed = parsePeriodo(id);
  if (!parsed) throw new Error('Período inválido para calcular la planilla.');
  const range = rangoPeriodo(id);
  return {
    ...(typeof periodo === 'object' ? periodo : {}),
    id,
    periodo: id,
    anio: parsed.anio,
    mes: parsed.mes,
    etiqueta: etiquetaPeriodo(id),
    ...range,
    estado: typeof periodo === 'object' && periodo.estado ? periodo.estado : 'abierto',
    cerrado: typeof periodo === 'object' ? Boolean(periodo.cerrado) : false
  };
}

function trabajadorDesdeEntidad(entity = {}) {
  const entityId = entity.entity_id || entity.id;
  return {
    id: entityId,
    entityId,
    nombre: entity.name || entity.nombre || 'Trabajador sin identificar',
    rut: entity.taxId || entity.rut || 'Sin RUT',
    cargo: entity.cargo || entity.category || '',
    departamento: entity.departamento || entity.category || '',
    centroCosto: entity.centroCosto || entity.departamentoCentroCosto || entity.category || ''
  };
}

function contratoDe(trabajador, contratos) {
  const entityId = trabajador.entityId || trabajador.id;
  const found = entityId
    ? contratos.find(
        (row) => row.entity_id === entityId || row.trabajadorEntityId === entityId
      )
    : null;
  return found || trabajador.contrato || null;
}

function numeroLiquidacion(periodo, entityId) {
  const suffix = String(entityId || '').replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase() || '00000';
  return `LQ-${periodo.anio}-${String(periodo.mes).padStart(2, '0')}-${suffix}`;
}

function construyeLiquidacion(resultado, trabajador, contrato, periodo, viewer) {
  const now = new Date().toISOString();
  return {
    id: `liq-${periodo.id}-${trabajador.entityId}`,
    document_id: `liq-${periodo.id}-${trabajador.entityId}`,
    numero: numeroLiquidacion(periodo, trabajador.entityId),
    estado: 'calculada',
    trabajador,
    contratoId: contrato.id || null,
    periodoId: periodo.id,
    periodo: {
      id: periodo.id,
      anio: periodo.anio,
      mes: periodo.mes,
      etiqueta: periodo.etiqueta || etiquetaPeriodo(periodo.id),
      fechaInicio: periodo.fechaInicio,
      fechaFin: periodo.fechaFin,
      cerrado: Boolean(periodo.cerrado)
    },
    fechaEmision: resultado.fechaEmision,
    lineas: resultado.lineas,
    totales: resultado.totales,
    bases: resultado.bases,
    descuentos: resultado.descuentos,
    impuesto: resultado.impuesto,
    aportesEmpleador: resultado.aportesEmpleador,
    totalAportesEmpleador: resultado.totalAportesEmpleador,
    costoEmpleador: resultado.costoEmpleador,
    novedadesAplicadas: resultado.novedadesAplicadas,
    advertencias: resultado.advertencias,
    calculadoPor: viewer?.usuario || viewer?.role || 'Sistema',
    calculadoEn: now,
    createdAt: now,
    updatedAt: now
  };
}

/**
 * Calculate every worker with an active contract for a period.
 *
 * Only approved novedades feed the engine. Pending/rejected novedades produce
 * warnings but are never exposed to the calculation. Workers without a
 * contract are excluded and reported.
 */
export function calcularPeriodo({
  periodo,
  trabajadores = [],
  contratos = [],
  novedades,
  parametros,
  viewer,
  fechaPago
} = {}) {
  const normalized = normalizarPeriodo(periodo);
  if (isPeriodoCerrado(normalized.id)) throw new PeriodoCerradoError(normalized.id);
  if (!can(viewer?.role, 'canCalculate') && viewer?.role) {
    const error = new Error('Tu rol no puede calcular planillas.');
    error.code = 'PERMISO_DENEGADO';
    throw error;
  }

  const fechaFin = normalized.fechaFin || rangoPeriodo(normalized.id).fechaFin;
  const legalParams = parametros || parametrosVigentes(fechaFin);
  const eligibility = estadoElegibilidad(normalized.id);
  const advertencias = [...eligibility.advertencias];
  const trabajadoresExcluidos = [];
  const liquidaciones = [];
  const existentes = readAll();
  const novedadesDelPeriodo =
    novedades === undefined ? novedadesAprobadas(normalized.id) : null;

  for (const entity of trabajadores) {
    const trabajador = trabajadorDesdeEntidad(entity);
    const rutDeclarado = entity.taxId || entity.rut;
    if (rutDeclarado && !validarRut(rutDeclarado)) {
      const error = new Error(
        `El RUT de ${trabajador.nombre} no es válido; corrige la ficha del trabajador antes de calcular.`
      );
      error.code = 'RUT_INVALIDO';
      throw error;
    }
    const contrato = contratoDe(trabajador, contratos);
    if (!contrato || (contrato.estado && contrato.estado !== 'vigente')) {
      trabajadoresExcluidos.push({
        entityId: trabajador.entityId,
        nombre: trabajador.nombre,
        motivo: 'Sin contrato vigente en el período'
      });
      continue;
    }
    const previa = existentes.find(
      (row) =>
        row.periodoId === normalized.id &&
        row.trabajador?.entityId === trabajador.entityId &&
        row.estado !== 'anulada'
    );
    if (previa && (previa.estado === 'aprobada' || previa.estado === 'pagada')) {
      trabajadoresExcluidos.push({
        entityId: trabajador.entityId,
        nombre: trabajador.nombre,
        motivo: `Liquidación ${previa.estado}: no se recalcula`
      });
      continue;
    }

    const workerNovedades =
      novedades !== undefined
        ? novedades.filter(
            (row) =>
              row.trabajadorEntityId === trabajador.entityId &&
              (!row.estado || row.estado === 'aprobada')
          )
        : novedadesDelPeriodo.filter(
            (row) => row.trabajadorEntityId === trabajador.entityId
          );

    const resultado = calcularLiquidacionTrabajador({
      trabajador,
      contrato,
      novedades: workerNovedades,
      parametros: legalParams,
      periodo: normalized
    });
    const liquidacion = construyeLiquidacion(resultado, trabajador, contrato, normalized, viewer);
    liquidacion.advertencias = [...new Set([...advertencias, ...resultado.advertencias])];
    liquidaciones.push(liquidacion);
    advertencias.push(...resultado.advertencias);
  }

  saveLiquidaciones(liquidaciones);
  marcarPeriodoCalculado(normalized.id);

  registrarAuditoria({
    accion: 'calcular',
    tabla: LIQUIDACIONES_TABLE,
    registroId: normalized.id,
    camposModificados: ['estado'],
    motivo: `Cálculo de planilla ${normalized.etiqueta || normalized.id}`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });

  return {
    periodo: normalized,
    liquidaciones,
    resumen: {
      trabajadoresCalculados: liquidaciones.length,
      trabajadoresExcluidos: trabajadoresExcluidos.length,
      novedadesPendientes: eligibility.pendientes,
      novedadesRechazadas: eligibility.rechazadas,
      novedadesAprobadas: eligibility.aprobadas,
      totalHaberes: liquidaciones.reduce((total, row) => total + row.totales.haberes, 0),
      totalLiquido: liquidaciones.reduce((total, row) => total + row.totales.liquido, 0),
      costoEmpleador: resumenCostoEmpleador(liquidaciones).totalCosto,
      ...resumenCostoEmpleador(liquidaciones)
    },
    trabajadoresExcluidos,
    advertencias: [...new Set(advertencias)],
    fechaPago: fechaPago || null
  };
}

/**
 * Change a liquidation lifecycle state. Closed periods freeze the record and
 * every transition is audited with the acting user.
 */
export function cambiarEstadoLiquidacion(id, hasta, { viewer, motivo = '', periodo } = {}) {
  const liquidacion = getLiquidacion(id);
  if (!liquidacion) {
    const error = new Error('La liquidación no existe.');
    error.code = 'LIQUIDACION_NO_ENCONTRADA';
    throw error;
  }
  const period = periodo || getPeriodo(liquidacion.periodoId || liquidacion.periodo?.id);
  assertCambioEstado(liquidacion, hasta, { viewer, motivo, periodo: period });
  const timestamp = new Date().toISOString();
  const changes = {
    estado: hasta,
    updatedAt: timestamp
  };
  if (hasta === 'aprobada') {
    changes.aprobadoPor = viewer?.usuario || viewer?.role || 'Sistema';
    changes.fechaAprobacion = timestamp;
  }
  if (hasta === 'pagada') {
    changes.pagadoPor = viewer?.usuario || viewer?.role || 'Sistema';
    changes.fechaPago = timestamp;
  }
  if (hasta === 'anulada') {
    changes.anuladoPor = viewer?.usuario || viewer?.role || 'Sistema';
    changes.motivoAnulacion = motivo;
  }
  saveLiquidacion({ ...liquidacion, ...changes });
  const acciones = {
    calculada: 'calcular',
    aprobada: 'aprobar',
    pagada: 'pagar',
    anulada: 'anular'
  };
  registrarAuditoria({
    accion: acciones[hasta] || 'cambio_estado',
    tabla: LIQUIDACIONES_TABLE,
    registroId: id,
    camposModificados: ['estado'],
    motivo: motivo || `${ESTADO_LIQUIDACION_LABELS[hasta] || hasta} de la liquidación`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return getLiquidacion(id);
}

export function aprobarLiquidacion(id, viewer) {
  return cambiarEstadoLiquidacion(id, 'aprobada', { viewer });
}

export function pagarLiquidacion(id, viewer, fechaPago) {
  return cambiarEstadoLiquidacion(id, 'pagada', {
    viewer,
    motivo: fechaPago ? `Pago registrado el ${fechaPago}` : ''
  });
}

export function anularLiquidacion(id, viewer, motivo) {
  return cambiarEstadoLiquidacion(id, 'anulada', { viewer, motivo });
}

/** Current UI status of a liquidation for role-aware action rendering. */
export function estadoLiquidacion(id) {
  return getLiquidacion(id)?.estado || null;
}

/** Read the persisted legal parameter snapshot used by a liquidation line. */
export function parametroDeLinea(line) {
  return line?.parametroLegal || null;
}

/** Convenience re-export used by the calculation view. */
export { resolverParametroDeCalculo };
