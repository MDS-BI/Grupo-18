/** Read-only, insert-only audit log view. */

import { listAuditoria } from '../seguridad/auditoria.js';
import { can } from '../seguridad/roles.js';
import { badge, el, select } from '../components/dom.js';

const ACCION_LABELS = {
  ver_sensible: 'Consulta sensible',
  crear: 'Creación',
  editar: 'Edición',
  eliminar: 'Eliminación',
  aprobar: 'Aprobación',
  rechazar: 'Rechazo',
  reenviar: 'Reenvío',
  calcular: 'Cálculo',
  cambio_estado: 'Cambio de estado',
  pagar: 'Pago',
  anular: 'Anulación',
  cerrar_periodo: 'Cierre de período',
  abrir_periodo: 'Apertura de período',
  exportar: 'Exportación',
  acceso_denegado: 'Acceso denegado'
};

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('es-CL', { timeZone: 'UTC' });
}

export function renderAuditoriaView(root, { doc, viewer } = {}) {
  const documentRef = doc || root.ownerDocument;

  if (!can(viewer?.role, 'canViewAuditoria')) {
    const denied = el(documentRef, 'div', 'rrhh-access-denied panel');
    denied.id = 'auditoria-access-denied';
    denied.setAttribute('role', 'alert');
    denied.appendChild(el(documentRef, 'h3', null, 'Acceso denegado'));
    denied.appendChild(
      el(documentRef, 'p', null, 'Tu rol no tiene permiso para consultar la bitácora de auditoría.')
    );
    root.appendChild(denied);
    return { refresh() {}, dispose() {} };
  }

  const container = el(documentRef, 'section', 'rrhh-section rrhh-auditoria-view');
  container.id = 'rrhh-auditoria-view';
  container.setAttribute('aria-labelledby', 'rrhh-auditoria-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h4', null, 'Bitácora de auditoría');
  title.id = 'rrhh-auditoria-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Registro de solo inserción: no admite edición ni eliminación. Se guardan usuario, rol, fecha, acción y registro afectado; nunca los valores sensibles.'
    )
  );
  container.appendChild(header);

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const filterLabel = el(documentRef, 'label', null, 'Tabla');
  filterLabel.setAttribute('for', 'auditoria-tabla');
  toolbar.appendChild(filterLabel);
  let selectedTabla = '';
  const filter = select(documentRef, {
    id: 'auditoria-tabla',
    options: [
      { value: '', label: 'Todas las tablas' },
      { value: 'liquidaciones', label: 'Liquidaciones' },
      { value: 'novedades', label: 'Novedades' },
      { value: 'periodos', label: 'Períodos' },
      { value: 'datos_sensibles', label: 'Datos sensibles' }
    ],
    value: ''
  });
  filter.addEventListener('change', () => {
    selectedTabla = filter.value;
    render();
  });
  toolbar.appendChild(filter);
  container.appendChild(toolbar);

  const listContainer = el(documentRef, 'div', 'rrhh-list-container');
  container.appendChild(listContainer);

  function render() {
    const rows = listAuditoria(selectedTabla ? { tabla: selectedTabla } : {}).reverse();
    listContainer.textContent = '';
    if (rows.length === 0) {
      const empty = el(documentRef, 'div', 'empty-state', 'Todavía no hay registros de auditoría.');
      empty.id = 'auditoria-empty';
      listContainer.appendChild(empty);
      return;
    }
    const table = el(documentRef, 'div', 'rrhh-table');
    table.id = 'auditoria-list';
    table.setAttribute('role', 'table');
    table.setAttribute('aria-label', 'Bitácora de auditoría');
    const head = el(documentRef, 'div', 'rrhh-table-row rrhh-table-head');
    head.setAttribute('role', 'row');
    for (const label of ['Fecha y hora', 'Usuario', 'Rol', 'Acción', 'Registro', 'Motivo']) {
      const cell = el(documentRef, 'span', null, label);
      cell.setAttribute('role', 'columnheader');
      head.appendChild(cell);
    }
    table.appendChild(head);

    for (const entry of rows) {
      const row = el(documentRef, 'div', 'rrhh-table-row');
      row.setAttribute('role', 'row');
      row.dataset.auditoriaId = entry.id;
      const values = [
        formatDateTime(entry.fecha),
        entry.usuario || '—',
        entry.rol || '—',
        ACCION_LABELS[entry.accion] || entry.accion || '—',
        `${entry.tabla || '—'}${entry.registroId ? ` · ${entry.registroId}` : ''}`,
        entry.motivo || '—'
      ];
      values.forEach((value, index) => {
        const cell = el(documentRef, 'span', 'rrhh-table-cell', value);
        cell.setAttribute('role', 'cell');
        if (index === 3) {
          cell.textContent = '';
          cell.appendChild(
            badge(
              documentRef,
              value,
              entry.accion === 'acceso_denegado' ? 'danger' : entry.accion === 'ver_sensible' ? 'warn' : 'ok'
            )
          );
        }
        row.appendChild(cell);
      });
      table.appendChild(row);
    }
    listContainer.appendChild(table);
  }

  render();
  root.appendChild(container);

  return {
    refresh: render,
    dispose() {
      root.textContent = '';
    }
  };
}
