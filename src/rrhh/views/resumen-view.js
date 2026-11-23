import { contratosPorVencer, resumenContratoTrabajador } from '../utils/alertas-service.js';
import { TIPO_CONTRATO_LABELS } from '../utils/contratos-service.js';
import { alertasSaldoMaximo, resumenVacacionesTrabajador } from '../utils/vacaciones-service.js';
import { avisosEdadLimite, resumenCargasTrabajador } from '../utils/cargas-service.js';

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
      <section class="panel" id="rrhh-resumen-jefatura">
        <div class="panel-header">
          <h3>Resumen</h3>
          <p class="panel-copy">Tu rol no tiene alertas de contratos. Gestiona las novedades de tu equipo desde Asistencia.</p>
        </div>
      </section>
    `;
  }
  return renderAlerts() + renderBenefitAlerts(role);
}
