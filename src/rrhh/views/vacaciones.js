/** Vacations view (US7): balance, requests, approval and holiday calendar. */

import { listTrabajadores } from '../utils/trabajadores-service.js';
import {
  ESTADO_VACACION_LABELS,
  alcanceVacaciones,
  anularSolicitud,
  aprobarSolicitud,
  contarDiasHabiles,
  crearSolicitud,
  listSolicitudes,
  puedeAnular,
  puedeResolver,
  puedeSolicitarPara,
  puedeVerVacaciones,
  quitarFeriado,
  rechazarSolicitud,
  registrarFeriado,
  saldoProyectado,
  saldoVacaciones
} from '../utils/vacaciones-service.js';
import { listFeriados, puedeGestionarFeriados } from '../utils/feriados-service.js';
import { esFechaISO } from '../utils/fechas.js';
import { createPagination } from '../components/pagination.js';
import { clearFieldErrors, setFieldErrors } from '../components/feedback.js';
import { agregarFila, crearTabla } from '../components/tabla.js';
import {
  badge,
  button,
  el,
  feedback,
  field,
  hideFeedback,
  input,
  select,
  showFeedback,
  statusTone
} from '../components/dom.js';

function dias(value) {
  return Number(value || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

export function renderVacacionesView(root, { doc, viewer, payload } = {}) {
  const documentRef = doc || root.ownerDocument;
  const container = el(documentRef, 'section', 'rrhh-section rrhh-vacaciones-view');
  container.id = 'rrhh-vacaciones-view';
  container.setAttribute('aria-labelledby', 'rrhh-vacaciones-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Vacaciones');
  title.id = 'rrhh-vacaciones-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Se devengan 1,25 días hábiles por mes completo trabajado, con un máximo de 30 días acumulados. Las solicitudes son por días hábiles completos y las vacaciones aprobadas no descuentan sueldo.'
    )
  );
  container.appendChild(header);

  if (!puedeVerVacaciones(viewer)) {
    container.appendChild(
      el(documentRef, 'p', 'rrhh-notice', 'Tu rol no tiene acceso a las vacaciones.')
    );
    root.appendChild(container);
    return {
      dispose() {
        root.textContent = '';
      }
    };
  }

  const messages = feedback(documentRef, 'vacaciones-feedback');
  container.appendChild(messages);

  const scope = alcanceVacaciones(viewer);
  const visibles = listTrabajadores({ incluirBaja: true }).filter(
    (row) => !scope || scope.includes(String(row.entityId))
  );
  const esTrabajador = viewer?.role === 'trabajador';
  let seleccionado =
    payload?.entityId && visibles.some((row) => row.entityId === payload.entityId)
      ? payload.entityId
      : esTrabajador
        ? String(viewer.trabajadorId || '')
        : visibles.find((row) => row.activo)?.entityId || '';

  /* ----- Worker selector and balance ----- */
  const balancePanel = el(documentRef, 'section', 'panel rrhh-vacaciones-saldo');
  balancePanel.setAttribute('aria-labelledby', 'vacaciones-saldo-title');
  const balanceTitle = el(documentRef, 'h4', null, 'Saldo de vacaciones');
  balanceTitle.id = 'vacaciones-saldo-title';
  balancePanel.appendChild(balanceTitle);

  let workerSelect = null;
  if (!esTrabajador) {
    workerSelect = select(documentRef, {
      id: 'vacaciones-trabajador',
      value: seleccionado,
      options: [
        {
          value: '',
          label: visibles.length ? 'Selecciona un trabajador' : 'Sin trabajadores en tu alcance'
        },
        ...visibles.map((row) => ({
          value: row.entityId,
          label: `${row.name}${row.activo ? '' : ' (desvinculado)'}`
        }))
      ]
    });
    workerSelect.addEventListener('change', () => {
      seleccionado = workerSelect.value;
      pagination.reset();
      refresh();
    });
    balancePanel.appendChild(
      field(documentRef, { id: 'vacaciones-trabajador', label: 'Trabajador', input: workerSelect })
    );
  }
  const balanceBody = el(documentRef, 'div', 'rrhh-summary-grid');
  balanceBody.id = 'vacaciones-saldo';
  balancePanel.appendChild(balanceBody);
  container.appendChild(balancePanel);

  /* ----- Request form ----- */
  const formPanel = el(documentRef, 'section', 'panel');
  formPanel.setAttribute('aria-labelledby', 'vacaciones-form-title');
  const formTitle = el(documentRef, 'h4', null, 'Nueva solicitud');
  formTitle.id = 'vacaciones-form-title';
  formPanel.appendChild(formTitle);
  const form = el(documentRef, 'form', 'rrhh-form');
  form.noValidate = true;
  const grid = el(documentRef, 'div', 'field-grid');
  const inicioInput = input(documentRef, { id: 'vacaciones-inicio', type: 'date' });
  const finInput = input(documentRef, { id: 'vacaciones-fin', type: 'date' });
  const obsInput = input(documentRef, { id: 'vacaciones-observacion' });
  grid.appendChild(
    field(documentRef, { id: 'vacaciones-inicio', label: 'Fecha de inicio *', input: inicioInput })
  );
  grid.appendChild(
    field(documentRef, { id: 'vacaciones-fin', label: 'Fecha de término *', input: finInput })
  );
  grid.appendChild(
    field(documentRef, {
      id: 'vacaciones-observacion',
      label: 'Observación',
      input: obsInput,
      wide: true
    })
  );
  form.appendChild(grid);
  const preview = el(documentRef, 'p', 'field-help');
  preview.id = 'vacaciones-preview';
  preview.setAttribute('aria-live', 'polite');
  form.appendChild(preview);
  const actions = el(documentRef, 'div', 'form-actions');
  const submit = el(documentRef, 'button', 'button button-primary', 'Registrar solicitud');
  submit.type = 'submit';
  submit.id = 'vacaciones-submit';
  actions.appendChild(submit);
  form.appendChild(actions);
  formPanel.appendChild(form);
  container.appendChild(formPanel);

  const fieldMap = [
    {
      key: 'inicio',
      id: inicioInput.id,
      match: /inicio|saldo|máximo|superpone|contrato|desvinculado|hábiles/i
    },
    { key: 'fin', id: finInput.id, match: /término/i },
    { key: 'trabajador', id: workerSelect?.id || inicioInput.id, match: /trabajador|autorización/i }
  ];

  function updatePreview() {
    const inicio = inicioInput.value;
    const fin = finInput.value;
    if (!seleccionado || !esFechaISO(inicio)) {
      preview.textContent = '';
      return;
    }
    const proyectado = saldoProyectado(seleccionado, inicio);
    const habiles = esFechaISO(fin) && fin >= inicio ? contarDiasHabiles(inicio, fin) : null;
    preview.textContent = `${habiles === null ? '' : `${habiles} día(s) hábil(es). `}Saldo proyectado al ${proyectado.fecha}: ${dias(proyectado.disponible)} día(s); puedes solicitar hasta ${proyectado.solicitable} día(s) completo(s).`;
  }
  inicioInput.addEventListener('change', updatePreview);
  finInput.addEventListener('change', updatePreview);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    clearFieldErrors(container);
    hideFeedback(messages);
    try {
      crearSolicitud(
        {
          entityId: seleccionado,
          fechaInicio: inicioInput.value,
          fechaFin: finInput.value,
          observacion: obsInput.value
        },
        viewer
      );
      form.reset();
      preview.textContent = '';
      showFeedback(messages, 'Solicitud registrada en estado Pendiente.', 'ok');
      refresh();
    } catch (error) {
      setFieldErrors(container, error.errors || [error.message], fieldMap);
      showFeedback(messages, error.message, 'error');
    }
  });

  /* ----- Requests list ----- */
  const listPanel = el(documentRef, 'section', 'panel');
  listPanel.setAttribute('aria-labelledby', 'vacaciones-lista-title');
  const listTitle = el(documentRef, 'h4', null, 'Solicitudes');
  listTitle.id = 'vacaciones-lista-title';
  listPanel.appendChild(listTitle);
  const tabla = crearTabla(documentRef, {
    id: 'vacaciones-tabla',
    columnas: ['Trabajador', 'Desde', 'Hasta', 'Días hábiles', 'Estado', 'Acciones']
  });
  listPanel.appendChild(tabla.element);
  const empty = el(
    documentRef,
    'p',
    'rrhh-empty',
    'No hay solicitudes de vacaciones para mostrar.'
  );
  empty.id = 'vacaciones-empty';
  listPanel.appendChild(empty);
  const pagination = createPagination(documentRef, {
    id: 'vacaciones-pagination',
    onChange: () => renderList()
  });
  listPanel.appendChild(pagination.element);
  container.appendChild(listPanel);

  /* ----- Holiday calendar ----- */
  const feriadosPanel = el(documentRef, 'section', 'panel');
  feriadosPanel.setAttribute('aria-labelledby', 'feriados-title');
  const feriadosTitle = el(documentRef, 'h4', null, 'Calendario de feriados');
  feriadosTitle.id = 'feriados-title';
  feriadosPanel.appendChild(feriadosTitle);
  const canHolidays = puedeGestionarFeriados(viewer);
  let feriadoFecha = null;
  let feriadoNombre = null;
  if (canHolidays) {
    const feriadoForm = el(documentRef, 'form', 'rrhh-toolbar');
    feriadoForm.noValidate = true;
    feriadoFecha = input(documentRef, { id: 'feriado-fecha', type: 'date' });
    feriadoNombre = input(documentRef, { id: 'feriado-nombre' });
    feriadoForm.appendChild(
      field(documentRef, { id: 'feriado-fecha', label: 'Fecha', input: feriadoFecha })
    );
    feriadoForm.appendChild(
      field(documentRef, { id: 'feriado-nombre', label: 'Nombre', input: feriadoNombre })
    );
    const add = el(documentRef, 'button', 'button button-secondary', 'Agregar feriado');
    add.type = 'submit';
    add.id = 'feriado-agregar';
    feriadoForm.appendChild(add);
    feriadoForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFieldErrors(container);
      hideFeedback(messages);
      try {
        registrarFeriado({ fecha: feriadoFecha.value, nombre: feriadoNombre.value }, viewer);
        feriadoForm.reset();
        showFeedback(
          messages,
          'Feriado agregado; las solicitudes aprobadas que lo incluyen se recalcularon.',
          'ok'
        );
        refresh();
      } catch (error) {
        setFieldErrors(container, error.errors || [error.message], [
          { key: 'fecha', id: feriadoFecha.id, match: /fecha|existe/i },
          { key: 'nombre', id: feriadoNombre.id, match: /nombre/i }
        ]);
        showFeedback(messages, error.message, 'error');
      }
    });
    feriadosPanel.appendChild(feriadoForm);
  }
  const feriadosTabla = crearTabla(documentRef, {
    id: 'feriados-tabla',
    columnas: canHolidays ? ['Fecha', 'Nombre', 'Acciones'] : ['Fecha', 'Nombre']
  });
  feriadosPanel.appendChild(feriadosTabla.element);
  container.appendChild(feriadosPanel);

  /* ----- Rendering ----- */
  function renderBalance() {
    balanceBody.textContent = '';
    if (!seleccionado) {
      balanceBody.appendChild(
        el(
          documentRef,
          'p',
          'rrhh-empty',
          esTrabajador
            ? 'Tu sesión no tiene un trabajador asociado.'
            : 'Selecciona un trabajador para ver su saldo.'
        )
      );
      return;
    }
    const saldo = saldoVacaciones(seleccionado);
    if (!saldo) return;
    const items = [
      ['Días devengados', dias(saldo.devengados)],
      ['Días aprobados', dias(saldo.aprobados)],
      ['Saldo disponible hoy', dias(saldo.disponible)],
      ['Puede solicitar', `${saldo.solicitable} día(s) completo(s)`]
    ];
    for (const [label, value] of items) {
      const card = el(documentRef, 'div', 'rrhh-summary-card');
      card.appendChild(el(documentRef, 'span', 'panel-copy', label));
      card.appendChild(el(documentRef, 'strong', null, value));
      balanceBody.appendChild(card);
    }
    if (saldo.alMaximo) {
      balanceBody.appendChild(
        el(
          documentRef,
          'p',
          'rrhh-warning',
          'El saldo llegó al máximo legal de 30 días: conviene planificar vacaciones.'
        )
      );
    }
    if (saldo.congelado) {
      balanceBody.appendChild(
        el(
          documentRef,
          'p',
          'rrhh-notice',
          'Trabajador desvinculado: el saldo queda congelado solo para consulta.'
        )
      );
    }
  }

  function accionesFila(solicitud) {
    const wrap = el(documentRef, 'div', 'rrhh-row-actions');
    if (solicitud.estado === 'pendiente' && puedeResolver(solicitud, viewer)) {
      wrap.appendChild(
        button(documentRef, {
          label: 'Aprobar',
          className: 'button button-primary button-small',
          ariaLabel: `Aprobar vacaciones de ${solicitud.trabajador}`,
          onClick: () =>
            ejecutar(
              () => aprobarSolicitud(solicitud.id, viewer),
              'Solicitud aprobada; los días se descontaron del saldo.'
            )
        })
      );
      const motivo = input(documentRef, {
        id: `vacacion-motivo-${solicitud.id}`,
        placeholder: 'Motivo del rechazo'
      });
      motivo.setAttribute('aria-label', `Motivo del rechazo para ${solicitud.trabajador}`);
      wrap.appendChild(motivo);
      wrap.appendChild(
        button(documentRef, {
          label: 'Rechazar',
          className: 'button button-secondary button-small',
          ariaLabel: `Rechazar vacaciones de ${solicitud.trabajador}`,
          onClick: () =>
            ejecutar(
              () => rechazarSolicitud(solicitud.id, viewer, motivo.value),
              'Solicitud rechazada.',
              [{ key: 'motivo', id: motivo.id, match: /motivo/i }]
            )
        })
      );
    }
    if (puedeAnular(solicitud, viewer)) {
      wrap.appendChild(
        button(documentRef, {
          label: 'Anular',
          className: 'button button-ghost button-small',
          ariaLabel: `Anular vacaciones de ${solicitud.trabajador}`,
          onClick: () =>
            ejecutar(
              () => anularSolicitud(solicitud.id, viewer),
              'Solicitud anulada; los días volvieron al saldo.'
            )
        })
      );
    }
    if (solicitud.estado === 'rechazada' && solicitud.motivoRechazo) {
      wrap.appendChild(
        el(documentRef, 'span', 'rrhh-rejection-reason', `Motivo: ${solicitud.motivoRechazo}`)
      );
    }
    return wrap;
  }

  function ejecutar(fn, okMessage, map = []) {
    clearFieldErrors(container);
    hideFeedback(messages);
    try {
      fn();
      showFeedback(messages, okMessage, 'ok');
      refresh();
    } catch (error) {
      if (map.length) setFieldErrors(container, error.errors || [error.message], map);
      showFeedback(messages, error.message, 'error');
    }
  }

  function renderList() {
    const rows = listSolicitudes({ viewer, entityId: esTrabajador ? '' : seleccionado || '' });
    pagination.render(rows.length);
    tabla.tbody.textContent = '';
    empty.hidden = rows.length > 0;
    for (const solicitud of pagination.slice(rows)) {
      agregarFila(
        documentRef,
        tabla.tbody,
        [
          solicitud.trabajador,
          solicitud.fechaInicio,
          solicitud.fechaFin,
          solicitud.diasHabiles,
          badge(
            documentRef,
            ESTADO_VACACION_LABELS[solicitud.estado] || solicitud.estado,
            statusTone(solicitud.estado)
          ),
          accionesFila(solicitud)
        ],
        { dataset: { solicitudId: solicitud.id } }
      );
    }
  }

  function renderFeriados() {
    feriadosTabla.tbody.textContent = '';
    for (const feriado of listFeriados()) {
      const celdas = [feriado.fecha, feriado.nombre];
      if (canHolidays) {
        celdas.push(
          button(documentRef, {
            label: 'Quitar',
            className: 'button button-ghost button-small',
            ariaLabel: `Quitar el feriado ${feriado.nombre}`,
            onClick: () =>
              ejecutar(() => quitarFeriado(feriado.id, viewer), 'Feriado quitado del calendario.')
          })
        );
      }
      agregarFila(documentRef, feriadosTabla.tbody, celdas);
    }
  }

  function refresh() {
    const puedeSolicitar = Boolean(seleccionado) && puedeSolicitarPara(viewer, seleccionado);
    formPanel.hidden = !puedeSolicitar;
    renderBalance();
    renderList();
    renderFeriados();
    updatePreview();
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
