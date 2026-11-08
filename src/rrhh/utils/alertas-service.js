/**
 * Contract expiry alerts.
 *
 * A contract that ends within `DIAS_ALERTA_CONTRATO` days is surfaced on the
 * dashboard so payroll never runs with an expired or about-to-expire contract.
 */

import { loadEntities } from '../../storage.js';
import { listContratos } from './contratos-service.js';

export const DIAS_ALERTA_CONTRATO = 30;

function startOfUTCDay(value) {
  const date = value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00Z`);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

/** Whole days between a date and the reference day (can be negative). */
export function diasHastaVencimiento(fechaTermino, hoy = new Date()) {
  if (!fechaTermino) return null;
  const end = Date.parse(`${String(fechaTermino).slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(end)) return null;
  return Math.round((startOfUTCDay(fechaTermino) - startOfUTCDay(hoy)) / 86400000);
}

function workerName(entityId, entities) {
  const entity = entities.find((row) => (row.entity_id || row.id) === entityId);
  return entity?.name || entityId || 'Trabajador sin identificar';
}

/**
 * Contracts whose `fechaTermino` is within the alert window.
 *
 * @returns {Array<{contratoId, entityId, trabajador, fechaTermino, diasRestantes, vencido}>}
 */
export function contratosPorVencer({
  dias = DIAS_ALERTA_CONTRATO,
  hoy = new Date(),
  contratos,
  entities
} = {}) {
  const workers = entities || loadEntities();
  const rows = contratos || listContratos({ incluirTerminados: true });
  const alerts = [];
  for (const contrato of rows) {
    if (contrato.estado === 'terminado' || contrato.bajaLogica) continue;
    if (!contrato.fechaTermino) continue;
    const diasRestantes = diasHastaVencimiento(contrato.fechaTermino, hoy);
    if (diasRestantes === null) continue;
    if (diasRestantes > dias) continue;
    alerts.push({
      contratoId: contrato.id,
      entityId: contrato.entityId || contrato.entity_id,
      trabajador: workerName(contrato.entityId || contrato.entity_id, workers),
      fechaTermino: contrato.fechaTermino,
      diasRestantes,
      vencido: diasRestantes < 0
    });
  }
  return alerts.sort((a, b) => a.diasRestantes - b.diasRestantes);
}

export function alertasContratos(options = {}) {
  return contratosPorVencer(options);
}

export function resumenAlertas(options = {}) {
  const alerts = contratosPorVencer(options);
  return {
    total: alerts.length,
    vencidos: alerts.filter((row) => row.vencido).length,
    proximos: alerts.filter((row) => !row.vencido).length,
    alertas: alerts
  };
}
