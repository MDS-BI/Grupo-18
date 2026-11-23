import { contratosPorVencer, resumenContratoTrabajador } from '../utils/alertas-service.js';
import { TIPO_CONTRATO_LABELS } from '../utils/contratos-service.js';
import { alertasSaldoMaximo, resumenVacacionesTrabajador } from '../utils/vacaciones-service.js';
import { avisosEdadLimite, resumenCargasTrabajador } from '../utils/cargas-service.js';
import { SALDO_MAXIMO } from '../utils/vacaciones-service.js';
import { metricasEquipo, metricasGenerales } from '../utils/resumen-metricas.js';
import {
  barrasHorizontales,
  columnas,
  formatoNumero,
  kpiTile,
  medidor
} from '../components/graficos-resumen.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function etiquetaEstado(estado) {
  const normalizado = String(estado || '')
    .trim()
    .toLowerCase();
  if (!normalizado) return '—';
  return normalizado.charAt(0).toUpperCase() + normalizado.slice(1);
}

function renderWorkerContract(viewer) {
  const resumen = resumenContratoTrabajador(viewer?.trabajadorId);
  if (!resumen) {
    return `
      <section class="panel rrhh-worker-summary" id="rrhh-resumen-trabajador">
        <div class="rrhh-worker-summary__header">
          <div>
            <p class="eyebrow">Mi contrato</p>
            <h3 class="rrhh-worker-summary__title">Resumen</h3>
            <p class="panel-copy">No tienes un contrato registrado.</p>
          </div>
        </div>
      </section>
    `;
  }
  const tipo = TIPO_CONTRATO_LABELS[resumen.tipo] || resumen.tipo || '—';
  const vencimiento =
    resumen.diasRestantes === null
      ? 'Sin fecha de término'
      : resumen.vencido
        ? `Vencido hace ${Math.abs(resumen.diasRestantes)} día(s)`
        : `${resumen.diasRestantes} día(s) restantes`;
  const estado = resumen.estado || '';
  return `
    <section class="panel rrhh-worker-summary" id="rrhh-resumen-trabajador">
      <div class="rrhh-worker-summary__header">
        <div>
          <p class="eyebrow">Mi contrato</p>
          <h3 class="rrhh-worker-summary__title">Resumen de mi contrato</h3>
          <p class="panel-copy">Datos de tu propio contrato. No se muestra el sueldo base.</p>
        </div>
        <span class="rrhh-worker-state" data-estado="${esc(estado)}">${esc(etiquetaEstado(estado))}</span>
      </div>
      <table class="rrhh-table rrhh-resumen-table">
        <tbody>
          <tr><th scope="row">Tipo de contrato</th><td>${esc(tipo)}</td></tr>
          <tr><th scope="row">Fecha de inicio</th><td>${esc(resumen.fechaInicio || '—')}</td></tr>
          <tr><th scope="row">Fecha de término</th><td>${esc(resumen.fechaTermino || '—')}</td></tr>
          <tr><th scope="row">Estado</th><td>${esc(etiquetaEstado(estado))}</td></tr>
          <tr>
            <th scope="row">Vencimiento</th>
            <td${resumen.vencido ? ' class="rrhh-vencido"' : ''}>${esc(vencimiento)}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `;
}

