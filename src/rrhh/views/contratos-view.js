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
import { createFormPanel } from '../components/form-panel.js';
import { createPagination } from '../components/pagination.js';
import { clearFieldErrors, setFieldErrors } from '../components/feedback.js';
import {
  badge,
  button,
  el,
  feedback,
  formatMoney,
  hideFeedback,
  input,
  select,
  showFeedback
} from '../components/dom.js';

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
  const isPrivilegedViewer = viewer?.role === 'jefatura' || viewer?.role === 'trabajador';
  const hideSueldoBase = isPrivilegedViewer;

  let allowedEntityIds = null;
  if (viewer?.role === 'trabajador') {
    allowedEntityIds = new Set([viewer?.trabajadorId].filter(Boolean));
  } else if (viewer?.role === 'jefatura') {
    const equipo = Array.isArray(viewer?.equipo) ? viewer.equipo : [];
    allowedEntityIds = new Set(equipo.filter(Boolean));
  }

  const container = el(documentRef, 'section', 'rrhh-section rrhh-contratos-view');
  container.id = 'rrhh-contratos-view';
  container.setAttribute('aria-labelledby', 'rrhh-contratos-title');

  const drawer = createFormPanel(documentRef, {
    id: 'contratos-form-drawer',
    title: 'Registrar contrato'
  });
  container.appendChild(drawer.element);

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Contratos');
  title.id = 'rrhh-contratos-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      hideSueldoBase
        ? 'Como Jefatura/Trabajador solo ves contratos de tu ámbito. No tienes acceso a sueldos base.'
        : 'Cada contrato tiene vigencia propia. Los cambios de sueldo cierran el contrato anterior y dejan historial completo.'
    )
  );
  if (canManage) {
    header.appendChild(
      button(documentRef, {
        id: 'contratos-registrar',
        label: 'Registrar contrato',
        className: 'button button-primary rrhh-primary-action',
        onClick: () => {
          form?.reset();
          drawer.setTitle('Registrar contrato');
          drawer.open();
        }
      })
    );
  }
  container.appendChild(header);

  const layout = el(documentRef, 'div', 'rrhh-list-layout');
  const formPanel = el(documentRef, 'div', 'rrhh-drawer-form');
  const listPanel = el(documentRef, 'div', 'panel rrhh-list-panel');

  const form = canManage
    ? renderContratoForm(formPanel, {
        doc: documentRef,
        viewer,
        trabajadores,
        onSaved: () => {
          drawer.markSaved();
          refresh();
        }
      })
    : null;
  if (canManage) drawer.content.appendChild(formPanel);

  if (!canManage) {
    formPanel.appendChild(
      el(
        documentRef,
        'p',
        'panel-copy',
        'Como Jefatura solo ves las novedades de tu equipo. No tienes acceso a liquidaciones ni sueldos base.'
      )
    );
  }

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const filterLabel = el(documentRef, 'label', null, 'Trabajador');
  filterLabel.setAttribute('for', 'contratos-filtro-trabajador');
  toolbar.appendChild(filterLabel);
  const filterOptions = [{ value: '', label: 'Todos' }];
  if (allowedEntityIds) {
    for (const row of trabajadores) {
      if (allowedEntityIds.has(row.entityId)) {
        filterOptions.push({ value: row.entityId, label: row.name });
      }
    }
  } else {
    for (const row of trabajadores) {
      filterOptions.push({ value: row.entityId, label: row.name });
    }
  }
  const filterSelect = select(documentRef, {
    id: 'contratos-filtro-trabajador',
    options: filterOptions
  });
  if (allowedEntityIds && allowedEntityIds.size === 1) {
    filterSelect.value = [...allowedEntityIds][0];
    filterSelect.disabled = true;
  }
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

  const messages = feedback(documentRef, 'contratos-feedback');
  container.appendChild(messages);

  const table = el(documentRef, 'table', 'rrhh-table');
  const thead = el(documentRef, 'thead');
  const headRow = el(documentRef, 'tr');
  const headers = [
    'Trabajador',
    'Tipo',
    ...(hideSueldoBase ? [] : ['Sueldo base']),
    'Jornada',
    'Inicio',
    'Término',
    'Estado',
    ''
  ];
  for (const label of headers) {
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

  const paginationHost = el(documentRef, 'div', 'rrhh-pagination-host');
  listPanel.appendChild(paginationHost);
  const pagination = createPagination(documentRef, {
    id: 'contratos-pagination',
    onChange: refresh
  });
  pagination.element.hidden = true;
  paginationHost.appendChild(pagination.element);

  layout.appendChild(listPanel);
  container.appendChild(layout);
  root.appendChild(container);

  const workerName = (entityId) =>
    trabajadores.find((row) => row.entityId === entityId)?.name || entityId;

  function terminarContratoSeleccionado(contratoId, fieldId, fecha) {
    clearFieldErrors(listPanel);
    hideFeedback(messages);
    try {
      terminarContrato(contratoId, fecha, viewer);
      showFeedback(messages, 'Contrato terminado.', 'ok');
      refresh();
    } catch (error) {
      setFieldErrors(listPanel, error.errors, [
        {
          key: 'fechaTermino',
          id: fieldId,
          match: [/fecha de t[ée]rmino/i, /anterior a la fecha de inicio/i]
        }
      ]);
      showFeedback(messages, (error.errors || [error.message]).join(' '), 'error');
    }
  }

  function refresh() {
    const rowsAll = listContratos({
      entityId: filterSelect.value || undefined,
      incluirTerminados: includeTerminated.checked
    });
    const rows = allowedEntityIds
      ? rowsAll.filter((row) => allowedEntityIds.has(row.entityId))
      : rowsAll;
    tbody.textContent = '';
    pagination.render(rows.length);
    pagination.element.hidden = rows.length === 0;
    for (const row of pagination.slice(rows)) {
      const tr = el(documentRef, 'tr');
      tr.dataset.contratoId = row.id;
      tr.appendChild(el(documentRef, 'td', null, workerName(row.entityId)));
      tr.appendChild(
        el(documentRef, 'td', null, TIPO_CONTRATO_LABELS[row.tipoContrato] || row.tipoContrato)
      );
      if (!hideSueldoBase) {
        tr.appendChild(el(documentRef, 'td', null, formatMoney(row.sueldoBase)));
      }
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
            onClick: () => {
              form?.edit(row);
              drawer.setTitle(`Editar contrato de ${workerName(row.entityId)}`);
              drawer.open();
            }
          })
        );
        if (row.estado !== 'terminado') {
          actions.appendChild(
            button(documentRef, {
              label: 'Cambio sueldo',
              className: 'button button-ghost button-small',
              onClick: () => {
                form?.prepareCambio(row);
                drawer.setTitle(`Cambio de sueldo · ${workerName(row.entityId)}`);
                drawer.open();
              }
            })
          );
          const terminoInput = input(documentRef, {
            id: `contrato-terminar-fecha-${row.id}`,
            type: 'date',
            value: new Date().toISOString().slice(0, 10)
          });
          terminoInput.setAttribute(
            'aria-label',
            `Fecha de término del contrato de ${workerName(row.entityId)}`
          );
          actions.appendChild(terminoInput);
          actions.appendChild(
            button(documentRef, {
              label: 'Terminar',
              className: 'button button-ghost button-small',
              onClick: () =>
                terminarContratoSeleccionado(row.id, terminoInput.id, terminoInput.value)
            })
          );
        }
      }
      tr.appendChild(actions);
      tbody.appendChild(tr);
    }
    empty.hidden = rows.length > 0;
  }

  filterSelect.addEventListener('change', () => {
    pagination.reset();
    refresh();
  });
  includeTerminated.addEventListener('change', () => {
    pagination.reset();
    refresh();
  });
  refresh();

  return {
    refresh,
    dispose() {
      drawer.dispose();
      container.remove();
    }
  };
}
