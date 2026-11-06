/** Novedad registration form with full privacy guard (no clinical fields). */

import {
  TIPOS_NOVEDAD,
  TIPO_NOVEDAD_LABELS,
  UNIDAD_POR_TIPO,
  validarNovedad
} from '../utils/novedades-data.js';
import { crearNovedad, actualizarNovedad, reenviarNovedad } from '../utils/novedades-service.js';
import { loadEntities } from '../../storage.js';
import { rangoPeriodo } from '../utils/periodos.js';
import { currentPeriodoId, el, feedback, hideFeedback, input, select, showFeedback } from './dom.js';

function entitiesForOptions(viewer) {
  try {
    const entities = loadEntities();
    if (viewer?.role === 'jefatura' && Array.isArray(viewer.equipo)) {
      const team = new Set(viewer.equipo.map((value) => String(value)));
      return entities.filter((entity) => team.has(String(entity.entity_id || entity.id)));
    }
    return entities;
  } catch {
    return [];
  }
}

function optionsForEntities(entities) {
  return entities.map((entity) => ({
    value: entity.entity_id || entity.id,
    label: `${entity.name}${entity.code ? ` — ${entity.code}` : ''}`
  }));
}

/**
 * Render the novedad form.
 *
 * @returns {{ edit: Function, reset: Function, setPeriodo: Function, getValues: Function }}
 */