function dias(value) {
  return Number(value || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

function renderWorkerBenefits(viewer) {
  const entityId = viewer?.trabajadorId;
  if (!entityId) return '';
  const vacaciones = resumenVacacionesTrabajador(entityId);
  const cargas = resumenCargasTrabajador(entityId);
  if (!vacaciones) return '';
  const proxima = vacaciones.proxima
    ? `${esc(vacaciones.proxima.fechaInicio)} a ${esc(vacaciones.proxima.fechaFin)} (${esc(vacaciones.proxima.estado)})`
    : 'Sin solicitudes próximas';
  return `
    <section class="panel" id="rrhh-resumen-beneficios">
      <div class="panel-header">
        <h3>Mis vacaciones y cargas</h3>
        <p class="panel-copy">Detalle en las pestañas Vacaciones y Cargas familiares.</p>
      </div>
      ${medidor({
        id: 'rrhh-medidor-vacaciones',
        titulo: 'Saldo de vacaciones',
        valor: vacaciones.saldo.disponible,
        maximo: SALDO_MAXIMO,
        formato: 'dias',
        nota: 'El saldo no puede superar 30 días hábiles acumulados.'
      })}
      <table class="rrhh-table rrhh-resumen-table">
        <tbody>
          <tr><th scope="row">Saldo de vacaciones</th><td>${esc(dias(vacaciones.saldo.disponible))} día(s) hábil(es)</td></tr>
          <tr><th scope="row">Próximas vacaciones</th><td>${proxima}</td></tr>
          <tr><th scope="row">Cargas familiares vigentes</th><td>${esc(cargas.vigentes)}</td></tr>
        </tbody>
      </table>
    </section>
  `;
}

function renderWorkerSummary(viewer) {
  return renderWorkerContract(viewer) + renderWorkerBenefits(viewer);
}

function renderBenefitAlerts(role) {
  const vacaciones = role === 'administrador' || role === 'analista' ? alertasSaldoMaximo() : [];
  const cargas = role === 'administrador' || role === 'analista' ? avisosEdadLimite() : [];
  const vacRows =
    vacaciones.length === 0
      ? '<li class="rrhh-alerta-item rrhh-alerta-vacio">Ningún trabajador tiene el feriado acumulado al máximo.</li>'
      : vacaciones
          .map(
            (row) =>
              `<li class="rrhh-alerta-item"><strong>${esc(row.trabajador)}</strong> — feriado acumulado al máximo (${esc(dias(row.disponible))} días)</li>`
          )
          .join('');
  const cargaRows =
    cargas.length === 0
      ? '<li class="rrhh-alerta-item rrhh-alerta-vacio">Sin cargas por cumplir la edad límite en los próximos 30 días.</li>'
      : cargas
          .map(
            (row) =>
              `<li class="rrhh-alerta-item"><strong>${esc(row.trabajador)}</strong> — ${esc(row.carga)} deja de ser carga el ${esc(row.fechaFinVigencia)}</li>`
          )
          .join('');
  return `
    <section class="panel" id="rrhh-resumen-vacaciones">
      <div class="panel-header">
        <h3>Vacaciones</h3>
        <p class="panel-copy">Trabajadores con el saldo de vacaciones en el máximo legal de 30 días.</p>
      </div>
      <ul class="rrhh-alertas-list" role="list">${vacRows}</ul>
    </section>
    <section class="panel" id="rrhh-resumen-cargas">
      <div class="panel-header">
        <h3>Cargas familiares</h3>
        <p class="panel-copy">Cargas que dejan de estar vigentes por edad en los próximos 30 días.</p>
      </div>
      <ul class="rrhh-alertas-list" role="list">${cargaRows}</ul>
    </section>
  `;
}

function variacionTexto(kpis) {
  if (kpis.variacionCosto === null || !kpis.periodoAnterior) {
    return 'Sin período anterior para comparar';
  }
  const signo = kpis.variacionCosto > 0 ? '▲' : kpis.variacionCosto < 0 ? '▼' : '■';
  return `${signo} ${Math.abs(kpis.variacionCosto).toLocaleString('es-CL')} % vs. ${kpis.periodoAnterior.etiqueta}`;
}

/** KPI row and charts for administrators and payroll analysts. */
function renderDashboardGeneral() {
  const { kpis, series } = metricasGenerales();
  const tiles = [
    kpiTile({
      id: 'kpi-trabajadores',
      etiqueta: 'Trabajadores activos',
      valor: formatoNumero(kpis.trabajadoresActivos),
      detalle: `${kpis.desvinculados} desvinculado(s)`
    }),
    kpiTile({
      id: 'kpi-costo',
      etiqueta: kpis.costoUltimoPeriodo
        ? `Costo empleador · ${kpis.costoUltimoPeriodo.etiqueta}`
        : 'Costo empleador',
      valor: kpis.costoUltimoPeriodo ? formatoNumero(kpis.costoUltimoPeriodo.valor, 'dinero') : '—',
      detalle: kpis.costoUltimoPeriodo ? variacionTexto(kpis) : 'Aún no hay planillas calculadas'
    }),
    kpiTile({
      id: 'kpi-contratos',
      etiqueta: 'Contratos por vencer (30 días)',
      valor: formatoNumero(kpis.contratosPorVencer),
      detalle: `${kpis.contratosVencidos} vencido(s) sin terminar`,
      tono: kpis.contratosPorVencer + kpis.contratosVencidos > 0 ? 'atencion' : ''
    }),
    kpiTile({
      id: 'kpi-novedades',
      etiqueta: 'Novedades pendientes',
      valor: formatoNumero(kpis.novedadesPendientes),
      detalle: 'Bloquean el cálculo de su período',
      tono: kpis.novedadesPendientes > 0 ? 'atencion' : ''
    }),
    kpiTile({
      id: 'kpi-vacaciones',
      etiqueta: 'Vacaciones por aprobar',
      valor: formatoNumero(kpis.vacacionesPendientes),
      detalle: 'Solicitudes en estado Pendiente'
    })
  ].join('');
  return `
    <section class="rrhh-dashboard" id="rrhh-resumen-dashboard" aria-labelledby="rrhh-dashboard-titulo">
      <h3 id="rrhh-dashboard-titulo">Indicadores</h3>
      <div class="rrhh-kpi-row">${tiles}</div>
      <div class="rrhh-chart-grid">
        ${columnas({
          id: 'grafico-costo-periodo',
          titulo: 'Costo empleador por período',
          descripcion: 'Suma del costo empleador de las liquidaciones no anuladas.',
          datos: series.costoPorPeriodo,
          formato: 'dinero',
          vacioMensaje: 'Aún no hay planillas calculadas.'
        })}
        ${barrasHorizontales({
          id: 'grafico-dotacion',
          titulo: 'Trabajadores activos por departamento',
          datos: series.dotacionPorDepartamento,
          encabezado: 'Departamento',
          vacioMensaje: 'No hay trabajadores activos.'
        })}
        ${barrasHorizontales({
          id: 'grafico-novedades',
          titulo: 'Novedades registradas por tipo',
          descripcion: 'Cantidad de registros vigentes (sin rechazadas ni anuladas).',
          datos: series.novedadesPorTipo,
          encabezado: 'Tipo de novedad',
          vacioMensaje: 'No hay novedades registradas.'
        })}
      </div>
    </section>
  `;
}

/** KPI row and chart for a jefatura: only its team, no money. */
function renderDashboardEquipo(viewer) {
  const { kpis, series } = metricasEquipo(viewer);
  return `
    <section class="rrhh-dashboard" id="rrhh-resumen-dashboard" aria-labelledby="rrhh-dashboard-titulo">
      <h3 id="rrhh-dashboard-titulo">Mi equipo</h3>
      <div class="rrhh-kpi-row">
        ${kpiTile({ id: 'kpi-equipo', etiqueta: 'Integrantes activos', valor: formatoNumero(kpis.miembrosActivos) })}
        ${kpiTile({
          id: 'kpi-novedades',
          etiqueta: 'Novedades por resolver',
          valor: formatoNumero(kpis.novedadesPendientes),
          tono: kpis.novedadesPendientes > 0 ? 'atencion' : ''
        })}
        ${kpiTile({
          id: 'kpi-vacaciones',
          etiqueta: 'Vacaciones por aprobar',
          valor: formatoNumero(kpis.vacacionesPendientes),
          tono: kpis.vacacionesPendientes > 0 ? 'atencion' : ''
        })}
      </div>
      <div class="rrhh-chart-grid">
        ${barrasHorizontales({
          id: 'grafico-novedades',
          titulo: 'Novedades de mi equipo por tipo',
          datos: series.novedadesPorTipo,
          encabezado: 'Tipo de novedad',
          vacioMensaje: 'Tu equipo no tiene novedades registradas.'
        })}
      </div>
    </section>
  `;
}

function renderAlerts() {
  const atencion = contratosPorVencer({ dias: 30 }).slice(0, 10);
  const rows =
    atencion.length === 0
      ? '<li class="rrhh-alerta-item rrhh-alerta-vacio">Sin contratos por vencer en los próximos 30 días.</li>'
      : atencion
          .map((alerta) => {
            const detalle = alerta.vencido ? 'vencido' : `${alerta.diasRestantes} días`;
            return `<li class="rrhh-alerta-item"><strong>${esc(alerta.trabajador)}</strong> — vence ${esc(alerta.fechaTermino)} (${detalle})</li>`;
          })
          .join('');
  return `
    <section class="panel">
      <div class="panel-header">
        <h3>Resumen</h3>
        <p class="panel-copy">Alertas de contratos por vencer (30 días o menos).</p>
      </div>
      <ul class="rrhh-alertas-list" role="list">${rows}</ul>
    </section>
  `;
}

export function renderResumenView({ viewer } = {}) {
  const role = viewer?.role || '';
  if (role === 'trabajador') return renderWorkerSummary(viewer);
  if (role === 'jefatura') {
    return `
      ${renderDashboardEquipo(viewer)}
      <section class="panel" id="rrhh-resumen-jefatura">
        <div class="panel-header">
          <h3>Resumen</h3>
          <p class="panel-copy">Tu rol no tiene alertas de contratos. Gestiona las novedades de tu equipo desde Asistencia.</p>
        </div>
      </section>
    `;
  }
  return renderDashboardGeneral() + renderAlerts() + renderBenefitAlerts(role);
}
