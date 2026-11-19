import { listContratos } from '../utils/contratos-service.js';
import { isContratAtencion } from '../utils/contrato-vencimiento.js';

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderResumenView() {
  const contratos = listContratos().filter((c) => c.estado === 'Vigente');
  const atencion = contratos.filter((c) => isContratAtencion(c)).slice(0, 10);
  const rows =
    atencion.length === 0
      ? '<li class="rrhh-alerta-item rrhh-alerta-vacio">Sin contratos por vencer en los próximos 30 días.</li>'
      : atencion
          .map(
            (c) =>
              `<li class="rrhh-alerta-item"><strong>${esc(c.trabajadorNombre || 'Trabajador')}</strong> — vence ${esc(c.fechaTermino || '')}</li>`
          )
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
