/** Liquidation list with lifecycle actions and the explanatory view. */

import {
  cambiarEstadoLiquidacion,
  listLiquidaciones,
  loadLiquidacion
} from '../utils/liquidacion-service.js';
import { ESTADO_LIQUIDACION_LABELS, estadosSiguientes } from '../utils/liquidacion-estados.js';
import { isPeriodoCerrado } from '../utils/periodos-service.js';
import { can, canViewLiquidacion } from '../seguridad/roles.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { renderLiquidacion } from './liquidacion.js';
import {
  badge,
  button,
  el,
  feedback,
  hideFeedback,
  select,
  showFeedback,
  statusTone
} from '../components/dom.js';

function periodoKey(liquidacion) {
  return (
    liquidacion?.periodoId ||
    liquidacion?.periodo?.id ||
    liquidacion?.periodo?.periodo ||
    (liquidacion?.periodo?.anio && liquidacion?.periodo?.mes
      ? `${liquidacion.periodo.anio}-${String(liquidacion.periodo.mes).padStart(2, '0')}`
      : '')
  );
}

function periodoLabel(liquidacion) {
  return liquidacion?.periodo?.etiqueta || periodoKey(liquidacion) || 'Sin período';
}

export function renderLiquidacionesView(
  root,
  { doc, config, viewer, onLiquidationView, initialPeriodo } = {}
) {
  const documentRef = doc || root.ownerDocument;

  if (!can(viewer?.role, 'canViewLiquidaciones')) {
    root.textContent = '';
    const denied = el(documentRef, 'div', 'rrhh-access-denied panel');
    denied.id = 'liquidaciones-access-denied';
    denied.setAttribute('role', 'alert');
    denied.appendChild(el(documentRef, 'h3', null, 'Acceso denegado'));
    denied.appendChild(
      el(
        documentRef,
        'p',
        null,
        'Tu rol no tiene acceso a liquidaciones ni a sueldos base. Consulta las novedades de tu equipo.'
      )
    );
    root.appendChild(denied);
    return { refresh() {}, dispose() {} };
  }

  const container = el(documentRef, 'section', 'rrhh-section rrhh-liquidaciones-view');
  container.id = 'rrhh-liquidaciones-view';
  container.setAttribute('aria-labelledby', 'rrhh-liquidaciones-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Liquidaciones');
  title.id = 'rrhh-liquidaciones-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Selecciona una liquidación para revisar su desglose explicable, imprimirla o gestionar su ciclo de vida.'
    )
  );
  container.appendChild(header);

  const messages = feedback(documentRef, 'liquidaciones-feedback');
  container.appendChild(messages);

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const filterLabel = el(documentRef, 'label', null, 'Período');
  filterLabel.setAttribute('for', 'liquidaciones-periodo');
  toolbar.appendChild(filterLabel);

  const filterContainer = el(documentRef, 'span', 'rrhh-filter-container');
  toolbar.appendChild(filterContainer);

  const actionsContainer = el(documentRef, 'div', 'rrhh-row-actions rrhh-liquidacion-actions');
  toolbar.appendChild(actionsContainer);
  container.appendChild(toolbar);

  const listContainer = el(documentRef, 'div', 'rrhh-list-container');
  container.appendChild(listContainer);

  const liquidationRoot = el(documentRef, 'div');
  liquidationRoot.id = 'rrhh-liquidacion-root';
  container.appendChild(liquidationRoot);

  root.appendChild(container);

  let selectedPeriod = initialPeriodo || '';
  let selectedId = null;
  let liquidationController = null;

  function allLiquidations() {
    const rows = listLiquidaciones();
    if (rows.length > 0) return rows;
    const demo = loadLiquidacion();
    return demo ? [demo] : [];
  }

  function liquidations() {
    const rows = allLiquidations();
    return selectedPeriod ? rows.filter((row) => periodoKey(row) === selectedPeriod) : rows;
  }

  function renderFilter(rows) {
    const all = allLiquidations();
    const periods = [...new Set(all.map(periodoKey).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    filterContainer.textContent = '';
    const filter = select(documentRef, {
      id: 'liquidaciones-periodo',
      options: [
        { value: '', label: 'Todos los períodos' },
        ...periods.map((value) => ({
          value,
          label: all.find((row) => periodoKey(row) === value)?.periodo?.etiqueta || value
        }))
      ],
      value: selectedPeriod
    });
    filter.addEventListener('change', () => {
      selectedPeriod = filter.value;
      selectedId = null;
      refresh();
    });
    filterContainer.appendChild(filter);
    return rows;
  }

  function renderList(rows) {
    listContainer.textContent = '';
    if (rows.length === 0) {
      const empty = el(documentRef, 'div', 'empty-state', 'No hay liquidaciones en el período seleccionado.');
      empty.id = 'liquidaciones-empty';
      listContainer.appendChild(empty);
      return;
    }
    const list = el(documentRef, 'div', 'rrhh-list');
    list.id = 'liquidaciones-list';
    list.setAttribute('role', 'list');
    for (const liquidacion of rows) {
      const item = el(documentRef, 'article', 'rrhh-list-item');
      item.setAttribute('role', 'listitem');
      item.dataset.liquidacionId = liquidacion.id;

      const rowHeader = el(documentRef, 'div', 'rrhh-list-item-header');
      const info = el(documentRef, 'div', 'rrhh-list-item-title');
      info.appendChild(el(documentRef, 'strong', null, liquidacion.trabajador?.nombre || 'Trabajador'));
      info.appendChild(
        el(
          documentRef,
          'span',
          'panel-copy',
          `${liquidacion.numero || liquidacion.id} · ${periodoLabel(liquidacion)}`
        )
      );
      rowHeader.appendChild(info);
      rowHeader.appendChild(
        badge(
          documentRef,
          ESTADO_LIQUIDACION_LABELS[liquidacion.estado] || liquidacion.estado || '',
          statusTone(liquidacion.estado)
        )
      );
      item.appendChild(rowHeader);

      const actions = el(documentRef, 'div', 'rrhh-row-actions');
      actions.appendChild(
        button(documentRef, {
          label: 'Ver liquidación',
          className: 'button button-secondary button-small',
          ariaLabel: `Ver la liquidación de ${liquidacion.trabajador?.nombre || 'trabajador'}`,
          onClick: () => selectLiquidation(liquidacion.id)
        })
      );
      item.appendChild(actions);
      list.appendChild(item);
    }
    listContainer.appendChild(list);
  }

  function lifecycleActions(liquidacion) {
    actionsContainer.textContent = '';
    if (!liquidacion) return;
    const cerrado = isPeriodoCerrado(periodoKey(liquidacion)) || liquidacion.periodo?.cerrado === true;
    const siguientes = estadosSiguientes(liquidacion.estado);
    const canApprove =
      siguientes.includes('aprobada') && can(viewer?.role, 'canApproveLiquidaciones');
    const canPay = siguientes.includes('pagada') && can(viewer?.role, 'canPayLiquidaciones');
    const canAnnull =
      siguientes.includes('anulada') && can(viewer?.role, 'canAnularLiquidaciones');

    if (canApprove) {
      actionsContainer.appendChild(
        button(documentRef, {
          id: 'liq-approve',
          label: 'Aprobar',
          className: 'button button-primary button-small',
          disabled: cerrado,
          ariaLabel: 'Aprobar la liquidación seleccionada',
          onClick: () => changeState(liquidacion.id, 'aprobada')
        })
      );
    }
    if (canPay) {
      actionsContainer.appendChild(
        button(documentRef, {
          id: 'liq-pay',
          label: 'Registrar pago',
          className: 'button button-primary button-small',
          disabled: cerrado,
          ariaLabel: 'Registrar el pago de la liquidación seleccionada',
          onClick: () => changeState(liquidacion.id, 'pagada')
        })
      );
    }
    if (canAnnull) {
      const motive = el(documentRef, 'input', 'rrhh-annul-motive');
      motive.type = 'text';
      motive.id = 'liq-annul-motivo';
      motive.placeholder = 'Motivo de anulación';
      motive.setAttribute('aria-label', 'Motivo de anulación de la liquidación');
      motive.disabled = cerrado;
      actionsContainer.appendChild(motive);
      actionsContainer.appendChild(
        button(documentRef, {
          id: 'liq-annul',
          label: 'Anular',
          className: 'button button-danger button-small',
          disabled: cerrado,
          ariaLabel: 'Anular la liquidación seleccionada',
          onClick: () => changeState(liquidacion.id, 'anulada', motive.value)
        })
      );
    }
    if (cerrado) {
      actionsContainer.appendChild(el(documentRef, 'span', 'panel-copy', 'Período cerrado: solo lectura.'));
    }
  }

  function selectLiquidation(id) {
    const liquidacion = allLiquidations().find((row) => row.id === id) || null;
    selectedId = liquidacion?.id || null;
    liquidationController?.dispose?.();
    liquidationController = null;
    if (!liquidacion) {
      liquidationRoot.textContent = '';
      lifecycleActions(null);
      onLiquidationView?.(null);
      return;
    }
    if (!canViewLiquidacion(liquidacion, viewer)) {
      liquidationRoot.textContent = '';
      const denied = el(documentRef, 'div', 'rrhh-access-denied panel');
      denied.setAttribute('role', 'alert');
      denied.appendChild(el(documentRef, 'h3', null, 'Acceso denegado'));
      denied.appendChild(
        el(documentRef, 'p', null, 'No tienes permiso para ver esta liquidación.')
      );
      liquidationRoot.appendChild(denied);
      lifecycleActions(null);
      return;
    }
    liquidationController = renderLiquidacion(liquidationRoot, liquidacion, {
      doc: documentRef,
      win: documentRef.defaultView,
      viewer,
      empresa: config?.empresa ? { ...config.empresa } : undefined
    });
    registrarAuditoria({
      accion: 'ver_sensible',
      tabla: 'liquidaciones',
      registroId: liquidacion.id,
      motivo: 'Consulta de liquidación desde la vista',
      actor: viewer?.usuario || viewer?.role,
      rol: viewer?.role
    });
    onLiquidationView?.(liquidationController);
    lifecycleActions(liquidacion);
  }

  function changeState(id, hasta, motivo = '') {
    hideFeedback(messages);
    try {
      const updated = cambiarEstadoLiquidacion(id, hasta, { viewer, motivo });
      showFeedback(
        messages,
        `Liquidación ${updated.numero || updated.id}: ${ESTADO_LIQUIDACION_LABELS[hasta] || hasta}.`,
        'ok'
      );
      refresh(updated.id);
    } catch (error) {
      const detail = (error.errors || [error.message]).join(' ');
      showFeedback(messages, detail, 'error');
    }
  }

  function refresh(preferredId) {
    const rows = liquidations();
    renderFilter(rows);
    renderList(rows);
    const target = preferredId
      ? allLiquidations().find((row) => row.id === preferredId)
      : rows.find((row) => row.id === selectedId) || rows[0] || allLiquidations()[0];
    selectLiquidation(target?.id);
  }

  refresh();

  return {
    refresh,
    get selectedId() {
      return selectedId;
    },
    dispose() {
      liquidationController?.dispose?.();
      liquidationController = null;
      onLiquidationView?.(null);
      root.textContent = '';
    }
  };
}
