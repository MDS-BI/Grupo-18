/** Pre-confirmation payroll calculation summary. */

import { el, formatMoney } from './dom.js';

/**
 * Render the calculation summary.
 *
 * @param {HTMLElement} container
 * @param {object} options
 * @param {Document} options.doc
 * @param {object} options.resumen  Result from `calcularPeriodo`.
 * @param {object} options.periodo
 */
export function renderCalculoResumen(container, { doc, resumen = {}, periodo } = {}) {
  container.textContent = '';
  const wrapper = el(doc, 'section', 'panel rrhh-calculo-resumen');
  wrapper.id = 'calculo-resumen';
  wrapper.setAttribute('aria-labelledby', 'calculo-resumen-title');

  const header = el(doc, 'div', 'panel-header');
  const title = el(doc, 'h4', null, 'Resumen del cálculo');
  title.id = 'calculo-resumen-title';
  header.appendChild(title);
  if (periodo) {
    header.appendChild(el(doc, 'p', 'panel-copy', `Período ${periodo.etiqueta || periodo.id || periodo}`));
  }
  wrapper.appendChild(header);

  const grid = el(doc, 'div', 'stats-grid');
  grid.setAttribute('aria-label', 'Totales del cálculo de planilla');
  const cards = [
    ['trabajadores', 'Trabajadores calculados', resumen.trabajadoresCalculados ?? 0],
    ['excluidos', 'Trabajadores excluidos', resumen.trabajadoresExcluidos ?? 0],
    ['aprobadas', 'Novedades aprobadas', resumen.novedadesAprobadas ?? 0],
    ['pendientes', 'Novedades pendientes', resumen.novedadesPendientes ?? 0],
    ['rechazadas', 'Novedades rechazadas', resumen.novedadesRechazadas ?? 0],
    ['haberes', 'Total haberes', formatMoney(resumen.totalHaberes ?? 0)],
    ['liquido', 'Total líquido', formatMoney(resumen.totalLiquido ?? 0)],
    ['costo', 'Costo empleador', formatMoney(resumen.totalCosto ?? resumen.costoEmpleador ?? 0)]
  ];
  for (const [key, label, value] of cards) {
    const card = el(doc, 'article', 'stat-card');
    card.dataset.resumen = key;
    card.appendChild(el(doc, 'span', 'stat-label', label));
    card.appendChild(el(doc, 'strong', 'stat-value', String(value)));
    grid.appendChild(card);
  }
  wrapper.appendChild(grid);

  if (Array.isArray(resumen.advertencias) && resumen.advertencias.length > 0) {
    const warnings = el(doc, 'div', 'rrhh-warnings');
    warnings.id = 'calculo-advertencias';
    warnings.setAttribute('role', 'alert');
    warnings.appendChild(el(doc, 'h5', null, 'Advertencias'));
    const list = el(doc, 'ul');
    for (const warning of resumen.advertencias) list.appendChild(el(doc, 'li', null, warning));
    warnings.appendChild(list);
    wrapper.appendChild(warnings);
  }

  if (Array.isArray(resumen.trabajadoresExcluidos) && resumen.trabajadoresExcluidos.length > 0) {
    const excluded = el(doc, 'div', 'rrhh-warnings');
    excluded.id = 'calculo-excluidos';
    excluded.appendChild(el(doc, 'h5', null, 'Trabajadores excluidos'));
    const list = el(doc, 'ul');
    for (const row of resumen.trabajadoresExcluidos) {
      list.appendChild(el(doc, 'li', null, `${row.nombre || row.entityId}: ${row.motivo}`));
    }
    excluded.appendChild(list);
    wrapper.appendChild(excluded);
  }

  container.appendChild(wrapper);
  return wrapper;
}
