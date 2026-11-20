/** Payroll calculation view: choose a period, calculate and review results. */

import { loadEntities } from '../../storage.js';
import { calcularPeriodo } from '../utils/liquidacion-service.js';
import { listContratos } from '../utils/contratos-service.js';
import { estadoElegibilidad, listNovedades } from '../utils/novedades-service.js';
import { getPeriodo, isPeriodoCerrado, listPeriodos } from '../utils/periodos-service.js';
import { etiquetaPeriodo, parsePeriodo } from '../utils/periodos.js';
import { can } from '../seguridad/roles.js';
import { renderCalculoResumen } from '../components/calculo-resumen.js';
import { renderLiquidacion } from './liquidacion.js';
import {
  button,
  currentPeriodoId,
  el,
  feedback,
  formatMoney,
  hideFeedback,
  input,
  showFeedback
} from '../components/dom.js';

export function contratoDesdeEntidad(entity = {}) {
  const entityId = entity.entity_id || entity.id;
  const custom = entity.customFields || entity.camposPersonalizados || {};
  const sueldoBase = Number(entity.sueldoBase ?? entity.remuneracionBase ?? custom.sueldoBase ?? 0);
  if (!sueldoBase) return null;
  return {
    id: `contrato-${entityId}`,
    entity_id: entityId,
    estado: entity.estadoContrato || 'vigente',
    sueldoBase,
    jornadaHorasSemanales: Number(
      entity.jornadaHorasSemanales || custom.jornadaHorasSemanales || 42
    ),
    tipoContrato: entity.tipoContrato || custom.tipoContrato || 'indefinido',
    modalidadGratificacion:
      entity.modalidadGratificacion || custom.modalidadGratificacion || 'art50',
    asignacionColacion: Number(entity.asignacionColacion || custom.asignacionColacion || 0),
    asignacionMovilizacion: Number(
      entity.asignacionMovilizacion || custom.asignacionMovilizacion || 0
    )
  };
}

