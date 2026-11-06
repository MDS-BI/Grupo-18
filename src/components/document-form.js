import { getConfig } from '../module-config.js';
import {
  clearCustomFields,
  fillCustomFields,
  isCustomFieldKey,
  readCustomFields,
  renderCustomFields,
  showCustomFieldErrors
} from './custom-fields.js';

const BASE_INPUTS = [
  ['series', 'series'],
  ['folio', 'folio'],
  ['startDate', 'startDate'],
  ['endDate', 'endDate'],
  ['quantity', 'quantity'],
  ['subtotal', 'subtotal'],
  ['discount', 'discount'],
  ['taxAmount', 'taxAmount'],
  ['totalAmount', 'totalAmount'],
  ['currency', 'currency'],
  ['paymentTerms', 'docPaymentTerms'],
  ['notes', 'notes']
];

function qs(id) {
  return document.getElementById(id);
}

/** Render the custom fields declared for documents. */
export function renderDocumentCustomFields() {
  return renderCustomFields('document-custom-fields', 'document');
}

/** Render the status control according to the configured lifecycle. */
export function renderStatusControl(currentDocument = null) {
  const wrapper = qs('status-field');
  if (!wrapper) return null;
  const existing = qs('status');
  const previousValue = existing ? existing.value : '';
  wrapper.querySelectorAll('input, select').forEach((node) => node.remove());

  const lifecycle = getConfig().statusLifecycle;
  let control;
  if (!lifecycle) {
    control = document.createElement('input');
    control.type = 'text';
    control.value = currentDocument ? currentDocument.status || '' : previousValue;
  } else {
    control = document.createElement('select');
    const values = currentDocument
      ? [currentDocument.status || '', ...(lifecycle.transitions[currentDocument.status] || [])]
      : ['', ...lifecycle.statuses];
    for (const value of values) {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value === '' ? '--' : value;
      control.appendChild(option);
    }
    control.value = currentDocument ? currentDocument.status || '' : previousValue;
  }
  control.id = 'status';
  control.name = 'status';
  wrapper.appendChild(control);
  return control;
}

/** Read the document form into a plain record, skipping blank values. */
export function readDocumentForm() {
  const record = {};
  const entityId = qs('document-entity') ? qs('document-entity').value : '';
  if (entityId) record.entityId = entityId;
  for (const [key, id] of BASE_INPUTS) {
    const control = qs(id);
    if (control && control.value !== '') record[key] = control.value;
  }
  const status = qs('status');
  if (status && status.value !== '') record.status = status.value;
  return { ...record, ...readCustomFields('document') };
}

/** Populate the document form for editing. */
export function fillDocumentForm(documentRecord) {
  qs('document-id').value = documentRecord.id;
  const entitySelect = qs('document-entity');
  entitySelect.value = documentRecord.entity_id;
  for (const [key, id] of BASE_INPUTS) {
    const control = qs(id);
    if (!control) continue;
    const value = documentRecord[key];
    control.value = value === undefined || value === null ? '' : String(value);
  }
  fillCustomFields('document', documentRecord);
  renderStatusControl(documentRecord);
  qs('document-submit-button').textContent = 'Actualizar Documento';
}

/** Reset the document form to creation mode. */
export function clearDocumentForm() {
  qs('document-id').value = '';
  const entitySelect = qs('document-entity');
  if (entitySelect) entitySelect.value = '';
  for (const [, id] of BASE_INPUTS) {
    const control = qs(id);
    if (control) control.value = '';
  }
  clearCustomFields('document');
  renderStatusControl(null);
  qs('document-submit-button').textContent = 'Guardar Documento';
  clearDocumentErrors();
}

/** Clear every validation message on the document form. */
export function clearDocumentErrors() {
  qs('document-form')
    .querySelectorAll('.field-error')
    .forEach((node) => {
      node.textContent = '';
    });
}

/** Display validation messages returned by storage.validateDocument. */
export function showDocumentErrors(errors) {
  clearDocumentErrors();
  for (const [key, message] of Object.entries(errors || {})) {
    let id = `error-${key}`;
    if (key === 'entityId' || key === 'entity_id') id = 'error-document-entity';
    else if (isCustomFieldKey('document', key)) id = `error-cf-${key}`;
    const node = qs(id);
    if (node) node.textContent = message;
  }
  showCustomFieldErrors('document', errors || {});
}
