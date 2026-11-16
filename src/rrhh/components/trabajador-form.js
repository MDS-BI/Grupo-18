/** Worker file form with RUT validation and catalog selectors. */

import {
  actualizarTrabajador,
  crearTrabajador
} from '../utils/trabajadores-service.js';
import { listCatalogos } from '../utils/catalogos-service.js';
import { el, feedback, hideFeedback, input, select, showFeedback } from './dom.js';

function optionsFor(catalogos, tipo) {
  return [
    { value: '', label: `Sin ${tipo === 'centro_costo' ? 'centro de costo' : tipo}` },
    ...catalogos
      .filter((row) => row.tipo === tipo)
      .map((row) => ({ value: row.id, label: `${row.codigo} — ${row.nombre}` }))
  ];
}

function jefeOptions(trabajadores = [], excludeId = '') {
  return [
    { value: '', label: 'Sin jefatura directa' },
    ...trabajadores
      .filter((row) => row.activo && String(row.entityId) !== String(excludeId))
      .map((row) => ({
        value: row.entityId,
        label: `${row.name}${row.code ? ` — ${row.code}` : ''}`
      }))
  ];
}

function errorMessages(error) {
  if (!error) return ['No se pudo guardar el trabajador.'];
  if (Array.isArray(error.errors)) return error.errors;
  if (error.errors && typeof error.errors === 'object') return Object.values(error.errors);
  return [error.message];
}

/**
 * Render the worker form.
 *
 * @returns {{edit: Function, reset: Function, getValues: Function, element: HTMLFormElement}}
 */
