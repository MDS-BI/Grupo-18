import { el } from './dom.js';

export { feedback, showFeedback, hideFeedback } from './dom.js';

const FIELD_ERROR_SELECTOR = '[data-field-error]';

export function fieldErrorId(fieldId) {
  return `${fieldId}-error`;
}

function mapEntries(fieldMap) {
  if (!fieldMap) return [];
  if (Array.isArray(fieldMap)) {
    return fieldMap.map((entry) =>
      Array.isArray(entry) ? { key: entry[0], id: entry[1] } : entry
    );
  }
  return Object.entries(fieldMap).map(([key, value]) =>
    typeof value === 'object' && value !== null ? { key, ...value } : { key, id: value }
  );
}

function errorEntries(errors) {
  if (!errors) return [];
  if (Array.isArray(errors)) {
    return errors.filter(Boolean).map((message) => ({ key: '', message: String(message) }));
  }
  if (typeof errors === 'string') return [{ key: '', message: errors }];
  if (typeof errors === 'object') {
    if (errors.errors) return errorEntries(errors.errors);
    if (errors.message) return [{ key: '', message: String(errors.message) }];
    return Object.entries(errors).flatMap(([key, value]) => {
      const values = Array.isArray(value) ? value : [value];
      return values
        .filter((item) => item !== undefined && item !== null && item !== false)
        .map((item) => ({
          key,
          message: typeof item === 'string' ? item : String(item?.message ?? item)
        }));
    });
  }
  return [{ key: '', message: String(errors) }];
}

function matches(entry, error) {
  if (entry.match !== undefined) {
    const patterns = Array.isArray(entry.match) ? entry.match : [entry.match];
    return patterns.some((pattern) =>
      pattern instanceof RegExp
        ? pattern.test(error.message)
        : error.message.toLowerCase().includes(String(pattern).toLowerCase())
    );
  }
  if (entry.key instanceof RegExp) return entry.key.test(error.message);
  if (entry.key) return String(entry.key).toLowerCase() === String(error.key).toLowerCase();
  return false;
}

function controlFor(root, id) {
  if (!root || !id || !root.querySelectorAll) return null;
  return [...root.querySelectorAll('[id]')].find((node) => node.id === id) || null;
}

function addDescribedBy(control, id) {
  const values = (control.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!values.includes(id)) values.push(id);
  control.setAttribute('aria-describedby', values.join(' '));
}

function removeDescribedBy(control, id) {
  const values = (control.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((value) => value && value !== id);
  if (values.length) control.setAttribute('aria-describedby', values.join(' '));
  else control.removeAttribute('aria-describedby');
}

export function clearFieldErrors(root) {
  if (!root || !root.querySelectorAll) return;
  for (const node of [...root.querySelectorAll(FIELD_ERROR_SELECTOR)]) {
    const control = controlFor(root, node.dataset.fieldErrorFor);
    if (control) {
      control.removeAttribute('aria-invalid');
      removeDescribedBy(control, node.id);
    }
    node.remove();
  }
}

export function setFieldErrors(root, errors, fieldMap = {}) {
  clearFieldErrors(root);
  const entries = mapEntries(fieldMap);
  const grouped = new Map();
  for (const error of errorEntries(errors)) {
    for (const entry of entries) {
      if (!entry.id || !matches(entry, error)) continue;
      if (!grouped.has(entry.id)) grouped.set(entry.id, []);
      const messages = grouped.get(entry.id);
      if (!messages.includes(error.message)) messages.push(error.message);
    }
  }
  const doc = root?.ownerDocument || root;
  for (const [fieldId, messages] of grouped) {
    const control = controlFor(root, fieldId);
    if (!control || control.type === 'hidden') continue;
    const node = el(doc, 'p', 'field-error rrhh-field-error', messages.join(' '));
    node.id = fieldErrorId(fieldId);
    node.dataset.fieldError = '';
    node.dataset.fieldErrorFor = fieldId;
    node.setAttribute('role', 'alert');
    node.setAttribute('aria-live', 'polite');
    control.after(node);
    control.setAttribute('aria-invalid', 'true');
    addDescribedBy(control, node.id);
  }
  return grouped;
}
