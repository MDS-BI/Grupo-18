import { getConfig } from '../module-config.js';

/** Custom field definitions declared for one target (entity or document). */
export function declaredFields(target) {
  const config = getConfig();
  return (config.customFields || []).filter((field) => field.target === target);
}

/** Render the declared custom fields inside a container element. */
export function renderCustomFields(containerId, target) {
  const container = document.getElementById(containerId);
  if (!container) return [];
  const fields = declaredFields(target);
  container.textContent = '';
  container.hidden = fields.length === 0;

  for (const field of fields) {
    const wrapper = document.createElement('div');
    wrapper.className = 'custom-field';

    const label = document.createElement('label');
    label.setAttribute('for', `cf-${field.key}`);
    label.textContent = `${field.label}${field.required ? ' *' : ''}`;

    let control;
    if (field.type === 'select') {
      control = document.createElement('select');
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '--';
      control.appendChild(placeholder);
      for (const option of field.options || []) {
        const node = document.createElement('option');
        node.value = option;
        node.textContent = option;
        control.appendChild(node);
      }
    } else {
      control = document.createElement('input');
      control.type = field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text';
    }
    control.id = `cf-${field.key}`;
    control.name = `cf-${field.key}`;

    const error = document.createElement('p');
    error.className = 'field-error';
    error.id = `error-cf-${field.key}`;

    wrapper.append(label, control, error);
    container.appendChild(wrapper);
  }
  return fields;
}

/** Read declared custom fields from the DOM, skipping blank values. */
export function readCustomFields(target) {
  const values = {};
  for (const field of declaredFields(target)) {
    const control = document.getElementById(`cf-${field.key}`);
    if (!control) continue;
    if (control.value !== '') values[field.key] = control.value;
  }
  return values;
}

/** Populate declared custom fields from a stored record. */
export function fillCustomFields(target, record) {
  for (const field of declaredFields(target)) {
    const control = document.getElementById(`cf-${field.key}`);
    if (!control) continue;
    const value = record ? record[field.key] : undefined;
    control.value = value === undefined || value === null ? '' : String(value);
  }
}

/** Clear declared custom fields. */
export function clearCustomFields(target) {
  fillCustomFields(target, null);
}

/** Show validation messages for declared custom fields. */
export function showCustomFieldErrors(target, errors) {
  for (const field of declaredFields(target)) {
    const error = document.getElementById(`error-cf-${field.key}`);
    if (error) error.textContent = errors[field.key] || '';
  }
}

/** Whether a key belongs to a declared custom field for the target. */
export function isCustomFieldKey(target, key) {
  return declaredFields(target).some((field) => field.key === key);
}