export function renderTrabajadorForm(
  root,
  { doc, viewer, catalogos, trabajadores = [], onSaved } = {}
) {
  const documentRef = doc || root.ownerDocument;
  const catalogs = catalogos || listCatalogos();
  let workers = trabajadores;
  let editing = null;

  const form = el(documentRef, 'form', 'panel form-panel rrhh-trabajador-form');
  form.id = 'trabajador-form';
  form.noValidate = true;

  const header = el(documentRef, 'div', 'panel-header');
  const title = el(documentRef, 'h4', null, 'Registrar trabajador');
  title.id = 'trabajador-form-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'La ficha reutiliza la entidad base: nombre, código, RUT obligatorio y datos de contacto, más cargo, departamento, centro de costo y jefatura directa.'
    )
  );
  form.appendChild(header);

  const hiddenId = input(documentRef, { id: 'trabajador-entity-id', type: 'hidden' });
  form.appendChild(hiddenId);

  const fields = el(documentRef, 'div', 'field-grid');

  const nameInput = input(documentRef, { id: 'trabajador-name', placeholder: 'Nombre completo' });
  fields.appendChild(wrap(documentRef, 'trabajador-name', 'Nombre *', nameInput, true));

  const codeInput = input(documentRef, { id: 'trabajador-code', placeholder: 'Código interno' });
  fields.appendChild(wrap(documentRef, 'trabajador-code', 'Código *', codeInput));

  const rutInput = input(documentRef, { id: 'trabajador-rut', placeholder: '12.345.678-5' });
  rutInput.required = true;
  fields.appendChild(wrap(documentRef, 'trabajador-rut', 'RUT *', rutInput));

  const emailInput = input(documentRef, { id: 'trabajador-email', type: 'email' });
  fields.appendChild(wrap(documentRef, 'trabajador-email', 'Correo electrónico', emailInput));

  const phoneInput = input(documentRef, { id: 'trabajador-phone', type: 'tel' });
  fields.appendChild(wrap(documentRef, 'trabajador-phone', 'Teléfono', phoneInput));

  const dateInput = input(documentRef, { id: 'trabajador-fechaIngreso', type: 'date' });
  fields.appendChild(wrap(documentRef, 'trabajador-fechaIngreso', 'Fecha de ingreso', dateInput));

  const jefeSelect = select(documentRef, {
    id: 'trabajador-jefeId',
    options: jefeOptions(workers)
  });
  fields.appendChild(
    wrap(documentRef, 'trabajador-jefeId', 'Jefatura directa (opcional)', jefeSelect, true)
  );

  const cargoSelect = select(documentRef, {
    id: 'trabajador-cargo',
    options: optionsFor(catalogs, 'cargo')
  });
  fields.appendChild(wrap(documentRef, 'trabajador-cargo', 'Cargo', cargoSelect));

  const departamentoSelect = select(documentRef, {
    id: 'trabajador-departamento',
    options: optionsFor(catalogs, 'departamento')
  });
  fields.appendChild(wrap(documentRef, 'trabajador-departamento', 'Departamento', departamentoSelect));

  const centroSelect = select(documentRef, {
    id: 'trabajador-centro-costo',
    options: optionsFor(catalogs, 'centro_costo')
  });
  fields.appendChild(wrap(documentRef, 'trabajador-centro-costo', 'Centro de costo', centroSelect));

  form.appendChild(fields);

  const messages = feedback(documentRef, 'trabajador-form-errors', 'field-error rrhh-form-errors');
  form.appendChild(messages);

  const actions = el(documentRef, 'div', 'form-actions');
  const submit = el(documentRef, 'button', 'button button-primary', 'Guardar trabajador');
  submit.type = 'submit';
  submit.id = 'trabajador-submit';
  actions.appendChild(submit);

  const cancel = el(documentRef, 'button', 'button button-secondary', 'Cancelar edición');
  cancel.type = 'button';
  cancel.id = 'trabajador-cancel';
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

  function refreshJefes(excludeId = '') {
    jefeSelect.textContent = '';
    for (const option of jefeOptions(workers, excludeId)) {
      const node = el(documentRef, 'option', null, option.label);
      node.value = option.value;
      jefeSelect.appendChild(node);
    }
  }

  function getValues() {
    return {
      name: nameInput.value,
      code: codeInput.value,
      rut: rutInput.value,
      email: emailInput.value,
      phone: phoneInput.value,
      fechaIngreso: dateInput.value,
      jefeId: jefeSelect.value,
      cargoId: cargoSelect.value,
      departamentoId: departamentoSelect.value,
      centroCostoId: centroSelect.value
    };
  }

  function setValues(trabajador = {}) {
    hiddenId.value = trabajador.entityId || '';
    nameInput.value = trabajador.name || '';
    codeInput.value = trabajador.code || '';
    rutInput.value = trabajador.rut || '';
    emailInput.value = trabajador.email || '';
    phoneInput.value = trabajador.phone || '';
    dateInput.value = trabajador.fechaIngreso || '';
    refreshJefes(trabajador.entityId || '');
    jefeSelect.value = trabajador.jefeId || '';
    cargoSelect.value = trabajador.cargoId || '';
    departamentoSelect.value = trabajador.departamentoId || '';
    centroSelect.value = trabajador.centroCostoId || '';
  }

  function reset() {
    editing = null;
    form.reset();
    hiddenId.value = '';
    refreshJefes();
    jefeSelect.value = '';
    hideFeedback(messages);
    cancel.hidden = true;
    submit.textContent = 'Guardar trabajador';
    title.textContent = 'Registrar trabajador';
  }

  function edit(trabajador) {
    editing = trabajador;
    setValues(trabajador);
    cancel.hidden = false;
    submit.textContent = 'Guardar cambios';
    title.textContent = `Editar ${trabajador.name || 'trabajador'}`;
    form.scrollIntoView?.({ block: 'nearest' });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    hideFeedback(messages);
    const values = getValues();
    try {
      if (editing) {
        actualizarTrabajador(editing.entityId, values, viewer);
        showFeedback(messages, 'Trabajador actualizado.', 'ok');
      } else {
        crearTrabajador(values, viewer);
        showFeedback(messages, 'Trabajador registrado.', 'ok');
      }
      reset();
      onSaved?.();
    } catch (error) {
      showFeedback(messages, errorMessages(error).join(' '), 'error');
    }
  });

  root.appendChild(form);

  return {
    edit,
    reset,
    getValues,
    element: form
  };
}
