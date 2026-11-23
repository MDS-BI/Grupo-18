/**
 * Management and pay-equity reports (US10, FR-097–FR-100, FR-111).
 *
 * - Only closed periods are included, so figures never change afterwards.
 * - Reports show aggregates only: any team, department, cost centre or gender
 *   group with fewer than 5 people is hidden, for every role.
 * - Administrator: every report; analyst: all but the gender gap; jefatura:
 *   overtime and absenteeism of their team, without money; worker: none.
 */

import { registrarAuditoria } from '../seguridad/auditoria.js';
import { brechaPorcentual, mediana, variacionPorcentual } from '../calculo/estadisticas.js';
import { listPeriodos, isPeriodoCerrado } from './periodos-service.js';
import { etiquetaPeriodo, rangoPeriodo } from './periodos.js';
import { listTrabajadores, generoDeTrabajador } from './trabajadores-service.js';
import { listLiquidacionesPeriodo } from './liquidacion-service.js';
import { listNovedades } from './novedades-service.js';
import { getContratoVigente } from './contratos-service.js';
import { equipoDeJefatura } from './jefatura.js';
import { listSolicitudes, contarDiasHabiles } from './vacaciones-service.js';

export const MIN_PERSONAS = 5;
export const MENSAJE_OCULTO =
  'Hay muy pocas personas para mostrar este dato sin identificar a nadie.';
export const MENSAJE_SIN_PERIODOS =
  'Los reportes se calculan solo sobre períodos cerrados, y todavía no hay ninguno.';

export const REPORTES = {
  dotacion: { titulo: 'Dotación', roles: ['administrador', 'analista'] },
  costo: { titulo: 'Costo de la planilla', roles: ['administrador', 'analista'] },
  horas_extra: { titulo: 'Horas extra', roles: ['administrador', 'analista', 'jefatura'] },
  ausentismo: { titulo: 'Ausentismo', roles: ['administrador', 'analista', 'jefatura'] },
  brecha: { titulo: 'Brecha salarial de género por cargo', roles: ['administrador'] }
};

const SIN_DEPARTAMENTO = 'Sin departamento';
const SIN_CENTRO = 'Sin centro de costo';

function fail(message, code = 'PERMISO_DENEGADO') {
  const error = new Error(message);
  error.code = code;
  error.errors = [message];
  throw error;
}

export function puedeVerReporte(viewer, tipo) {
  return Boolean(REPORTES[tipo]?.roles.includes(viewer?.role));
}

export function reportesDisponibles(viewer) {
  return Object.entries(REPORTES)
    .filter(([tipo]) => puedeVerReporte(viewer, tipo))
    .map(([tipo, def]) => ({ tipo, titulo: def.titulo }));
}

export function periodosCerrados({ desde, hasta } = {}) {
  return listPeriodos()
    .filter((row) => isPeriodoCerrado(row))
    .map((row) => row.id)
    .filter((id) => (!desde || id >= desde) && (!hasta || id <= hasta))
    .sort();
}

/* ---------- Population helpers ---------- */

function poblacion(viewer, departamentoId) {
  let rows = listTrabajadores({ incluirBaja: true });
  if (viewer?.role === 'jefatura') {
    const team = new Set((equipoDeJefatura(viewer) || []).map(String));
    rows = rows.filter((row) => team.has(String(row.entityId)));
  }
  if (departamentoId) rows = rows.filter((row) => row.departamentoId === departamentoId);
  return rows;
}

function activoAl(trabajador, fecha) {
  const ingreso = trabajador.fechaIngreso || '0000-01-01';
  const salida = trabajador.fechaDesvinculacion;
  return ingreso <= fecha && (!salida || salida > fecha);
}

function grupoDe(trabajador, viewer) {
  if (viewer?.role === 'jefatura') return 'Mi equipo';
  return trabajador.departamento || SIN_DEPARTAMENTO;
}

