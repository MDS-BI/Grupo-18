/** Period management view: open, list and close payroll periods. */

import {
  abrirPeriodo,
  cerrarPeriodo,
  listPeriodos,
  puedeGestionarPeriodo
} from '../utils/periodos-service.js';
import { etiquetaPeriodo, parsePeriodo } from '../utils/periodos.js';
import { renderPeriodoList } from '../components/periodo-list.js';
import { button, currentPeriodoId, el, feedback, input, showFeedback, hideFeedback } from '../components/dom.js';

export function renderPeriodosView(root, { doc, viewer } = {}) {
  const documentRef = doc || root.ownerDocument;
  const container = el(documentRef, 'section', 'rrhh-section rrhh-periodos-view');
  container.id = 'rrhh-periodos-view';
  container.setAttribute('aria-labelledby', 'rrhh-periodos-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  header.appendChild(el(documentRef, 'h3', null, 'Períodos de remuneración'));
  header.querySelector('h3').id = 'rrhh-periodos-title';
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Un período cerrado congela UF, UTM, IMM y los parámetros legales; sus novedades y liquidaciones quedan en solo lectura.'
    )
  );
  container.appendChild(header);

  const canManage = puedeGestionarPeriodo(viewer);
  if (!canManage) {
    const notice = el(
      documentRef,
      'p',
      'rrhh-notice',
      'Solo Jefatura o Administrador pueden cerrar períodos. Puedes consultar el estado de cada período.'
    );
    notice.id = 'periodos-permission';
    container.appendChild(notice);
  }

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const periodInput = input(documentRef, {
    id: 'periodo-nuevo',
    type: 'month',
    value: currentPeriodoId()
  });
  const label = el(documentRef, 'label', null, 'Nuevo período');
  label.setAttribute('for', 'periodo-nuevo');
  toolbar.appendChild(label);
  toolbar.appendChild(periodInput);

  const openButton = button(documentRef, {
    id: 'periodo-abrir',
    label: 'Abrir período',
    className: 'button button-primary',
    disabled: !canManage,
    ariaLabel: 'Abrir un nuevo período de remuneración',
    onClick: () => openSelectedPeriod()
  });
  toolbar.appendChild(openButton);
  container.appendChild(toolbar);

  const messages = feedback(documentRef, 'periodos-feedback');
  container.appendChild(messages);

  const listContainer = el(documentRef, 'div', 'rrhh-list-container');
  container.appendChild(listContainer);

  function openSelectedPeriod() {
    const value = periodInput.value;
    hideFeedback(messages);
    if (!parsePeriodo(value)) {
      showFeedback(messages, 'Selecciona un período válido con formato AAAA-MM.', 'error');
      return;
    }
    try {
      abrirPeriodo(value, viewer);
      showFeedback(messages, `Período ${etiquetaPeriodo(value)} abierto.`, 'ok');
      refresh();
    } catch (error) {
      showFeedback(messages, error.message, 'error');
    }
  }

  function closePeriod(periodoId) {
    hideFeedback(messages);
    try {
      cerrarPeriodo(periodoId, viewer);
      showFeedback(messages, `Período ${etiquetaPeriodo(periodoId)} cerrado y congelado.`, 'ok');
      refresh();
    } catch (error) {
      showFeedback(messages, error.message, 'error');
    }
  }

  function refresh() {
    const periodos = listPeriodos();
    renderPeriodoList(listContainer, {
      doc: documentRef,
      periodos,
      canManage,
      onAction: (periodoId, accion) => {
        if (accion === 'cerrar') closePeriod(periodoId);
      }
    });
  }

  refresh();
  root.appendChild(container);

  return {
    refresh,
    dispose() {
      root.textContent = '';
    }
  };
}
