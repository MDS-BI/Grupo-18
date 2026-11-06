import {
  clearCustomFields,
  fillCustomFields,
  isCustomFieldKey,
  readCustomFields,
  renderCustomFields,
  showCustomFieldErrors
} from './custom-fields.js';

const BASE_INPUTS = [
  'name',
  'code',
  'taxId',
  'email',
  'phone',
  'address',
  'category',
  'description',
  'targetDate',
  'creditLimit',
  'paymentTerms'
];

function qs(id) {
  return document.getElementById(id);
}

/** Render the custom fields declared for entities. */
export function renderEntityCustomFields() {
  return renderCustomFields('entity-custom-fields', 'entity');
}

/** Read the entity form into a plain record, skipping blank values. */
export function readEntityForm() {
  const record = {};
  for (const key of BASE_INPUTS) {
    const control = qs(key);
    if (control && control.value !== '') record[key] = control.value;
  }
  return { ...record, ...readCustomFields('entity') };
}

/** Populate the entity form for editing. */
export function fillEntityForm(entity) {
  qs('entity-id').value = entity.id;
  for (const key of BASE_INPUTS) {
    const control = qs(key);
    if (!control) continue;
    control.value = entity[key] === undefined || entity[key] === null ? '' : String(entity[key]);
  }
  fillCustomFields('entity', entity);
  qs('submit-button').textContent = 'Actualizar';
}

/** Reset the entity form to creation mode. */
export function clearEntityForm() {
  qs('entity-id').value = '';
  for (const key of BASE_INPUTS) {
    const control = qs(key);
    if (control) control.value = '';
  }
  clearCustomFields('entity');
  qs('submit-button').textContent = 'Guardar Entidad';
  clearEntityErrors();
}

/** Clear every validation message on the entity form. */
export function clearEntityErrors() {
  qs('entity-form')
    .querySelectorAll('.field-error')
    .forEach((node) => {
      node.textContent = '';
    });
}

/** Display validation messages returned by storage.validateEntity. */
export function showEntityErrors(errors) {
  clearEntityErrors();
  for (const [key, message] of Object.entries(errors || {})) {
    const id = isCustomFieldKey('entity', key) ? `error-cf-${key}` : `error-${key}`;
    const node = qs(id);
    if (node) node.textContent = message;
  }
  showCustomFieldErrors('entity', errors || {});
}
