/** Family dependants view (US8): registry, validity and age-limit notices. */

import { listTrabajadores } from '../utils/trabajadores-service.js';
import {
  PARENTESCOS,
  PARENTESCO_LABELS,
  TIPOS_CARGA,
  TIPO_CARGA_LABELS,
  avisosEdadLimite,
  crearCarga,
  finVigencia,
  listCargas,
  puedeGestionarCargas,
  puedeVerCargas,
  terminarCarga
} from '../utils/cargas-service.js';
import { hoyISO } from '../utils/fechas.js';
import { FECHA_MINIMA } from '../utils/limites-fechas.js';
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
  showFeedback
} from '../components/dom.js';

const FIELD_MAP = [
  { key: 'entityId', id: 'carga-trabajador', match: /trabajador/i },
  { key: 'nombre', id: 'carga-nombre', match: /nombre/i },
  { key: 'rut', id: 'carga-rut', match: /RUT|reconocida|registrada/i },
  { key: 'parentesco', id: 'carga-parentesco', match: /parentesco/i },
  { key: 'fechaNacimiento', id: 'carga-nacimiento', match: /nacimiento/i },
  { key: 'tipo', id: 'carga-tipo', match: /tipo de carga/i },
  { key: 'resolucionNumero', id: 'carga-resolucion-numero', match: /número de la resolución/i },
  { key: 'resolucionFecha', id: 'carga-resolucion-fecha', match: /fecha de la resolución/i },
  { key: 'vigenteDesde', id: 'carga-desde', match: /inicio de vigencia/i },
  { key: 'vigenteHasta', id: 'carga-hasta', match: /término/i }
];

