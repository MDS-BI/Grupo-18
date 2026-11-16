/** Novedades view: registration, approval, rejection and resubmission. */

import { loadEntities } from '../../storage.js';
import {
  aprobarNovedad,
  listNovedades,
  rechazarNovedad,
  resumenPeriodo
} from '../utils/novedades-service.js';
import { TIPO_NOVEDAD_LABELS } from '../utils/novedades-data.js';
import { getPeriodo, isPeriodoCerrado, listPeriodos } from '../utils/periodos-service.js';
import { etiquetaPeriodo, parsePeriodo } from '../utils/periodos.js';
import { renderNovedadForm } from '../components/novedad-form.js';
import { renderNovedadList } from '../components/novedad-list.js';
import { can } from '../seguridad/roles.js';
import {
  currentPeriodoId,
  el,
  feedback,
  hideFeedback,
  select,
  showFeedback
} from '../components/dom.js';

function loadEntitiesSafe() {
  try {
    return loadEntities();
  } catch {
    return [];
  }
}

function availablePeriods() {
  const values = new Set();
  for (const periodo of listPeriodos()) {
    if (parsePeriodo(periodo.id)) values.add(periodo.id);
  }
  for (const novedad of listNovedades()) {
    if (parsePeriodo(novedad.periodo)) values.add(novedad.periodo);
  }
  values.add(currentPeriodoId());
  return [...values].sort((a, b) => b.localeCompare(a));
}

function isJefatura(viewer) {
  return viewer?.role === 'jefatura';
}

function visibleNovedades(viewer, periodo) {
  const rows = listNovedades({ periodo });
  if (!isJefatura(viewer)) return rows;
  const team = new Set(Array.isArray(viewer.equipo) ? viewer.equipo : []);
  return rows.filter((row) => team.has(row.trabajadorEntityId));
}

function summarizeRows(rows) {
  const porEstado = { pendiente: 0, aprobada: 0, rechazada: 0 };
  for (const row of rows) {
    if (porEstado[row.estado] !== undefined) porEstado[row.estado] += 1;
  }
  return {
    total: rows.length,
    pendientes: porEstado.pendiente,
    aprobadas: porEstado.aprobada,
    rechazadas: porEstado.rechazada,
    porEstado
  };
}