export function renderPlanillaView(root, { doc, config, viewer, onNavigate } = {}) {
  const documentRef = doc || root.ownerDocument;
  const container = el(documentRef, 'section', 'rrhh-section rrhh-planilla-view');
  container.id = 'rrhh-planilla-view';
  container.setAttribute('aria-labelledby', 'rrhh-planilla-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Cálculo de planilla');
  title.id = 'rrhh-planilla-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Calcula una liquidación por trabajador y período usando solo novedades aprobadas y los parámetros vigentes.'
    )
  );
  container.appendChild(header);

  const canCalculate = can(viewer?.role, 'canCalculate');
  if (!canCalculate) {
    const notice = el(
      documentRef,
      'p',
      'rrhh-notice',
      'Tu rol puede revisar el estado del período, pero no calcular planillas.'
    );
    notice.id = 'planilla-permission';
    container.appendChild(notice);
  }

  const periods = listPeriodos().map((row) => row.id);
  let selected = periods[0] || currentPeriodoId();

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const periodLabel = el(documentRef, 'label', null, 'Período a calcular');
  periodLabel.setAttribute('for', 'planilla-periodo');
  toolbar.appendChild(periodLabel);
  const periodInput = input(documentRef, {
    id: 'planilla-periodo',
    type: 'month',
    value: selected
  });
  toolbar.appendChild(periodInput);

  const calculateButton = button(documentRef, {
    id: 'planilla-calcular',
    label: 'Calcular planilla',
    className: 'button button-primary',
    disabled: !canCalculate,
    ariaLabel: 'Calcular la planilla del período seleccionado',
    onClick: () => calculate()
  });
  toolbar.appendChild(calculateButton);
  container.appendChild(toolbar);

  const eligibilityNode = el(documentRef, 'div', 'rrhh-eligibility');
  eligibilityNode.id = 'planilla-eligibility';
  eligibilityNode.setAttribute('role', 'status');
  eligibilityNode.setAttribute('aria-live', 'polite');
  container.appendChild(eligibilityNode);

  const messages = feedback(documentRef, 'planilla-feedback');
  container.appendChild(messages);

  const summaryContainer = el(documentRef, 'div', 'rrhh-summary-container');
  container.appendChild(summaryContainer);

  const resultsContainer = el(documentRef, 'div', 'rrhh-results-container');
  container.appendChild(resultsContainer);

  let selectedRow = null;
  let detailNode = null;
  let detailController = null;

  function renderEligibility() {
    const periodo = getPeriodo(selected);
    const cerrado = isPeriodoCerrado(selected);
    eligibilityNode.textContent = '';
    const info = estadoElegibilidad(selected);
    const rows = listNovedades({ periodo: selected });
    const aprobadas = rows.filter((row) => row.estado === 'aprobada').length;
    const parts = [
      `Período ${etiquetaPeriodo(selected)}: ${periodo?.estado || 'abierto'}`,
      `${aprobadas} novedad(es) aprobada(s)`,
      `${info.pendientes} pendiente(s)`,
      `${info.rechazadas} rechazada(s)`,
      `${info.anuladas || 0} anulada(s)`
    ];
    eligibilityNode.appendChild(el(documentRef, 'p', null, parts.join(' · ')));
    calculateButton.disabled = cerrado || !info.elegible;
    calculateButton.setAttribute(
      'title',
      !info.elegible && !cerrado ? 'Resuelve las novedades pendientes antes de calcular.' : ''
    );
    if (cerrado) {
      eligibilityNode.classList.add('rrhh-eligibility-blocked');
      eligibilityNode.appendChild(
        el(
          documentRef,
          'p',
          null,
          'Período cerrado: no se permite recalcular ni editar liquidaciones.'
        )
      );
    }
    for (const warning of info.advertencias) {
      eligibilityNode.appendChild(el(documentRef, 'p', 'rrhh-warning', warning));
    }
  }

  function expandLiquidacion(liquidacion, row) {
    detailController?.dispose?.();
    detailController = null;
    if (detailNode?.parentNode) detailNode.parentNode.removeChild(detailNode);
    if (selectedRow) selectedRow.classList.remove('rrhh-table-row-selected');
    selectedRow = row;
    row.classList.add('rrhh-table-row-selected');
    detailNode = el(documentRef, 'div', 'rrhh-planilla-detalle');
    detailNode.id = 'planilla-liquidacion-detalle';
    row.after(detailNode);
    detailController = renderLiquidacion(detailNode, liquidacion, {
      doc: documentRef,
      win: documentRef.defaultView,
      viewer,
      empresa: config?.empresa ? { ...config.empresa } : undefined
    });
  }

  function renderResults(result) {
    detailController?.dispose?.();
    detailController = null;
    detailNode = null;
    selectedRow = null;
    resultsContainer.textContent = '';
    const list = el(documentRef, 'div', 'rrhh-table');
    list.id = 'planilla-resultados';
    list.setAttribute('role', 'table');
    list.setAttribute('aria-label', 'Liquidaciones calculadas en el período');
    const head = el(documentRef, 'div', 'rrhh-table-row rrhh-table-head');
    head.setAttribute('role', 'row');
    for (const label of ['Trabajador', 'Haberes', 'Descuentos', 'Líquido', 'Costo empleador']) {
      const cell = el(documentRef, 'span', null, label);
      cell.setAttribute('role', 'columnheader');
      head.appendChild(cell);
    }
    list.appendChild(head);
    for (const liquidacion of result.liquidaciones) {
      const row = el(documentRef, 'div', 'rrhh-table-row');
      row.setAttribute('role', 'row');
      row.tabIndex = 0;
      row.classList.add('rrhh-table-row-selectable');
      row.dataset.liquidacionId = liquidacion.id;
      row.setAttribute(
        'aria-label',
        `Ver la liquidación de ${liquidacion.trabajador?.nombre || 'trabajador'}`
      );
      row.addEventListener('click', () => expandLiquidacion(liquidacion, row));
      row.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        expandLiquidacion(liquidacion, row);
      });
      for (const value of [
        liquidacion.trabajador?.nombre || '—',
        formatMoney(liquidacion.totales?.haberes),
        formatMoney(liquidacion.totales?.descuentos),
        formatMoney(liquidacion.totales?.liquido),
        formatMoney(liquidacion.costoEmpleador)
      ]) {
        const cell = el(documentRef, 'span', 'rrhh-table-cell', value);
        cell.setAttribute('role', 'cell');
        row.appendChild(cell);
      }
      list.appendChild(row);
    }
    resultsContainer.appendChild(list);
    if (result.liquidaciones.length === 0) {
      resultsContainer.appendChild(
        el(
          documentRef,
          'div',
          'empty-state',
          'No se calculó ningún trabajador: revisa contratos vigentes y novedades.'
        )
      );
    }
  }

  function calculate() {
    hideFeedback(messages);
    selected = periodInput.value;
    if (!parsePeriodo(selected)) {
      showFeedback(messages, 'Selecciona un período válido con formato AAAA-MM.', 'error');
      return;
    }
    if (isPeriodoCerrado(selected)) {
      showFeedback(messages, 'El período está cerrado: no se permite recalcular.', 'error');
      return;
    }
    const entities = loadEntities();
    const storedContracts = listContratos({ incluirTerminados: true });
    const contratos =
      storedContracts.length > 0
        ? storedContracts
        : entities.map(contratoDesdeEntidad).filter(Boolean);
    try {
      const result = calcularPeriodo({
        periodo: selected,
        trabajadores: entities,
        contratos,
        viewer
      });
      renderCalculoResumen(summaryContainer, {
        doc: documentRef,
        resumen: result.resumen,
        periodo: result.periodo
      });
      renderResults(result);
      renderEligibility();
      const exclusion = result.trabajadoresExcluidos.length
        ? ` ${result.trabajadoresExcluidos.length} trabajador(es) excluido(s).`
        : '';
      showFeedback(
        messages,
        `Planilla calculada: ${result.liquidaciones.length} liquidación(es).${exclusion}`,
        'ok'
      );
      onNavigate?.('liquidaciones', { periodo: selected });
    } catch (error) {
      const detail = (error.errors || [error.message]).join(' ');
      showFeedback(messages, detail, 'error');
    }
  }

  periodInput.addEventListener('change', () => {
    selected = periodInput.value;
    hideFeedback(messages);
    summaryContainer.textContent = '';
    resultsContainer.textContent = '';
    renderEligibility();
  });

  renderEligibility();
  root.appendChild(container);

  return {
    refresh: renderEligibility,
    dispose() {
      detailController?.dispose?.();
      detailController = null;
      root.textContent = '';
    }
  };
}