export function renderCargasView(root, { doc, viewer, payload } = {}) {
  const documentRef = doc || root.ownerDocument;
  const container = el(documentRef, 'section', 'rrhh-section rrhh-cargas-view');
  container.id = 'rrhh-cargas-view';
  container.setAttribute('aria-labelledby', 'rrhh-cargas-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Cargas familiares');
  title.id = 'rrhh-cargas-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Las cargas reconocidas generan la asignación familiar en la liquidación según el tramo de ingreso del trabajador. Una carga de invalidez cuenta doble.'
    )
  );
  container.appendChild(header);

  if (!puedeVerCargas(viewer)) {
    container.appendChild(
      el(
        documentRef,
        'p',
        'rrhh-notice',
        'Tu rol no tiene autorización para ver cargas familiares: son datos personales de terceros.'
      )
    );
    root.appendChild(container);
    return {
      dispose() {
        root.textContent = '';
      }
    };
  }

  container.appendChild(
    el(
      documentRef,
      'p',
      'rrhh-privacy-notice',
      'Datos personales de terceros: solo los ven RR.HH., remuneraciones y el propio trabajador.'
    )
  );
  const messages = feedback(documentRef, 'cargas-feedback');
  container.appendChild(messages);

  const canManage = puedeGestionarCargas(viewer);
  const esTrabajador = viewer?.role === 'trabajador';
  const trabajadores = canManage ? listTrabajadores({ incluirBaja: true }) : [];
  let filtro = payload?.entityId || '';

  /* ----- Age-limit notices ----- */
  if (canManage) {
    const avisos = avisosEdadLimite();
    const avisosPanel = el(documentRef, 'section', 'panel');
    avisosPanel.setAttribute('aria-labelledby', 'cargas-avisos-title');
    const avisosTitle = el(
      documentRef,
      'h4',
      null,
      'Cargas que dejan de estar vigentes en los próximos 30 días'
    );
    avisosTitle.id = 'cargas-avisos-title';
    avisosPanel.appendChild(avisosTitle);
    const listaAvisos = el(documentRef, 'ul', 'rrhh-alertas-list');
    listaAvisos.id = 'cargas-avisos';
    if (avisos.length === 0) {
      listaAvisos.appendChild(
        el(
          documentRef,
          'li',
          'rrhh-alerta-item rrhh-alerta-vacio',
          'Sin cargas por cumplir la edad límite.'
        )
      );
    }
    for (const aviso of avisos) {
      listaAvisos.appendChild(
        el(
          documentRef,
          'li',
          'rrhh-alerta-item',
          `${aviso.trabajador}: ${aviso.carga} deja de ser carga el ${aviso.fechaFinVigencia}.`
        )
      );
    }
    avisosPanel.appendChild(listaAvisos);
    container.appendChild(avisosPanel);
  }

  /* ----- Registration form ----- */
  if (canManage) {
    const formPanel = el(documentRef, 'section', 'panel');
    formPanel.setAttribute('aria-labelledby', 'cargas-form-title');
    const formTitle = el(documentRef, 'h4', null, 'Registrar carga');
    formTitle.id = 'cargas-form-title';
    formPanel.appendChild(formTitle);
    const form = el(documentRef, 'form', 'rrhh-form');
    form.noValidate = true;
    const grid = el(documentRef, 'div', 'field-grid');
    const controls = {
      entityId: select(documentRef, {
        id: 'carga-trabajador',
        value: filtro,
        options: [
          { value: '', label: 'Selecciona un trabajador' },
          ...trabajadores
            .filter((row) => row.activo)
            .map((row) => ({ value: row.entityId, label: row.name }))
        ]
      }),
      nombre: input(documentRef, { id: 'carga-nombre' }),
      rut: input(documentRef, { id: 'carga-rut', placeholder: '12.345.678-5' }),
      parentesco: select(documentRef, {
        id: 'carga-parentesco',
        options: [
          { value: '', label: 'Selecciona' },
          ...PARENTESCOS.map((value) => ({ value, label: PARENTESCO_LABELS[value] }))
        ]
      }),
      fechaNacimiento: input(documentRef, { id: 'carga-nacimiento', type: 'date' }),
      tipo: select(documentRef, {
        id: 'carga-tipo',
        value: 'simple',
        options: TIPOS_CARGA.map((value) => ({ value, label: TIPO_CARGA_LABELS[value] }))
      }),
      resolucionNumero: input(documentRef, { id: 'carga-resolucion-numero' }),
      resolucionFecha: input(documentRef, { id: 'carga-resolucion-fecha', type: 'date' }),
      vigenteDesde: input(documentRef, { id: 'carga-desde', type: 'date', value: hoyISO() }),
      vigenteHasta: input(documentRef, { id: 'carga-hasta', type: 'date' })
    };
    const labels = {
      entityId: 'Trabajador *',
      nombre: 'Nombre de la carga *',
      rut: 'RUT de la carga *',
      parentesco: 'Parentesco *',
      fechaNacimiento: 'Fecha de nacimiento *',
      tipo: 'Tipo de carga *',
      resolucionNumero: 'N° de resolución de reconocimiento *',
      resolucionFecha: 'Fecha de la resolución *',
      vigenteDesde: 'Vigente desde *',
      vigenteHasta: 'Vigente hasta (opcional)'
    };
    for (const key of ['fechaNacimiento', 'resolucionFecha', 'vigenteDesde']) {
      controls[key].min = FECHA_MINIMA;
      controls[key].max = hoyISO();
    }
    for (const [key, control] of Object.entries(controls)) {
      grid.appendChild(field(documentRef, { id: control.id, label: labels[key], input: control }));
    }
    const estudianteLabel = el(documentRef, 'label', 'rrhh-checkbox');
    const estudiante = input(documentRef, { id: 'carga-estudiante', type: 'checkbox' });
    estudianteLabel.appendChild(estudiante);
    estudianteLabel.appendChild(
      documentRef.createTextNode(' Hijo/a estudiante (carga hasta los 24 años)')
    );
    grid.appendChild(estudianteLabel);
    form.appendChild(grid);
    const actions = el(documentRef, 'div', 'form-actions');
    const submit = el(documentRef, 'button', 'button button-primary', 'Registrar carga');
    submit.type = 'submit';
    submit.id = 'carga-submit';
    actions.appendChild(submit);
    form.appendChild(actions);
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      clearFieldErrors(container);
      hideFeedback(messages);
      const values = Object.fromEntries(
        Object.entries(controls).map(([key, control]) => [key, control.value])
      );
      try {
        crearCarga({ ...values, estudiante: estudiante.checked }, viewer);
        form.reset();
        controls.vigenteDesde.value = hoyISO();
        showFeedback(messages, 'Carga familiar registrada.', 'ok');
        refresh();
      } catch (error) {
        setFieldErrors(container, error.errors || [error.message], FIELD_MAP);
        showFeedback(messages, error.message, 'error');
      }
    });
    formPanel.appendChild(form);
    container.appendChild(formPanel);
  }

  /* ----- List ----- */
  const listPanel = el(documentRef, 'section', 'panel');
  listPanel.setAttribute('aria-labelledby', 'cargas-lista-title');
  const listTitle = el(
    documentRef,
    'h4',
    null,
    esTrabajador ? 'Mis cargas familiares' : 'Cargas registradas'
  );
  listTitle.id = 'cargas-lista-title';
  listPanel.appendChild(listTitle);
  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  if (canManage) {
    const filtroSelect = select(documentRef, {
      id: 'cargas-filtro',
      value: filtro,
      options: [
        { value: '', label: 'Todos los trabajadores' },
        ...trabajadores.map((row) => ({ value: row.entityId, label: row.name }))
      ]
    });
    filtroSelect.addEventListener('change', () => {
      filtro = filtroSelect.value;
      pagination.reset();
      renderList();
    });
    toolbar.appendChild(
      field(documentRef, { id: 'cargas-filtro', label: 'Trabajador', input: filtroSelect })
    );
  }
  const terminadasLabel = el(documentRef, 'label', 'rrhh-checkbox');
  const incluirTerminadas = input(documentRef, {
    id: 'cargas-incluir-terminadas',
    type: 'checkbox'
  });
  terminadasLabel.appendChild(incluirTerminadas);
  terminadasLabel.appendChild(documentRef.createTextNode(' Incluir cargas terminadas'));
  incluirTerminadas.addEventListener('change', () => {
    pagination.reset();
    renderList();
  });
  toolbar.appendChild(terminadasLabel);
  listPanel.appendChild(toolbar);

  const columnas = ['Trabajador', 'Carga', 'RUT', 'Parentesco', 'Tipo', 'Vigencia', 'Estado'];
  if (canManage) columnas.push('Acciones');
  const tabla = crearTabla(documentRef, { id: 'cargas-tabla', columnas });
  listPanel.appendChild(tabla.element);
  const empty = el(documentRef, 'p', 'rrhh-empty', 'No hay cargas familiares para mostrar.');
  empty.id = 'cargas-empty';
  listPanel.appendChild(empty);
  const pagination = createPagination(documentRef, {
    id: 'cargas-pagination',
    onChange: () => renderList()
  });
  listPanel.appendChild(pagination.element);
  container.appendChild(listPanel);

  function accionTerminar(carga) {
    const wrap = el(documentRef, 'div', 'rrhh-row-actions');
    if (!carga.vigente) return wrap;
    const fecha = input(documentRef, {
      id: `carga-termino-${carga.id}`,
      type: 'date',
      value: hoyISO()
    });
    fecha.setAttribute('aria-label', `Fecha de término de ${carga.nombre}`);
    wrap.appendChild(fecha);
    wrap.appendChild(
      button(documentRef, {
        label: 'Terminar',
        className: 'button button-ghost button-small',
        ariaLabel: `Terminar la carga ${carga.nombre}`,
        onClick: () => {
          clearFieldErrors(container);
          hideFeedback(messages);
          try {
            terminarCarga(carga.id, fecha.value, viewer);
            showFeedback(messages, 'Carga terminada; se conserva en el historial.', 'ok');
            refresh();
          } catch (error) {
            setFieldErrors(container, error.errors || [error.message], [
              { key: 'fecha', id: fecha.id, match: /./ }
            ]);
            showFeedback(messages, error.message, 'error');
          }
        }
      })
    );
    return wrap;
  }

  function renderList() {
    let rows;
    try {
      rows = listCargas({
        viewer,
        entityId: canManage ? filtro : '',
        incluirTerminadas: incluirTerminadas.checked
      });
    } catch (error) {
      showFeedback(messages, error.message, 'error');
      rows = [];
    }
    pagination.render(rows.length);
    tabla.tbody.textContent = '';
    empty.hidden = rows.length > 0;
    for (const carga of pagination.slice(rows)) {
      const fin = finVigencia(carga);
      const celdas = [
        carga.trabajador,
        carga.nombre,
        carga.rut,
        PARENTESCO_LABELS[carga.parentesco] || carga.parentesco,
        TIPO_CARGA_LABELS[carga.tipo] || carga.tipo,
        `${carga.vigenteDesde} a ${fin === '9999-12-31' ? 'indefinida' : fin}`,
        badge(
          documentRef,
          carga.vigente ? 'Vigente' : 'Terminada',
          carga.vigente ? 'ok' : 'neutral'
        )
      ];
      if (canManage) celdas.push(accionTerminar(carga));
      agregarFila(documentRef, tabla.tbody, celdas, { dataset: { cargaId: carga.id } });
    }
  }

  function refresh() {
    renderList();
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
