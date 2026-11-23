/** Contract form used for new contracts and contract edits. */

import {
  MODALIDADES_GRATIFICACION,
  MODALIDAD_GRATIFICACION_LABELS,
  TIPOS_CONTRATO,
  TIPO_CONTRATO_LABELS,
  actualizarContrato,
  crearContrato,
  registrarCambioSueldo
} from '../utils/contratos-service.js';
import { el, feedback, hideFeedback, input, select, showFeedback } from './dom.js';

function workerOptions(trabajadores = []) {
  return [
    { value: '', label: 'Selecciona un trabajador' },
    ...trabajadores.map((row) => ({
      value: row.entityId,
      label: `${row.name}${row.code ? ` (${row.code})` : ''}`
    }))
  ];
}

function errorMessages(error) {
  if (!error) return ['No se pudo guardar el contrato.'];
  if (Array.isArray(error.errors)) return error.errors;
  if (error.errors && typeof error.errors === 'object') return Object.values(error.errors);
  return [error.message];
}

export function renderContratoForm(root, { doc, viewer, trabajadores, contrato, onSaved } = {}) {
  const documentRef = doc || root.ownerDocument;
  let editing = contrato || null;
  let cambioSueldo = false;

  const form = el(documentRef, 'form', 'panel form-panel rrhh-contrato-form');
  form.id = 'contrato-form';
  form.noValidate = true;

  const header = el(documentRef, 'div', 'panel-header');
  const title = el(documentRef, 'h4', null, 'Registrar contrato');
  title.id = 'contrato-form-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'El contrato vigente alimenta el cálculo de planilla. Un cambio de sueldo cierra el contrato anterior y crea uno nuevo.'
    )
  );
  form.appendChild(header);

  const hiddenId = input(documentRef, { id: 'contrato-id', type: 'hidden' });
  form.appendChild(hiddenId);

  const fields = el(documentRef, 'div', 'field-grid');

  const workerSelect = select(documentRef, {
    id: 'contrato-entityId',
    options: workerOptions(trabajadores)
  });
  fields.appendChild(wrap(documentRef, 'contrato-entityId', 'Trabajador *', workerSelect, true));

  const tipoSelect = select(documentRef, {
    id: 'contrato-tipoContrato',
    options: TIPOS_CONTRATO.map((value) => ({ value, label: TIPO_CONTRATO_LABELS[value] })),
    value: 'indefinido'
  });
  fields.appendChild(wrap(documentRef, 'contrato-tipoContrato', 'Tipo de contrato *', tipoSelect));

  const sueldoInput = input(documentRef, {
    id: 'contrato-sueldoBase',
    type: 'number',
    min: 0,
    step: 1,
    placeholder: '0'
  });
  fields.appendChild(wrap(documentRef, 'contrato-sueldoBase', 'Sueldo base *', sueldoInput));

  const jornadaInput = input(documentRef, {
    id: 'contrato-jornadaHorasSemanales',
    type: 'number',
    min: 1,
    max: 45,
    step: 1,
    value: '42'
  });
  fields.appendChild(
    wrap(documentRef, 'contrato-jornadaHorasSemanales', 'Jornada semanal (horas) *', jornadaInput)
  );

  const inicioInput = input(documentRef, { id: 'contrato-fechaInicio', type: 'date' });
  fields.appendChild(wrap(documentRef, 'contrato-fechaInicio', 'Fecha de inicio *', inicioInput));

  const terminoInput = input(documentRef, { id: 'contrato-fechaTermino', type: 'date' });
  fields.appendChild(wrap(documentRef, 'contrato-fechaTermino', 'Fecha de término', terminoInput));

  const modalidadSelect = select(documentRef, {
    id: 'contrato-modalidadGratificacion',
    options: MODALIDADES_GRATIFICACION.map((value) => ({
      value,
      label: MODALIDAD_GRATIFICACION_LABELS[value]
    })),
    value: 'art50'
  });
  fields.appendChild(
    wrap(documentRef, 'contrato-modalidadGratificacion', 'Gratificación', modalidadSelect)
  );

  const colacionInput = input(documentRef, {
    id: 'contrato-asignacionColacion',
    type: 'number',
    min: 0,
    step: 1,
    value: '0'
  });
  fields.appendChild(
    wrap(documentRef, 'contrato-asignacionColacion', 'Asignación colación', colacionInput)
  );

  const movilizacionInput = input(documentRef, {
    id: 'contrato-asignacionMovilizacion',
    type: 'number',
    min: 0,
    step: 1,
    value: '0'
  });
  fields.appendChild(
    wrap(
      documentRef,
      'contrato-asignacionMovilizacion',
      'Asignación movilización',
      movilizacionInput
    )
  );

  const observacionInput = input(documentRef, {
    id: 'contrato-observacion',
    placeholder: 'Observaciones'
  });
  fields.appendChild(
    wrap(documentRef, 'contrato-observacion', 'Observación', observacionInput, true)
  );

  form.appendChild(fields);

  const messages = feedback(documentRef, 'contrato-form-errors', 'field-error rrhh-form-errors');
  form.appendChild(messages);

  const actions = el(documentRef, 'div', 'form-actions');
  const submit = el(documentRef, 'button', 'button button-primary', 'Guardar contrato');
  submit.type = 'submit';
  submit.id = 'contrato-submit';
  actions.appendChild(submit);

  const cancel = el(documentRef, 'button', 'button button-secondary', 'Cancelar edición');
  cancel.type = 'button';
  cancel.id = 'contrato-cancel';
  cancel.hidden = true;
  cancel.addEventListener('click', () => reset());
  actions.appendChild(cancel);
  form.appendChild(actions);

  function wrap(documentNode, id, labelText, control, wide = false) {
    const wrapper = el(documentNode, 'div', `field${wide ? ' field-wide' : ''}`);
    const label = el(documentNode, 'label', null, labelText);
    label.setAttribute('for', id);
    wrapper.appendChild(label);
    wrapper.appendChild(control);
    return wrapper;
  }

  function getValues() {
    return {
      entityId: workerSelect.value,
      tipoContrato: tipoSelect.value,
      sueldoBase: sueldoInput.value,
      jornadaHorasSemanales: jornadaInput.value,
      fechaInicio: inicioInput.value,
      fechaTermino: terminoInput.value,
      modalidadGratificacion: modalidadSelect.value,
      asignacionColacion: colacionInput.value,
      asignacionMovilizacion: movilizacionInput.value,
      observacion: observacionInput.value
    };
  }

  function actualizarTipo() {
    const indefinido = tipoSelect.value === 'indefinido';
    if (indefinido) terminoInput.value = '';
    terminoInput.disabled = indefinido || editing !== null;
  }

  function setValues(current = {}) {
    hiddenId.value = current.id || '';
    workerSelect.value = current.entityId || current.entity_id || '';
    tipoSelect.value = current.tipoContrato || 'indefinido';
    sueldoInput.value = current.sueldoBase ?? '';
    jornadaInput.value = current.jornadaHorasSemanales ?? 42;
    inicioInput.value = current.fechaInicio || '';
    terminoInput.value = current.fechaTermino || '';
    modalidadSelect.value = current.modalidadGratificacion || 'art50';
    colacionInput.value = current.asignacionColacion ?? 0;
    movilizacionInput.value = current.asignacionMovilizacion ?? 0;
    observacionInput.value = current.observacion || '';
    actualizarTipo();
  }

  function reset() {
    editing = null;
    cambioSueldo = false;
    form.reset();
    hiddenId.value = '';
    workerSelect.value = '';
    workerSelect.disabled = false;
    tipoSelect.value = 'indefinido';
    inicioInput.disabled = false;
    terminoInput.disabled = false;
    jornadaInput.value = '42';
    modalidadSelect.value = 'art50';
    colacionInput.value = '0';
    movilizacionInput.value = '0';
    hideFeedback(messages);
    cancel.hidden = true;
    submit.textContent = 'Guardar contrato';
    title.textContent = 'Registrar contrato';
    actualizarTipo();
  }

  function edit(current) {
    editing = current;
    cambioSueldo = false;
    setValues(current);
    workerSelect.disabled = true;
    inicioInput.disabled = true;
    terminoInput.disabled = true;
    cancel.hidden = false;
    submit.textContent = 'Guardar cambios';
    title.textContent = 'Editar contrato';
    hideFeedback(messages);
    form.scrollIntoView?.({ block: 'nearest' });
  }

  function prepareCambio(current) {
    editing = null;
    cambioSueldo = true;
    workerSelect.disabled = false;
    inicioInput.disabled = false;
    terminoInput.disabled = false;
    const jornada = Number(current.jornadaHorasSemanales || 42);
    setValues({
      ...current,
      id: '',
      fechaInicio: new Date().toISOString().slice(0, 10),
      fechaTermino: '',
      jornadaHorasSemanales: jornada > 42 ? 42 : jornada,
      observacion: ''
    });
    workerSelect.disabled = true;
    cancel.hidden = false;
    submit.textContent = 'Registrar cambio';
    title.textContent = 'Cambio de sueldo';
    hideFeedback(messages);
    form.scrollIntoView?.({ block: 'nearest' });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideFeedback(messages);
    const values = getValues();
    try {
      let message;
      if (editing) {
        actualizarContrato(editing.id, values, viewer);
        message = 'Contrato actualizado.';
      } else if (cambioSueldo) {
        registrarCambioSueldo(values.entityId, values, viewer);
        message = 'Cambio de sueldo registrado.';
      } else {
        crearContrato(values, viewer);
        message = 'Contrato registrado.';
      }
      reset();
      showFeedback(messages, message, 'ok');
      onSaved?.();
    } catch (error) {
      showFeedback(messages, errorMessages(error).join(' '), 'error');
    }
  });

  if (contrato) edit(contrato);
  root.appendChild(form);

  return { edit, prepareCambio, reset, getValues, element: form };
}
