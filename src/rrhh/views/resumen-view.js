import { contratosPorVencer, resumenContratoTrabajador } from '../utils/alertas-service.js';
import { TIPO_CONTRATO_LABELS } from '../utils/contratos-service.js';

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

function renderWorkerSummary(viewer) {
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
  return renderAlerts();
}