function agrupar(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function fila(periodo, grupo, personas, valores) {
  const oculto = personas < MIN_PERSONAS;
  return {
    periodo,
    periodoEtiqueta: periodo ? etiquetaPeriodo(periodo) : '',
    grupo,
    personas: oculto ? null : personas,
    oculto,
    mensaje: oculto ? MENSAJE_OCULTO : '',
    ...(oculto ? Object.fromEntries(Object.keys(valores).map((key) => [key, null])) : valores)
  };
}

function resultado(tipo, columnas, filas, grafico, extra = {}) {
  return { tipo, titulo: REPORTES[tipo].titulo, vacio: false, columnas, filas, grafico, ...extra };
}

/* ---------- Reports ---------- */

function reporteDotacion(periodos, viewer, departamentoId) {
  const personas = poblacion(viewer, departamentoId);
  const filas = [];
  for (const periodo of periodos) {
    const { fechaInicio, fechaFin } = rangoPeriodo(periodo);
    const grupos = agrupar(personas, (row) => grupoDe(row, viewer));
    let total = { activos: 0, altas: 0, bajas: 0 };
    for (const [grupo, rows] of grupos) {
      const activos = rows.filter((row) => activoAl(row, fechaFin)).length;
      const altas = rows.filter(
        (row) => row.fechaIngreso >= fechaInicio && row.fechaIngreso <= fechaFin
      ).length;
      const bajas = rows.filter(
        (row) =>
          row.fechaDesvinculacion &&
          row.fechaDesvinculacion >= fechaInicio &&
          row.fechaDesvinculacion <= fechaFin
      ).length;
      total = {
        activos: total.activos + activos,
        altas: total.altas + altas,
        bajas: total.bajas + bajas
      };
      filas.push(fila(periodo, grupo, activos, { activos, altas, bajas }));
    }
    if (grupos.length > 1) {
      filas.push({ ...fila(periodo, 'Total', total.activos, total), total: true });
    }
  }
  return resultado(
    'dotacion',
    [
      { key: 'activos', label: 'Activos al cierre' },
      { key: 'altas', label: 'Altas' },
      { key: 'bajas', label: 'Bajas' }
    ],
    filas,
    graficoPorPeriodo(filas, 'activos')
  );
}

function reporteCosto(periodos, viewer, departamentoId) {
  const personas = new Map(
    poblacion(viewer, departamentoId).map((row) => [String(row.entityId), row])
  );
  const filas = [];
  const anterior = new Map();
  for (const periodo of periodos) {
    const liquidaciones = listLiquidacionesPeriodo(periodo).filter(
      (row) => row.estado !== 'anulada' && personas.has(String(row.trabajador?.entityId))
    );
    const grupos = agrupar(
      liquidaciones,
      (row) => personas.get(String(row.trabajador.entityId)).centroCosto || SIN_CENTRO
    );
    let totalCosto = 0;
    for (const [grupo, rows] of grupos) {
      const costo = rows.reduce((sum, row) => sum + (Number(row.costoEmpleador) || 0), 0);
      totalCosto += costo;
      filas.push(
        fila(periodo, grupo, rows.length, {
          costo,
          variacion: variacionPorcentual(costo, anterior.get(grupo))
        })
      );
      anterior.set(grupo, costo);
    }
    if (grupos.length > 0) {
      filas.push({
        ...fila(periodo, 'Total', liquidaciones.length, {
          costo: totalCosto,
          variacion: variacionPorcentual(totalCosto, anterior.get('Total'))
        }),
        total: true
      });
      anterior.set('Total', totalCosto);
    }
  }
  return resultado(
    'costo',
    [
      { key: 'costo', label: 'Costo empleador', formato: 'dinero' },
      { key: 'variacion', label: 'Variación vs. período anterior', formato: 'porcentaje' }
    ],
    filas,
    graficoPorPeriodo(filas, 'costo')
  );
}

function novedadesAprobadasDe(periodo, tipo, ids) {
  return listNovedades({ periodo, estado: 'aprobada', tipo }).filter((row) =>
    ids.has(String(row.trabajadorEntityId))
  );
}

function reporteHorasExtra(periodos, viewer, departamentoId) {
  const personas = poblacion(viewer, departamentoId);
  const filas = [];
  for (const periodo of periodos) {
    const { fechaFin } = rangoPeriodo(periodo);
    for (const [grupo, rows] of agrupar(personas, (row) => grupoDe(row, viewer))) {
      const ids = new Set(rows.map((row) => String(row.entityId)));
      const horas = novedadesAprobadasDe(periodo, 'horas_extra', ids).reduce(
        (sum, row) => sum + (Number(row.cantidad) || 0),
        0
      );
      filas.push(
        fila(periodo, grupo, rows.filter((row) => activoAl(row, fechaFin)).length, { horas })
      );
    }
  }
  return resultado(
    'horas_extra',
    [{ key: 'horas', label: 'Horas extra aprobadas' }],
    filas,
    graficoPorPeriodo(filas, 'horas')
  );
}

function diasVacacionesEnPeriodo(ids, fechaInicio, fechaFin) {
  return listSolicitudes({ estado: 'aprobada' })
    .filter((row) => ids.has(String(row.entityId)))
    .reduce((sum, row) => {
      const desde = row.fechaInicio > fechaInicio ? row.fechaInicio : fechaInicio;
      const hasta = row.fechaFin < fechaFin ? row.fechaFin : fechaFin;
      return desde <= hasta ? sum + contarDiasHabiles(desde, hasta) : sum;
    }, 0);
}

function reporteAusentismo(periodos, viewer, departamentoId) {
  const personas = poblacion(viewer, departamentoId);
  const filas = [];
  for (const periodo of periodos) {
    const { fechaInicio, fechaFin } = rangoPeriodo(periodo);
    const habiles = contarDiasHabiles(fechaInicio, fechaFin);
    for (const [grupo, rows] of agrupar(personas, (row) => grupoDe(row, viewer))) {
      const activos = rows.filter((row) => activoAl(row, fechaFin)).length;
      const ids = new Set(rows.map((row) => String(row.entityId)));
      const sumar = (tipo) =>
        novedadesAprobadasDe(periodo, tipo, ids).reduce(
          (sum, row) => sum + (Number(row.cantidad) || 0),
          0
        );
      const ausencias = sumar('ausencia');
      const indicador =
        activos > 0 && habiles > 0 ? Math.round((ausencias / (habiles * activos)) * 1000) / 10 : 0;
      filas.push(
        fila(periodo, grupo, activos, {
          ausentismo: indicador,
          ausencias,
          licencias: sumar('licencia_medica'),
          vacaciones: diasVacacionesEnPeriodo(ids, fechaInicio, fechaFin)
        })
      );
    }
  }
  return resultado(
    'ausentismo',
    [
      { key: 'ausentismo', label: 'Ausentismo', formato: 'porcentaje' },
      { key: 'ausencias', label: 'Días de ausencia' },
      { key: 'licencias', label: 'Días de licencia médica (no es ausentismo)' },
      { key: 'vacaciones', label: 'Días de vacaciones (no es ausentismo)' }
    ],
    filas,
    graficoPorPeriodo(filas, 'ausentismo'),
    {
      nota: 'Las licencias médicas, las vacaciones y los permisos legales no se cuentan como ausentismo.'
    }
  );
}

function reporteBrecha(periodos, viewer, departamentoId) {
  const periodo = periodos[periodos.length - 1];
  const { fechaFin } = rangoPeriodo(periodo);
  const personas = poblacion(viewer, departamentoId).filter((row) => activoAl(row, fechaFin));
  const filas = [];
  for (const [cargo, rows] of agrupar(personas, (row) => row.cargo || 'Sin cargo')) {
    const conSueldo = rows
      .map((row) => ({
        genero: generoDeTrabajador(row.entityId),
        sueldo: Number(getContratoVigente(row.entityId, fechaFin)?.sueldoBase)
      }))
      .filter((row) => Number.isFinite(row.sueldo) && row.sueldo > 0);
    const mujeres = conSueldo.filter((row) => row.genero === 'Femenino').map((row) => row.sueldo);
    const hombres = conSueldo.filter((row) => row.genero === 'Masculino').map((row) => row.sueldo);
    const otros = conSueldo.length - mujeres.length - hombres.length;
    const oculto = mujeres.length < MIN_PERSONAS || hombres.length < MIN_PERSONAS;
    const medianaF = oculto ? null : mediana(mujeres);
    const medianaM = oculto ? null : mediana(hombres);
    filas.push({
      periodo,
      periodoEtiqueta: etiquetaPeriodo(periodo),
      grupo: cargo,
      oculto,
      mensaje: oculto ? MENSAJE_OCULTO : '',
      medianaFemenino: medianaF,
      medianaMasculino: medianaM,
      brecha: oculto ? null : brechaPorcentual(medianaM, medianaF),
      otros: otros >= MIN_PERSONAS ? otros : null,
      otrosOculto: otros > 0 && otros < MIN_PERSONAS
    });
  }
  registrarAuditoria({
    accion: 'ver_sensible',
    tabla: 'reportes',
    registroId: 'brecha-genero',
    motivo: `Consulta del reporte de brecha salarial de género (${etiquetaPeriodo(periodo)})`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
  return resultado(
    'brecha',
    [
      { key: 'medianaFemenino', label: 'Mediana sueldo base (Femenino)', formato: 'dinero' },
      { key: 'medianaMasculino', label: 'Mediana sueldo base (Masculino)', formato: 'dinero' },
      { key: 'brecha', label: 'Brecha', formato: 'porcentaje' },
      { key: 'otros', label: 'Otras opciones o sin informar (conteo)' }
    ],
    filas,
    filas.filter((row) => !row.oculto).map((row) => ({ etiqueta: row.grupo, valor: row.brecha })),
    {
      nota: `Calculado con las personas activas al cierre de ${etiquetaPeriodo(periodo)}. Se compara Femenino con Masculino; las demás opciones se muestran solo como conteo.`
    }
  );
}

/** Chart data: company totals per period when available, otherwise visible rows. */
function graficoPorPeriodo(filas, key) {
  const visibles = filas.filter((row) => !row.oculto);
  const totales = visibles.filter((row) => row.total);
  if (totales.length > 0) {
    return totales.map((row) => ({ etiqueta: row.periodoEtiqueta, valor: row[key] ?? 0 }));
  }
  const unPeriodo = new Set(visibles.map((row) => row.periodo)).size <= 1;
  return visibles.map((row) => ({
    etiqueta: unPeriodo ? row.grupo : `${row.periodoEtiqueta} · ${row.grupo}`,
    valor: row[key] ?? 0
  }));
}

const GENERADORES = {
  dotacion: reporteDotacion,
  costo: reporteCosto,
  horas_extra: reporteHorasExtra,
  ausentismo: reporteAusentismo,
  brecha: reporteBrecha
};

/** Build one report for the viewer, over the closed periods in the range. */
export function generarReporte(tipo, { viewer, desde, hasta, departamentoId } = {}) {
  if (!REPORTES[tipo]) fail(`Reporte desconocido: ${tipo}.`, 'REPORTE_DESCONOCIDO');
  if (!puedeVerReporte(viewer, tipo)) {
    registrarAuditoria({
      accion: 'acceso_denegado',
      tabla: 'reportes',
      registroId: tipo,
      motivo: `Intento de ver el reporte ${REPORTES[tipo].titulo}`,
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
    fail('No tienes autorización para ver este reporte.');
  }
  const periodos = periodosCerrados({ desde, hasta });
  if (periodos.length === 0) {
    return {
      tipo,
      titulo: REPORTES[tipo].titulo,
      vacio: true,
      mensaje: MENSAJE_SIN_PERIODOS,
      columnas: [],
      filas: [],
      grafico: []
    };
  }
  return GENERADORES[tipo](periodos, viewer, viewer?.role === 'jefatura' ? '' : departamentoId);
}
