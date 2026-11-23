/**
 * Headline metrics and chart series for the Resumen dashboard.
 *
 * Pure aggregation over the stored RR.HH. data; each role gets only what it
 * is allowed to see (the jefatura, its team; no money outside admin/analyst).
 */

import { listTrabajadores } from './trabajadores-service.js';
import { contratosPorVencer } from './alertas-service.js';
import { listNovedades } from './novedades-service.js';
import { listLiquidaciones } from './liquidacion-service.js';
import { listSolicitudes } from './vacaciones-service.js';
import { equipoDeJefatura } from './jefatura.js';
import { etiquetaPeriodo } from './periodos.js';
import { TIPO_NOVEDAD_LABELS } from './novedades-data.js';
import { variacionPorcentual } from '../calculo/estadisticas.js';

const SIN_DEPARTAMENTO = 'Sin departamento';

function contar(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    map.set(key, (map.get(key) || 0) + 1);
  }
  return [...map.entries()].map(([etiqueta, valor]) => ({ etiqueta, valor }));
}

/** Employer cost per period (latest `limite` periods with liquidations), oldest first. */
export function costoPorPeriodo({ limite = 6 } = {}) {
  const porPeriodo = new Map();
  for (const row of listLiquidaciones()) {
    if (row.estado === 'anulada' || !row.periodoId) continue;
    porPeriodo.set(
      row.periodoId,
      (porPeriodo.get(row.periodoId) || 0) + (Number(row.costoEmpleador) || 0)
    );
  }
  return [...porPeriodo.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-limite)
    .map(([periodo, valor]) => ({ periodo, etiqueta: etiquetaPeriodo(periodo), valor }));
}

export function dotacionPorDepartamento(trabajadores) {
  return contar(
    trabajadores.filter((row) => row.activo),
    (row) => row.departamento || SIN_DEPARTAMENTO
  ).sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta));
}

export function novedadesPorTipo(novedades) {
  return contar(
    novedades.filter((row) => !['anulada', 'rechazada'].includes(row.estado)),
    (row) => TIPO_NOVEDAD_LABELS[row.tipo] || row.tipo
  ).sort((a, b) => b.valor - a.valor || a.etiqueta.localeCompare(b.etiqueta));
}

/** Metrics for administrators and payroll analysts. */
export function metricasGenerales({ hoy = new Date() } = {}) {
  const trabajadores = listTrabajadores({ incluirBaja: true });
  const activos = trabajadores.filter((row) => row.activo);
  const novedades = listNovedades();
  const costos = costoPorPeriodo();
  const ultimo = costos[costos.length - 1] || null;
  const anterior = costos[costos.length - 2] || null;
  const porVencer = contratosPorVencer({ dias: 30, hoy });
  return {
    kpis: {
      trabajadoresActivos: activos.length,
      desvinculados: trabajadores.length - activos.length,
      contratosPorVencer: porVencer.filter((row) => !row.vencido).length,
      contratosVencidos: porVencer.filter((row) => row.vencido).length,
      novedadesPendientes: novedades.filter((row) => row.estado === 'pendiente').length,
      vacacionesPendientes: listSolicitudes({ estado: 'pendiente' }).length,
      costoUltimoPeriodo: ultimo,
      variacionCosto: ultimo && anterior ? variacionPorcentual(ultimo.valor, anterior.valor) : null,
      periodoAnterior: anterior
    },
    series: {
      costoPorPeriodo: costos,
      dotacionPorDepartamento: dotacionPorDepartamento(trabajadores),
      novedadesPorTipo: novedadesPorTipo(novedades)
    }
  };
}

/** Metrics for a jefatura: only its team, never money. */
export function metricasEquipo(viewer) {
  const team = new Set((equipoDeJefatura(viewer) || []).map(String));
  const miembros = listTrabajadores({ incluirBaja: true, viewer });
  const novedades = listNovedades().filter((row) => team.has(String(row.trabajadorEntityId)));
  const vacaciones = listSolicitudes({ viewer, estado: 'pendiente' });
  return {
    kpis: {
      miembrosActivos: miembros.filter((row) => row.activo).length,
      novedadesPendientes: novedades.filter((row) => row.estado === 'pendiente').length,
      vacacionesPendientes: vacaciones.length
    },
    series: {
      novedadesPorTipo: novedadesPorTipo(novedades)
    }
  };
}