export function renderNovedadesView(root, { doc, viewer, initialPeriodo } = {}) {
  const documentRef = doc || root.ownerDocument;
  const allowed =
    can(viewer?.role, 'canRegisterNovedades') ||
    can(viewer?.role, 'canApproveNovedades') ||
    can(viewer?.role, 'canEditNovedades');

  if (!allowed) {
    const denied = el(documentRef, 'div', 'rrhh-access-denied panel');
    denied.setAttribute('role', 'alert');
    denied.appendChild(el(documentRef, 'h3', null, 'Acceso denegado'));
    denied.appendChild(
      el(
        documentRef,
        'p',
        null,
        'Tu rol no tiene permiso para consultar ni gestionar novedades del personal.'
      )
    );
    root.appendChild(denied);
    return { refresh() {}, dispose() {} };
  }

  const container = el(documentRef, 'section', 'rrhh-section rrhh-novedades-view');
  container.id = 'rrhh-novedades-view';
  container.setAttribute('aria-labelledby', 'rrhh-novedades-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Novedades del personal');
  title.id = 'rrhh-novedades-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Horas extra, licencias médicas y ausencias. Solo las novedades aprobadas se usan en el cálculo de planilla.'
    )
  );
  container.appendChild(header);

  const periods = availablePeriods();
  let selected = periods.includes(initialPeriodo) ? initialPeriodo : periods[0];

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const periodLabel = el(documentRef, 'label', null, 'Período');
  periodLabel.setAttribute('for', 'novedades-periodo');
  toolbar.appendChild(periodLabel);
  const periodSelect = select(documentRef, {
    id: 'novedades-periodo',
    options: periods.map((value) => ({ value, label: etiquetaPeriodo(value) })),
    value: selected
  });
  toolbar.appendChild(periodSelect);
  const periodState = el(documentRef, 'span', 'rrhh-period-state');
  toolbar.appendChild(periodState);
  container.appendChild(toolbar);

  if (isJefatura(viewer)) {
    const teamNotice = el(
      documentRef,
      'p',
      'rrhh-notice',
      'Como Jefatura solo ves las novedades de tu equipo. No tienes acceso a liquidaciones ni sueldos base.'
    );
    teamNotice.id = 'novedades-team-scope';
    container.appendChild(teamNotice);
  }

  const summary = el(documentRef, 'div', 'rrhh-summary-grid');
  summary.id = 'novedades-summary';
  summary.setAttribute('aria-live', 'polite');
  container.appendChild(summary);

  const eligibility = el(documentRef, 'div', 'rrhh-eligibility');
  eligibility.id = 'novedades-eligibility';
  eligibility.setAttribute('role', 'status');
  eligibility.setAttribute('aria-live', 'polite');
  container.appendChild(eligibility);

  const messages = feedback(documentRef, 'novedades-feedback');
  container.appendChild(messages);

  const formContainer = el(documentRef, 'div', 'rrhh-form-container');
  container.appendChild(formContainer);

  const listHeading = el(documentRef, 'h4', null, 'Listado de novedades');
  container.appendChild(listHeading);
  const listContainer = el(documentRef, 'div', 'rrhh-list-container');
  container.appendChild(listContainer);

  const canRegister = can(viewer?.role, 'canRegisterNovedades');
  let form = null;
  if (canRegister) {
    form = renderNovedadForm(formContainer, {
      doc: documentRef,
      viewer,
      periodo: selected,
      onSaved: () => refresh()
    });
  } else {
    formContainer.appendChild(
      el(documentRef, 'p', 'rrhh-notice', 'Tu rol puede revisar novedades, pero no registrarlas.')
    );
  }

  root.appendChild(container);

  function renderSummary(rows) {
    summary.textContent = '';
    const totals = summarizeRows(rows);
    const cards = [
      ['Pendientes', totals.pendientes],
      ['Aprobadas', totals.aprobadas],
      ['Rechazadas', totals.rechazadas]
    ];
    for (const [label, value] of cards) {
      const card = el(documentRef, 'div', 'rrhh-summary-card');
      card.appendChild(el(documentRef, 'span', 'panel-copy', label));
      card.appendChild(el(documentRef, 'strong', null, String(value)));
      summary.appendChild(card);
    }
    const byType = el(documentRef, 'div', 'rrhh-summary-card rrhh-summary-wide');
    byType.appendChild(el(documentRef, 'span', 'panel-copy', 'Tipos en el período'));
    byType.appendChild(
      el(
        documentRef,
        'span',
        null,
        Object.entries(TIPO_NOVEDAD_LABELS)
          .map(([tipo, label]) => `${label}: ${rows.filter((row) => row.tipo === tipo).length}`)
          .join(' · ')
      )
    );
    summary.appendChild(byType);
  }

  function renderEligibility(rows) {
    const totals = summarizeRows(rows);
    eligibility.textContent = '';
    if (totals.pendientes > 0 || totals.rechazadas > 0) {
      eligibility.classList.add('rrhh-eligibility-blocked');
      eligibility.appendChild(
        el(
          documentRef,
          'p',
          null,
          `Procesamiento posterior bloqueado: ${totals.pendientes} pendiente(s) y ${totals.rechazadas} rechazada(s). Resuelve las novedades antes de calcular la planilla.`
        )
      );
    } else {
      eligibility.classList.remove('rrhh-eligibility-blocked');
      eligibility.appendChild(
        el(
          documentRef,
          'p',
          null,
          'Todas las novedades del período están aprobadas: son elegibles para el cálculo.'
        )
      );
    }
  }

  function refresh() {
    const periodo = selected;
    const cerrado = isPeriodoCerrado(periodo);
    periodState.textContent = cerrado ? 'Cerrado · solo lectura' : 'Abierto · editable';
    periodState.dataset.estado = cerrado ? 'cerrado' : 'abierto';
    const rows = visibleNovedades(viewer, periodo);
    renderSummary(rows);
    renderEligibility(rows);
    renderNovedadList(listContainer, {
      doc: documentRef,
      viewer,
      novedades: rows,
      entities: loadEntitiesSafe(),
      periodoAbierto: !cerrado,
      onApprove: (id) => act(() => aprobarNovedad(id, viewer), 'Novedad aprobada.'),
      onReject: (id, motivo) => {
        if (!String(motivo || '').trim()) {
          showFeedback(messages, 'El rechazo requiere un motivo.', 'error');
          return;
        }
        act(() => rechazarNovedad(id, viewer, motivo), 'Novedad rechazada con motivo.');
      },
      onCorrect: (novedad) => {
        if (!form) {
          showFeedback(messages, 'Tu rol no puede corregir novedades.', 'error');
          return;
        }
        form.edit(novedad);
        showFeedback(messages, 'Corrige los datos y guarda para reenviar la novedad.', 'info');
      }
    });
    form?.setPeriodo(periodo);
  }

  function act(operation, successMessage) {
    hideFeedback(messages);
    try {
      operation();
      showFeedback(messages, successMessage, 'ok');
      refresh();
    } catch (error) {
      const detail = (error.errors || [error.message]).join(' ');
      showFeedback(messages, detail, 'error');
    }
  }

  periodSelect.addEventListener('change', () => {
    selected = periodSelect.value;
    hideFeedback(messages);
    refresh();
  });

  refresh();

  return {
    refresh,
    getPeriodo() {
      return selected;
    },
    dispose() {
      root.textContent = '';
    }
  };
}

export { resumenPeriodo, getPeriodo };
