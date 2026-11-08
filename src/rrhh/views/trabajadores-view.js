/** Workers view: register, search and edit worker files. */

import {
  desactivarTrabajador,
  listTrabajadores,
  puedeGestionarTrabajadores,
  puedeVerTrabajadores
} from '../utils/trabajadores-service.js';
import { listCatalogos } from '../utils/catalogos-service.js';
import { renderTrabajadorForm } from '../components/trabajador-form.js';
import { badge, button, el, input } from '../components/dom.js';

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

export function renderTrabajadoresView(root, { doc, viewer, onRoleRequired } = {}) {
  const documentRef = doc || root.ownerDocument;

  if (!puedeVerTrabajadores(viewer)) {
    return accessDenied(documentRef, root);
  }

  const canManage = puedeGestionarTrabajadores(viewer);

  const container = el(documentRef, 'section', 'rrhh-section rrhh-trabajadores-view');
  container.id = 'rrhh-trabajadores-view';
  container.setAttribute('aria-labelledby', 'rrhh-trabajadores-title');

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
  container.appendChild(header);

  const layout = el(documentRef, 'div', 'rrhh-split');

  const formPanel = el(documentRef, 'div', 'rrhh-split-aside');
  layout.appendChild(formPanel);

  const listPanel = el(documentRef, 'div', 'panel rrhh-list-panel');
  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');

  const searchLabel = el(documentRef, 'label', null, 'Buscar');
  searchLabel.setAttribute('for', 'trabajadores-buscar');
  toolbar.appendChild(searchLabel);
  const searchInput = input(documentRef, {
    id: 'trabajadores-buscar',
    placeholder: 'Nombre, código, RUT, cargo…'
  });
  toolbar.appendChild(searchInput);

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

  const empty = el(documentRef, 'p', 'rrhh-empty', 'No hay trabajadores que coincidan con la búsqueda.');
  empty.hidden = true;
  listPanel.appendChild(empty);

  layout.appendChild(listPanel);
  container.appendChild(layout);
  root.appendChild(container);

  const form = canManage
    ? renderTrabajadorForm(formPanel, {
        doc: documentRef,
        viewer,
        catalogos: listCatalogos(),
        onSaved: () => refresh()
      })
    : null;

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

  function refresh() {
    const rows = listTrabajadores({
      term: searchInput.value,
      incluirBaja: includeBaja.checked,
      viewer
    });
    tbody.textContent = '';
    for (const row of rows) {
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
            onClick: () => form?.edit(row)
          })
        );
        if (row.estadoLaboral === 'Activo') {
          actions.appendChild(
            button(documentRef, {
              label: 'Desvincular',
              className: 'button button-ghost button-small',
              ariaLabel: `Desvincular ${row.name}`,
              onClick: () => {
                desactivarTrabajador(row.entityId, viewer);
                refresh();
              }
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
      tr.appendChild(actions);
      tbody.appendChild(tr);
    }
    empty.hidden = rows.length > 0;
  }

  searchInput.addEventListener('input', refresh);
  includeBaja.addEventListener('change', refresh);
  refresh();

  return {
    refresh,
    dispose() {
      container.remove();
    }
  };
}