export function renderNovedadForm(root, { doc, viewer, periodo, onSaved } = {}) {
  const documentRef = doc || root.ownerDocument;
  let editing = null;
  let entities = entitiesForOptions(viewer);

  const form = el(documentRef, 'form', 'panel form-panel rrhh-novedad-form');
  form.id = 'novedad-form';
  form.noValidate = true;
  form.setAttribute('aria-labelledby', 'novedad-form-title');

  const header = el(documentRef, 'div', 'panel-header');
  const title = el(documentRef, 'h4', null, 'Registrar novedad');
  title.id = 'novedad-form-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Solo se almacena el tipo y la cantidad. No se permiten diagnósticos, códigos CIE ni detalles clínicos.'
    )
  );
  form.appendChild(header);

  const fields = el(documentRef, 'div', 'field-grid');

  const workerSelect = select(documentRef, {
    id: 'novedad-trabajador',
    options: [{ value: '', label: 'Selecciona un trabajador' }, ...optionsForEntities(entities)]
  });
  fields.appendChild(fieldWrapper(documentRef, 'novedad-trabajador', 'Trabajador *', workerSelect, true));

  const periodInput = input(documentRef, {
    id: 'novedad-periodo',
    type: 'month',
    value: periodo || currentPeriodoId()
  });
  fields.appendChild(fieldWrapper(documentRef, 'novedad-periodo', 'Período *', periodInput));

  const typeSelect = select(documentRef, {
    id: 'novedad-tipo',
    options: [
      { value: '', label: 'Selecciona un tipo' },
      ...TIPOS_NOVEDAD.map((tipo) => ({ value: tipo, label: TIPO_NOVEDAD_LABELS[tipo] }))
    ]
  });
  fields.appendChild(fieldWrapper(documentRef, 'novedad-tipo', 'Tipo *', typeSelect));

  const quantityInput = input(documentRef, {
    id: 'novedad-cantidad',
    type: 'number',
    min: 0,
    step: 0.5
  });
  fields.appendChild(fieldWrapper(documentRef, 'novedad-cantidad', 'Cantidad (horas o días) *', quantityInput));

  const startInput = input(documentRef, { id: 'novedad-fecha-inicio', type: 'date' });
  fields.appendChild(fieldWrapper(documentRef, 'novedad-fecha-inicio', 'Fecha de inicio *', startInput));

  const endInput = input(documentRef, { id: 'novedad-fecha-fin', type: 'date' });
  fields.appendChild(fieldWrapper(documentRef, 'novedad-fecha-fin', 'Fecha de fin *', endInput));

  const observationField = fieldWrapper(
    documentRef,
    'novedad-observacion',
    'Observación no clínica',
    (() => {
      const textarea = el(documentRef, 'textarea');
      textarea.id = 'novedad-observacion';
      textarea.name = 'novedad-observacion';
      textarea.rows = 2;
      textarea.maxLength = 500;
      return textarea;
    })(),
    true
  );
  fields.appendChild(observationField);
  form.appendChild(fields);

  const privacy = el(
    documentRef,
    'p',
    'rrhh-privacy-notice',
    'Aviso de privacidad (Ley 21.719): una licencia médica se registra únicamente como tipo y días. Los campos clínicos se rechazan y la observación se descarta.'
  );
  privacy.id = 'novedad-privacy';
  form.appendChild(privacy);

  const errorsNode = feedback(documentRef, 'novedad-form-errors', 'field-error rrhh-form-errors');
  form.appendChild(errorsNode);

  const actions = el(documentRef, 'div', 'form-actions');
  const submit = el(documentRef, 'button', 'button button-primary', 'Registrar novedad');
  submit.type = 'submit';
  submit.id = 'novedad-submit';
  actions.appendChild(submit);
  const cancel = el(documentRef, 'button', 'button button-secondary', 'Cancelar edición');
  cancel.type = 'button';
  cancel.id = 'novedad-cancel';
  cancel.hidden = true;
  cancel.addEventListener('click', () => reset());
  actions.appendChild(cancel);
  form.appendChild(actions);

  function fieldWrapper(documentNode, id, labelText, control, wide = false) {
    const wrapper = el(documentNode, 'div', `field${wide ? ' field-wide' : ''}`);
    const label = el(documentNode, 'label', null, labelText);
    label.setAttribute('for', id);
    wrapper.appendChild(label);
    wrapper.appendChild(control);
    return wrapper;
  }

  function updateUnitHint() {
    const tipo = typeSelect.value;
    const unit = UNIDAD_POR_TIPO[tipo];
    quantityInput.placeholder = unit ? `Cantidad en ${unit}` : '';
    quantityInput.step = tipo === 'horas_extra' ? '0.5' : '1';
    observationField.hidden = tipo === 'licencia_medica';
    if (tipo === 'licencia_medica') observationField.querySelector('textarea').value = '';
  }

  function fillDates(value) {
    const range = rangoPeriodo(value);
    if (range.fechaInicio && !startInput.value) startInput.value = range.fechaInicio;
    if (range.fechaFin && !endInput.value) endInput.value = range.fechaFin;
  }

  typeSelect.addEventListener('change', updateUnitHint);
  periodInput.addEventListener('change', () => fillDates(periodInput.value));

  function getValues() {
    const tipo = typeSelect.value;
    return {
      trabajadorEntityId: workerSelect.value,
      periodo: periodInput.value,
      tipo,
      cantidad: Number(quantityInput.value),
      fechaInicio: startInput.value,
      fechaFin: endInput.value,
      observacion: tipo === 'licencia_medica' ? '' : observationField.querySelector('textarea').value,
      estado: editing?.estado || 'pendiente'
    };
  }

  function setValues(novedad = {}) {
    workerSelect.value = novedad.trabajadorEntityId || '';
    periodInput.value = novedad.periodo || currentPeriodoId();
    typeSelect.value = novedad.tipo || '';
    quantityInput.value = novedad.cantidad ?? '';
    startInput.value = novedad.fechaInicio || '';
    endInput.value = novedad.fechaFin || '';
    observationField.querySelector('textarea').value =
      novedad.tipo === 'licencia_medica' ? '' : novedad.observacion || '';
    updateUnitHint();
  }

  function reset() {
    editing = null;
    form.reset();
    typeSelect.value = '';
    workerSelect.value = '';
    periodInput.value = periodo || currentPeriodoId();
    quantityInput.value = '';
    hideFeedback(errorsNode);
    observationField.hidden = false;
    cancel.hidden = true;
    submit.textContent = 'Registrar novedad';
    title.textContent = 'Registrar novedad';
    fillDates(periodInput.value);
  }

  function edit(novedad) {
    editing = novedad;
    entities = entitiesForOptions();
    workerSelect.textContent = '';
    const placeholder = el(documentRef, 'option', null, 'Selecciona un trabajador');
    placeholder.value = '';
    workerSelect.appendChild(placeholder);
    for (const option of optionsForEntities(entities)) {
      const node = el(documentRef, 'option', null, option.label);
      node.value = option.value;
      workerSelect.appendChild(node);
    }
    setValues(novedad);
    cancel.hidden = false;
    submit.textContent = 'Guardar corrección y reenviar';
    title.textContent = 'Corregir novedad rechazada';
    form.scrollIntoView?.({ block: 'nearest' });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideFeedback(errorsNode);
    const values = getValues();
    const validation = validarNovedad(
      { ...values, unidad: UNIDAD_POR_TIPO[values.tipo] },
      { entities }
    );
    if (!validation.valid) {
      showFeedback(errorsNode, validation.errors.join(' '), 'error');
      return;
    }
    try {
      if (editing) {
        const updated = actualizarNovedad(editing.id, values, viewer);
        if (updated.estado === 'rechazada') reenviarNovedad(editing.id, {}, viewer);
        showFeedback(errorsNode, 'Novedad corregida y reenviada para aprobación.', 'ok');
      } else {
        crearNovedad(values, viewer);
        showFeedback(errorsNode, 'Novedad registrada en estado pendiente.', 'ok');
      }
      reset();
      onSaved?.();
    } catch (error) {
      const messages = error.errors || [error.message];
      showFeedback(errorsNode, messages.join(' '), 'error');
    }
  });

  fillDates(periodInput.value);
  updateUnitHint();
  root.appendChild(form);

  return {
    edit,
    reset,
    setPeriodo(value) {
      periodInput.value = value || currentPeriodoId();
      fillDates(periodInput.value);
    },
    getValues,
    element: form
  };
}
