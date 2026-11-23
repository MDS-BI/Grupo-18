/** Workers view: register, search and edit worker files. */

import {
  desactivarTrabajador,
  listTrabajadores,
  puedeGestionarTrabajadores,
  puedeVerTrabajadores
} from '../utils/trabajadores-service.js';
import { listCatalogos } from '../utils/catalogos-service.js';
import { renderTrabajadorForm } from '../components/trabajador-form.js';
import { clearFieldErrors, setFieldErrors } from '../components/feedback.js';
import { createFormPanel } from '../components/form-panel.js';
import { createPagination } from '../components/pagination.js';
import { puedeVerVacaciones, resumenVacacionesTrabajador } from '../utils/vacaciones-service.js';
import { puedeVerCargas, resumenCargasTrabajador } from '../utils/cargas-service.js';
import {
  badge,
  button,
  el,
  feedback,
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
    el(documentRef, 'p', null, 'Tu rol no tiene permiso para consultar las fichas de trabajadores.')
  );
  root.appendChild(denied);
  return { refresh() {}, dispose() {} };
}

function statusTone(estado) {
  return estado === 'Activo' ? 'ok' : 'neutral';
}

export function renderTrabajadoresView(root, { doc, viewer, onRoleRequired, onNavigate } = {}) {
  const documentRef = doc || root.ownerDocument;

  if (!puedeVerTrabajadores(viewer)) {
    return accessDenied(documentRef, root);
  }

  const canManage = puedeGestionarTrabajadores(viewer);

  const container = el(documentRef, 'section', 'rrhh-section rrhh-trabajadores-view');
  container.id = 'rrhh-trabajadores-view';
  container.setAttribute('aria-labelledby', 'rrhh-trabajadores-title');

  const drawer = createFormPanel(documentRef, {
    id: 'trabajadores-form-drawer',
    title: 'Registrar trabajador'
  });
  container.appendChild(drawer.element);

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Trabajadores');
  title.id = 'rrhh-trabajadores-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Ficha única por trabajador: identidad, RUT validado, cargo, departamento y centro de costo.'
    )
  );
  if (canManage) {
    header.appendChild(
      button(documentRef, {
        id: 'trabajadores-registrar',
        label: 'Registrar trabajador',
        className: 'button button-primary rrhh-primary-action',
        onClick: () => {
          form?.reset();
          drawer.setTitle('Registrar trabajador');
          drawer.open();
        }
      })
    );
  }
  container.appendChild(header);

  const layout = el(documentRef, 'div', 'rrhh-list-layout');

  const formPanel = el(documentRef, 'div', 'rrhh-drawer-form');

  const listPanel = el(documentRef, 'div', 'panel rrhh-list-panel');
  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');

  const criterioLabel = el(documentRef, 'label', null, 'Buscar por:');
  criterioLabel.setAttribute('for', 'trabajadores-criterio');
  toolbar.appendChild(criterioLabel);
  const criterioSelect = select(documentRef, {
    id: 'trabajadores-criterio',
    options: [
      { value: 'nombre', label: 'Nombre' },
      { value: 'rut', label: 'RUT' },
      { value: 'codigo', label: 'Código' },
      { value: 'cargo', label: 'Cargo' }
    ],
    value: 'nombre'
  });
  toolbar.appendChild(criterioSelect);

  const searchLabel = el(documentRef, 'label', null, 'Nombre');
  searchLabel.setAttribute('for', 'trabajadores-buscar');
  toolbar.appendChild(searchLabel);
  const searchInput = input(documentRef, {
    id: 'trabajadores-buscar',
    placeholder: 'Nombre…'
  });
  toolbar.appendChild(searchInput);

  const cargoLabel = el(documentRef, 'label', null, 'Cargo');
  cargoLabel.setAttribute('for', 'trabajadores-cargo');
  cargoLabel.hidden = true;
  toolbar.appendChild(cargoLabel);
  const cargoSelect = select(documentRef, {
    id: 'trabajadores-cargo',
    options: [
      { value: '', label: 'Todos los cargos' },
      ...listCatalogos({ tipo: 'cargo' }).map((row) => ({ value: row.id, label: row.nombre }))
    ]
  });
  cargoSelect.hidden = true;
  toolbar.appendChild(cargoSelect);

  const SEARCH_LABELS = { nombre: 'Nombre', rut: 'RUT', codigo: 'Código' };
  const SEARCH_PLACEHOLDERS = {
    nombre: 'Nombre…',
    rut: 'RUT (sin puntos ni guion)…',
    codigo: 'Código…'
  };

  function setCriterio() {
    const criterio = criterioSelect.value;
    const byCargo = criterio === 'cargo';
    searchLabel.hidden = byCargo;
    searchInput.hidden = byCargo;
    cargoLabel.hidden = !byCargo;
    cargoSelect.hidden = !byCargo;
    searchInput.value = '';
    cargoSelect.value = '';
    if (byCargo) return;
    searchLabel.textContent = SEARCH_LABELS[criterio] ?? SEARCH_LABELS.nombre;
    searchInput.placeholder = SEARCH_PLACEHOLDERS[criterio] ?? SEARCH_PLACEHOLDERS.nombre;
  }

  const includeLabel = el(documentRef, 'label', 'rrhh-checkbox');
  const includeBaja = input(documentRef, { id: 'trabajadores-incluir-baja', type: 'checkbox' });
  includeLabel.appendChild(includeBaja);
  includeLabel.appendChild(documentRef.createTextNode(' Incluir desvinculados'));
  toolbar.appendChild(includeLabel);
  listPanel.appendChild(toolbar);

  const table = el(documentRef, 'table', 'rrhh-table');
  const thead = el(documentRef, 'thead');
  const headRow = el(documentRef, 'tr');
  for (const label of ['Código', 'Nombre', 'RUT', 'Cargo', 'Departamento', 'Estado', '']) {
    headRow.appendChild(el(documentRef, 'th', null, label));
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = el(documentRef, 'tbody');
  table.appendChild(tbody);
  listPanel.appendChild(table);

  const empty = el(
    documentRef,
    'p',
    'rrhh-empty',
    'No hay trabajadores que coincidan con la búsqueda.'
  );
  empty.hidden = true;
  listPanel.appendChild(empty);

  const pagination = createPagination(documentRef, {
    id: 'trabajadores-pagination',
    onChange: () => refresh()
  });
  listPanel.appendChild(pagination.element);

  layout.appendChild(listPanel);
  container.appendChild(layout);

  // FR-112: vacation and dependants summary of a worker, linking to each screen.
  const resumenPanel = el(documentRef, 'section', 'panel rrhh-trabajador-resumen');
  resumenPanel.id = 'trabajador-resumen';
  resumenPanel.setAttribute('aria-live', 'polite');
  resumenPanel.hidden = true;
  container.appendChild(resumenPanel);

  function dias(value) {
    return Number(value || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 });
  }

  function mostrarResumen(row) {
    resumenPanel.textContent = '';
    const heading = el(documentRef, 'h4', null, `Vacaciones y cargas de ${row.name}`);
    heading.id = 'trabajador-resumen-title';
    resumenPanel.setAttribute('aria-labelledby', heading.id);
    resumenPanel.appendChild(heading);
    const table = el(documentRef, 'table', 'rrhh-table rrhh-resumen-table');
    const tbodyResumen = el(documentRef, 'tbody');
    const addRow = (label, value) => {
      const tr = el(documentRef, 'tr');
      const th = el(documentRef, 'th', null, label);
      th.scope = 'row';
      tr.appendChild(th);
      tr.appendChild(el(documentRef, 'td', null, value));
      tbodyResumen.appendChild(tr);
    };
    const actions = el(documentRef, 'div', 'form-actions');
    if (puedeVerVacaciones(viewer)) {
      const vacaciones = resumenVacacionesTrabajador(row.entityId);
      if (vacaciones) {
        addRow('Saldo de vacaciones', `${dias(vacaciones.saldo.disponible)} día(s) hábil(es)`);
        addRow(
          'Próximas vacaciones',
          vacaciones.proxima
            ? `${vacaciones.proxima.fechaInicio} a ${vacaciones.proxima.fechaFin} (${vacaciones.proxima.estado})`
            : 'Sin solicitudes próximas'
        );
      }
      actions.appendChild(
        button(documentRef, {
          id: 'trabajador-ir-vacaciones',
          label: 'Ver vacaciones',
          className: 'button button-secondary button-small',
          onClick: () => onNavigate?.('vacaciones', { entityId: row.entityId })
        })
      );
    }
    if (puedeVerCargas(viewer)) {
      const cargas = resumenCargasTrabajador(row.entityId);
      addRow('Cargas familiares vigentes', String(cargas.vigentes));
      if (cargas.proximoAviso) {
        addRow(
          'Próximo aviso de edad límite',
          `${cargas.proximoAviso.carga}: deja de ser carga el ${cargas.proximoAviso.fechaFinVigencia}`
        );
      }
      actions.appendChild(
        button(documentRef, {
          id: 'trabajador-ir-cargas',
          label: 'Ver cargas familiares',
          className: 'button button-secondary button-small',
          onClick: () => onNavigate?.('cargas', { entityId: row.entityId })
        })
      );
    }
    table.appendChild(tbodyResumen);
    resumenPanel.appendChild(table);
    resumenPanel.appendChild(actions);
    resumenPanel.hidden = false;
    resumenPanel.scrollIntoView?.({ block: 'nearest' });
  }
  root.appendChild(container);

  const form = canManage
    ? renderTrabajadorForm(formPanel, {
        doc: documentRef,
        viewer,
        catalogos: listCatalogos(),
        trabajadores: listTrabajadores({ incluirBaja: true }),
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
        'div',
        'panel rrhh-readonly',
        'Tu rol puede consultar trabajadores, pero no crear ni editar fichas.'
      )
    );
  }

  const desvPanel = el(documentRef, 'div', 'panel rrhh-desvinculacion-panel');
  desvPanel.id = 'trabajador-desvinculacion-panel';
  desvPanel.setAttribute('role', 'dialog');
  desvPanel.setAttribute('aria-modal', 'true');
  desvPanel.hidden = true;
  const desvTitle = el(documentRef, 'h4', null, 'Desvincular trabajador');
  desvPanel.appendChild(desvTitle);
  desvPanel.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'La desvinculación requiere fecha efectiva y no puede revertirse. Si hay novedades pendientes, deben resolverse antes.'
    )
  );
  const desvDate = input(documentRef, {
    id: 'desvinculacion-fecha',
    type: 'date',
    value: new Date().toISOString().slice(0, 10)
  });
  desvPanel.appendChild(desvDate);
  const desvFeedback = feedback(documentRef, 'desvinculacion-feedback');
  desvPanel.appendChild(desvFeedback);
  const desvActions = el(documentRef, 'div', 'form-actions');
  const desvConfirm = button(documentRef, {
    id: 'desvinculacion-confirmar',
    label: 'Confirmar desvinculación',
    className: 'button button-danger'
  });
  const desvCancel = button(documentRef, {
    id: 'desvinculacion-cancelar',
    label: 'Cancelar',
    className: 'button button-secondary'
  });
  desvActions.appendChild(desvConfirm);
  desvActions.appendChild(desvCancel);
  desvPanel.appendChild(desvActions);
  formPanel.appendChild(desvPanel);
  let desvRow = null;

  function closeDesv() {
    desvRow = null;
    desvPanel.hidden = true;
    clearFieldErrors(desvPanel);
    hideFeedback(desvFeedback);
  }

  function openDesv(row) {
    desvRow = row;
    desvTitle.textContent = `Desvincular a ${row.name}`;
    desvDate.value = new Date().toISOString().slice(0, 10);
    clearFieldErrors(desvPanel);
    hideFeedback(desvFeedback);
    desvPanel.hidden = false;
    drawer.setTitle('Desvincular trabajador');
    drawer.open();
    desvDate.focus?.();
  }

  desvCancel.addEventListener('click', closeDesv);
  desvConfirm.addEventListener('click', () => {
    if (!desvRow) return;
    clearFieldErrors(desvPanel);
    try {
      desactivarTrabajador(desvRow.entityId, desvDate.value, viewer);
      closeDesv();
      refresh();
    } catch (error) {
      setFieldErrors(desvPanel, error.errors, [
        { key: 'fecha', id: desvDate.id, match: [/fecha/i, /per.odo/i] }
      ]);
      showFeedback(desvFeedback, (error.errors || [error.message]).join(' '), 'error');
    }
  });

  function refresh() {
    const rows = listTrabajadores({
      term: searchInput.value,
      criterio: criterioSelect.value,
      cargoId: cargoSelect.value,
      incluirBaja: includeBaja.checked,
      viewer
    });
    tbody.textContent = '';
    pagination.render(rows.length);
    for (const row of pagination.slice(rows)) {
      const tr = el(documentRef, 'tr');
      tr.dataset.entityId = row.entityId;
      tr.appendChild(el(documentRef, 'td', null, row.code));
      tr.appendChild(el(documentRef, 'td', null, row.name));
      tr.appendChild(el(documentRef, 'td', null, row.rut || '—'));
      tr.appendChild(el(documentRef, 'td', null, row.cargo || '—'));
      tr.appendChild(el(documentRef, 'td', null, row.departamento || '—'));
      const stateCell = el(documentRef, 'td');
      stateCell.appendChild(badge(documentRef, row.estadoLaboral, statusTone(row.estadoLaboral)));
      tr.appendChild(stateCell);

      const actions = el(documentRef, 'td', 'rrhh-row-actions');
      if (canManage) {
        actions.appendChild(
          button(documentRef, {
            label: 'Editar',
            className: 'button button-secondary button-small',
            ariaLabel: `Editar ${row.name}`,
            onClick: () => {
              form?.edit(row);
              drawer.setTitle(`Editar ${row.name}`);
              drawer.open();
            }
          })
        );
        if (row.estadoLaboral === 'Activo') {
          actions.appendChild(
            button(documentRef, {
              label: 'Desvincular',
              className: 'button button-ghost button-small',
              ariaLabel: `Desvincular ${row.name}`,
              onClick: () => openDesv(row)
            })
          );
        }
      } else {
        actions.appendChild(
          button(documentRef, {
            label: 'Ver',
            className: 'button button-secondary button-small',
            onClick: () => onRoleRequired?.()
          })
        );
      }
      if (puedeVerVacaciones(viewer) || puedeVerCargas(viewer)) {
        actions.appendChild(
          button(documentRef, {
            label: 'Vacaciones y cargas',
            className: 'button button-ghost button-small',
            ariaLabel: `Ver vacaciones y cargas de ${row.name}`,
            onClick: () => mostrarResumen(row)
          })
        );
      }
      tr.appendChild(actions);
      tbody.appendChild(tr);
    }
    empty.hidden = rows.length > 0;
  }

  criterioSelect.addEventListener('change', () => {
    setCriterio();
    pagination.reset();
    refresh();
  });
  searchInput.addEventListener('input', () => {
    pagination.reset();
    refresh();
  });
  cargoSelect.addEventListener('change', () => {
    pagination.reset();
    refresh();
  });
  includeBaja.addEventListener('change', () => {
    pagination.reset();
    refresh();
  });
  setCriterio();
  refresh();

  return {
    refresh,
    dispose() {
      drawer.dispose();
      container.remove();
    }
  };
}
