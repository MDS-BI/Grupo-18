/** Period list with lifecycle actions. Closed periods are strictly read-only. */

import { ESTADO_PERIODO_LABELS } from '../utils/periodos.js';
import { badge, button, el, statusTone } from './dom.js';

/**
 * Render the period list.
 *
 * @param {HTMLElement} container
 * @param {object} options
 * @param {Document} options.doc
 * @param {Array} options.periodos
 * @param {object} options.viewer
 * @param {boolean} options.canManage
 * @param {Function} options.onAction  Called with (periodoId, accion).
 */
export function renderPeriodoList(
  container,
  { doc, periodos = [], canManage = false, onAction = () => {} } = {}
) {
  container.textContent = '';
  if (periodos.length === 0) {
    const empty = el(doc, 'div', 'empty-state', 'Todavía no hay períodos registrados.');
    empty.id = 'periodos-empty';
    container.appendChild(empty);
    return;
  }

  const table = el(doc, 'div', 'rrhh-table');
  table.id = 'periodos-list';
  table.setAttribute('role', 'table');
  table.setAttribute('aria-label', 'Períodos de remuneración');

  const header = el(doc, 'div', 'rrhh-table-row rrhh-table-head');
  header.setAttribute('role', 'row');
  for (const label of ['Período', 'Estado', 'Cierre', 'Acciones']) {
    const cell = el(doc, 'span', null, label);
    cell.setAttribute('role', 'columnheader');
    header.appendChild(cell);
  }
  table.appendChild(header);

  for (const periodo of periodos) {
    const row = el(doc, 'div', 'rrhh-table-row');
    row.setAttribute('role', 'row');
    row.dataset.periodoId = periodo.id;

    const name = el(doc, 'span', 'rrhh-table-cell');
    name.setAttribute('role', 'cell');
    name.appendChild(el(doc, 'strong', null, periodo.etiqueta || periodo.id));
    name.appendChild(el(doc, 'span', 'panel-copy', periodo.id));
    row.appendChild(name);

    const state = el(doc, 'span', 'rrhh-table-cell');
    state.setAttribute('role', 'cell');
    state.appendChild(
      badge(doc, ESTADO_PERIODO_LABELS[periodo.estado] || periodo.estado || 'Abierto', statusTone(periodo.estado))
    );
    row.appendChild(state);

    const closure = el(doc, 'span', 'rrhh-table-cell panel-copy');
    closure.setAttribute('role', 'cell');
    closure.textContent = periodo.fechaCierre
      ? `${periodo.cerradoPor || 'Jefatura'} — ${String(periodo.fechaCierre).slice(0, 10)}`
      : '—';
    row.appendChild(closure);

    const actions = el(doc, 'span', 'rrhh-table-cell rrhh-row-actions');
    actions.setAttribute('role', 'cell');
    const cerrado = periodo.estado === 'cerrado';
    if (canManage) {
      if (cerrado) {
        actions.appendChild(
          button(doc, {
            label: 'Reabrir',
            className: 'button button-secondary button-small',
            ariaLabel: `Reabrir el período ${periodo.etiqueta || periodo.id}`,
            disabled: true
          })
        );
      } else {
        actions.appendChild(
          button(doc, {
            label: 'Cerrar período',
            className: 'button button-danger button-small',
            ariaLabel: `Cerrar el período ${periodo.etiqueta || periodo.id}`,
            onClick: () => onAction(periodo.id, 'cerrar')
          })
        );
      }
    } else {
      actions.appendChild(el(doc, 'span', 'panel-copy', cerrado ? 'Solo lectura' : 'Sin permiso de cierre'));
    }
    row.appendChild(actions);
    table.appendChild(row);
  }

  container.appendChild(table);
}
