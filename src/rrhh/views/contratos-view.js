/** Contracts view: validity history, salary changes and expiry status. */

import {
  TIPO_CONTRATO_LABELS,
  listContratos,
  puedeGestionarContratos,
  puedeVerContratos,
  terminarContrato
} from '../utils/contratos-service.js';
import { listTrabajadores } from '../utils/trabajadores-service.js';
import { renderContratoForm } from '../components/contrato-form.js';
import { badge, button, el, formatMoney, input, select } from '../components/dom.js';

function accessDenied(documentRef, root) {
  const denied = el(documentRef, 'div', 'rrhh-access-denied panel');
  denied.setAttribute('role', 'alert');
  denied.appendChild(el(documentRef, 'h3', null, 'Acceso denegado'));
  denied.appendChild(
    el(documentRef, 'p', null, 'Tu rol no tiene permiso para consultar contratos.')
  );
  root.appendChild(denied);
  return { refresh() {}, dispose() {} };
}

function estadoTone(estado) {
  return estado === 'vigente' ? 'ok' : 'neutral';
}

export function renderContratosView(root, { doc, viewer } = {}) {
  const documentRef = doc || root.ownerDocument;

  if (!puedeVerContratos(viewer)) {
    return accessDenied(documentRef, root);
  }

  const canManage = puedeGestionarContratos(viewer);
  const trabajadores = listTrabajadores({ incluirBaja: true });

  const container = el(documentRef, 'section', 'rrhh-section rrhh-contratos-view');
  container.id = 'rrhh-contratos-view';
  container.setAttribute('aria-labelledby', 'rrhh-contratos-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Contratos');
  title.id = 'rrhh-contratos-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Cada contrato tiene vigencia propia. Los cambios de sueldo cierran el contrato anterior y dejan historial completo.'
    )
  );
  container.appendChild(header);

  const layout = el(documentRef, 'div', 'rrhh-split');
  const formPanel = el(documentRef, 'div', 'rrhh-split-aside');
  const listPanel = el(documentRef, 'div', 'panel rrhh-list-panel');

  const form = canManage
    ? renderContratoForm(formPanel, {
        doc: documentRef,
        viewer,
        trabajadores,
        onSaved: () => refresh()
      })
    : null;

  if (!canManage) {
    formPanel.appendChild(
      el(
        documentRef,
        'div',
        'panel rrhh-readonly',
        'Tu rol puede consultar contratos, pero no crear ni modificarlos.'
      )
    );
  }

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const filterLabel = el(documentRef, 'label', null, 'Trabajador');
  filterLabel.setAttribute('for', 'contratos-filtro-trabajador');
  toolbar.appendChild(filterLabel);
  const filterSelect = select(documentRef, {
    id: 'contratos-filtro-trabajador',
    options: [
      { value: '', label: 'Todos' },
      ...trabajadores.map((row) => ({ value: row.entityId, label: row.name }))
    ]
  });
  toolbar.appendChild(filterSelect);

  const includeLabel = el(documentRef, 'label', 'rrhh-checkbox');
  const includeTerminated = input(documentRef, {
    id: 'contratos-incluir-terminados',
    type: 'checkbox'
  });
  includeTerminated.checked = true;
  includeLabel.appendChild(includeTerminated);
  includeLabel.appendChild(documentRef.createTextNode(' Incluir terminados'));
  toolbar.appendChild(includeLabel);
  listPanel.appendChild(toolbar);

  const table = el(documentRef, 'table', 'rrhh-table');
  const thead = el(documentRef, 'thead');
  const headRow = el(documentRef, 'tr');
  for (const label of [
    'Trabajador',
    'Tipo',
    'Sueldo base',
    'Jornada',
    'Inicio',
    'Término',
    'Estado',
    ''
  ]) {
    headRow.appendChild(el(documentRef, 'th', null, label));
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = el(documentRef, 'tbody');
  table.appendChild(tbody);
  listPanel.appendChild(table);

  const empty = el(documentRef, 'p', 'rrhh-empty', 'No hay contratos para el filtro seleccionado.');
  empty.hidden = true;
  listPanel.appendChild(empty);

  layout.appendChild(formPanel);
  layout.appendChild(listPanel);
  container.appendChild(layout);
  root.appendChild(container);

  const workerName = (entityId) =>
    trabajadores.find((row) => row.entityId === entityId)?.name || entityId;

  function refresh() {
    const rows = listContratos({
      entityId: filterSelect.value || undefined,
      incluirTerminados: includeTerminated.checked
    });
    tbody.textContent = '';
    for (const row of rows) {
      const tr = el(documentRef, 'tr');
      tr.dataset.contratoId = row.id;
      tr.appendChild(el(documentRef, 'td', null, workerName(row.entityId)));
      tr.appendChild(
        el(documentRef, 'td', null, TIPO_CONTRATO_LABELS[row.tipoContrato] || row.tipoContrato)
      );
      tr.appendChild(el(documentRef, 'td', null, formatMoney(row.sueldoBase)));
      tr.appendChild(el(documentRef, 'td', null, `${row.jornadaHorasSemanales} h`));
      tr.appendChild(el(documentRef, 'td', null, row.fechaInicio));
      tr.appendChild(el(documentRef, 'td', null, row.fechaTermino || '—'));
      const stateCell = el(documentRef, 'td');
      stateCell.appendChild(badge(documentRef, row.estado, estadoTone(row.estado)));
      tr.appendChild(stateCell);

      const actions = el(documentRef, 'td', 'rrhh-row-actions');
      if (canManage) {
        actions.appendChild(
          button(documentRef, {
            label: 'Editar',
            className: 'button button-secondary button-small',
            onClick: () => form?.edit(row)
          })
        );
        if (row.estado !== 'terminado') {
          actions.appendChild(
            button(documentRef, {
              label: 'Cambio sueldo',
              className: 'button button-ghost button-small',
              onClick: () => form?.prepareCambio(row)
            })
          );
          actions.appendChild(
            button(documentRef, {
              label: 'Terminar',
              className: 'button button-ghost button-small',
              onClick: () => {
                terminarContrato(row.id, new Date().toISOString().slice(0, 10), viewer);
                refresh();
              }
            })
          );
        }
      }
      tr.appendChild(actions);
      tbody.appendChild(tr);
    }
    empty.hidden = rows.length > 0;
  }

  filterSelect.addEventListener('change', refresh);
  includeTerminated.addEventListener('change', refresh);
  refresh();

  return {
    refresh,
    dispose() {
      container.remove();
    }
  };
}
