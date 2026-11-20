/** Base catalogs view: cargos, departamentos and centros de costo. */

import {
  TIPOS_CATALOGO,
  TIPO_CATALOGO_LABELS,
  actualizarCatalogo,
  crearCatalogo,
  eliminarCatalogo,
  listCatalogos,
  puedeGestionarCatalogos,
  puedeVerCatalogos
} from '../utils/catalogos-service.js';
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
import { createFormPanel } from '../components/form-panel.js';

function errorMessages(error) {
  if (!error) return ['No se pudo guardar el catálogo.'];
  if (Array.isArray(error.errors)) return error.errors;
  if (error.errors && typeof error.errors === 'object') return Object.values(error.errors);
  return [error.message];
}

function accessDenied(documentRef, root) {
  const denied = el(documentRef, 'div', 'rrhh-access-denied panel');
  denied.setAttribute('role', 'alert');
  denied.appendChild(el(documentRef, 'h3', null, 'Acceso denegado'));
  denied.appendChild(
    el(documentRef, 'p', null, 'Tu rol no tiene permiso para consultar catálogos base.')
  );
  root.appendChild(denied);
  return { refresh() {}, dispose() {} };
}

export function renderCatalogosView(root, { doc, viewer } = {}) {
  const documentRef = doc || root.ownerDocument;

  if (!puedeVerCatalogos(viewer)) {
    return accessDenied(documentRef, root);
  }

  const canManage = puedeGestionarCatalogos(viewer);
  let editing = null;

  const container = el(documentRef, 'section', 'rrhh-section rrhh-catalogos-view');
  container.id = 'rrhh-catalogos-view';
  container.setAttribute('aria-labelledby', 'rrhh-catalogos-title');

  const drawer = createFormPanel(documentRef, {
    id: 'catalogos-form-drawer',
    title: 'Nuevo registro de catálogo'
  });
  container.appendChild(drawer.element);

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Catálogos base');
  title.id = 'rrhh-catalogos-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Cargos, departamentos y centros de costo reutilizables por todas las fichas de trabajadores.'
    )
  );
  if (canManage) {
    header.appendChild(
      button(documentRef, {
        id: 'catalogos-nuevo-registro',
        label: 'Nuevo registro de catálogo',
        className: 'button button-primary rrhh-primary-action',
        onClick: () => {
          formPanel.resetForm?.();
          drawer.setTitle('Nuevo registro de catálogo');
          drawer.open();
        }
      })
    );
  }
  container.appendChild(header);

  const layout = el(documentRef, 'div', 'rrhh-list-layout');
  const formPanel = el(documentRef, 'div', 'rrhh-drawer-form');
  const listPanel = el(documentRef, 'div', 'panel rrhh-list-panel');

  let tipoSelect;
  let codigoInput;
  let nombreInput;
  let descripcionInput;
  let submitButton;
  let cancelButton;
  let messages;

  if (canManage) {
    const form = el(documentRef, 'form', 'panel form-panel rrhh-catalogo-form');
    form.id = 'catalogo-form';
    form.noValidate = true;

    const formHeader = el(documentRef, 'div', 'panel-header');
    const formTitle = el(documentRef, 'h4', null, 'Nuevo registro');
    formHeader.appendChild(formTitle);
    form.appendChild(formHeader);

    const fields = el(documentRef, 'div', 'field-grid');

    tipoSelect = select(documentRef, {
      id: 'catalogo-tipo',
      options: TIPOS_CATALOGO.map((value) => ({ value, label: TIPO_CATALOGO_LABELS[value] }))
    });
    fields.appendChild(wrap(documentRef, 'catalogo-tipo', 'Tipo *', tipoSelect, true));

    codigoInput = input(documentRef, {
      id: 'catalogo-codigo',
      placeholder: 'Código único por tipo'
    });
    fields.appendChild(wrap(documentRef, 'catalogo-codigo', 'Código *', codigoInput));

    nombreInput = input(documentRef, { id: 'catalogo-nombre', placeholder: 'Nombre visible' });
    fields.appendChild(wrap(documentRef, 'catalogo-nombre', 'Nombre *', nombreInput));

    descripcionInput = input(documentRef, {
      id: 'catalogo-descripcion',
      placeholder: 'Descripción (opcional)'
    });
    fields.appendChild(
      wrap(documentRef, 'catalogo-descripcion', 'Descripción', descripcionInput, true)
    );

    form.appendChild(fields);

    messages = feedback(documentRef, 'catalogo-form-errors', 'field-error rrhh-form-errors');
    form.appendChild(messages);

    const actions = el(documentRef, 'div', 'form-actions');
    submitButton = el(documentRef, 'button', 'button button-primary', 'Guardar');
    submitButton.type = 'submit';
    submitButton.id = 'catalogo-submit';
    actions.appendChild(submitButton);

    cancelButton = el(documentRef, 'button', 'button button-secondary', 'Cancelar');
    cancelButton.type = 'button';
    cancelButton.id = 'catalogo-cancel';
    cancelButton.hidden = true;
    cancelButton.addEventListener('click', () => resetForm());
    actions.appendChild(cancelButton);
    form.appendChild(actions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      hideFeedback(messages);
      const values = {
        tipo: tipoSelect.value,
        codigo: codigoInput.value,
        nombre: nombreInput.value,
        descripcion: descripcionInput.value
      };
      try {
        if (editing) {
          actualizarCatalogo(editing.id, values, viewer);
          showFeedback(messages, 'Catálogo actualizado.', 'ok');
        } else {
          crearCatalogo(values, viewer);
          showFeedback(messages, 'Catálogo creado.', 'ok');
        }
        resetForm();
        drawer.markSaved();
        refresh();
        drawer.close({ force: true });
      } catch (error) {
        showFeedback(messages, errorMessages(error).join(' '), 'error');
      }
    });

    formPanel.appendChild(form);
    drawer.content.appendChild(formPanel);

    function resetForm() {
      editing = null;
      form.reset();
      tipoSelect.value = TIPOS_CATALOGO[0];
      hideFeedback(messages);
      cancelButton.hidden = true;
      submitButton.textContent = 'Guardar';
      formTitle.textContent = 'Nuevo registro';
    }

    formPanel.resetForm = resetForm;
    formPanel.edit = (row) => {
      editing = row;
      tipoSelect.value = row.tipo;
      codigoInput.value = row.codigo;
      nombreInput.value = row.nombre;
      descripcionInput.value = row.descripcion || '';
      cancelButton.hidden = false;
      submitButton.textContent = 'Guardar cambios';
      formTitle.textContent = `Editar ${TIPO_CATALOGO_LABELS[row.tipo] || row.tipo}`;
    };
  } else {
    formPanel.appendChild(
      el(
        documentRef,
        'div',
        'panel rrhh-readonly',
        'Tu rol puede consultar catálogos, pero no modificarlos.'
      )
    );
  }

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const filterLabel = el(documentRef, 'label', null, 'Tipo');
  filterLabel.setAttribute('for', 'catalogo-filtro');
  toolbar.appendChild(filterLabel);
  const filterSelect = select(documentRef, {
    id: 'catalogo-filtro',
    options: [
      { value: '', label: 'Todos' },
      ...TIPOS_CATALOGO.map((value) => ({ value, label: TIPO_CATALOGO_LABELS[value] }))
    ]
  });
  toolbar.appendChild(filterSelect);

  const includeLabel = el(documentRef, 'label', 'rrhh-checkbox');
  const includeInactive = input(documentRef, {
    id: 'catalogo-incluir-inactivos',
    type: 'checkbox'
  });
  includeLabel.appendChild(includeInactive);
  includeLabel.appendChild(documentRef.createTextNode(' Incluir inactivos'));
  toolbar.appendChild(includeLabel);
  listPanel.appendChild(toolbar);

  const table = el(documentRef, 'table', 'rrhh-table');
  const thead = el(documentRef, 'thead');
  const headRow = el(documentRef, 'tr');
  for (const label of ['Tipo', 'Código', 'Nombre', 'Estado', '']) {
    headRow.appendChild(el(documentRef, 'th', null, label));
  }
  thead.appendChild(headRow);
  table.appendChild(thead);
  const tbody = el(documentRef, 'tbody');
  table.appendChild(tbody);
  listPanel.appendChild(table);

  const empty = el(documentRef, 'p', 'rrhh-empty', 'No hay catálogos para el filtro seleccionado.');
  empty.hidden = true;
  listPanel.appendChild(empty);

  layout.appendChild(listPanel);
  container.appendChild(layout);
  root.appendChild(container);

  function refresh() {
    const rows = listCatalogos({
      tipo: filterSelect.value || undefined,
      incluirInactivos: includeInactive.checked
    });
    tbody.textContent = '';
    for (const row of rows) {
      const tr = el(documentRef, 'tr');
      tr.dataset.catalogoId = row.id;
      tr.appendChild(el(documentRef, 'td', null, TIPO_CATALOGO_LABELS[row.tipo] || row.tipo));
      tr.appendChild(el(documentRef, 'td', null, row.codigo));
      tr.appendChild(el(documentRef, 'td', null, row.nombre));
      const stateCell = el(documentRef, 'td');
      stateCell.appendChild(
        badge(
          documentRef,
          row.activo === false ? 'Inactivo' : 'Activo',
          row.activo === false ? 'neutral' : 'ok'
        )
      );
      tr.appendChild(stateCell);

      const actions = el(documentRef, 'td', 'rrhh-row-actions');
      if (canManage) {
        actions.appendChild(
          button(documentRef, {
            label: 'Editar',
            className: 'button button-secondary button-small',
            onClick: () => {
              formPanel.edit?.(row);
              drawer.setTitle(`Editar ${TIPO_CATALOGO_LABELS[row.tipo] || row.tipo}`);
              drawer.open();
            }
          })
        );
        if (row.activo !== false) {
          actions.appendChild(
            button(documentRef, {
              label: 'Desactivar',
              className: 'button button-ghost button-small',
              onClick: () => {
                eliminarCatalogo(row.id, viewer);
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
  includeInactive.addEventListener('change', refresh);
  refresh();

  return {
    refresh,
    dispose() {
      drawer.dispose();
      container.remove();
    }
  };
}

function wrap(documentNode, id, labelText, control, wide = false) {
  const wrapper = el(documentNode, 'div', `field${wide ? ' field-wide' : ''}`);
  const label = el(documentNode, 'label', null, labelText);
  label.setAttribute('for', id);
  wrapper.appendChild(label);
  wrapper.appendChild(control);
  return wrapper;
}
