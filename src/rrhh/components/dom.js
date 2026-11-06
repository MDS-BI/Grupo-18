/** Small DOM helpers shared by the RRHH views (no framework, no innerHTML). */

export function el(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function button(doc, { id, label, className = 'button', onClick, disabled = false, ariaLabel } = {}) {
  const node = el(doc, 'button', className, label);
  node.type = 'button';
  if (id) node.id = id;
  if (ariaLabel) node.setAttribute('aria-label', ariaLabel);
  if (disabled) node.disabled = true;
  if (onClick) node.addEventListener('click', onClick);
  return node;
}

export function badge(doc, text, tone = 'neutral') {
  const node = el(doc, 'span', `rrhh-badge rrhh-badge-${tone}`, text);
  return node;
}

export function field(doc, { id, label, input, help, wide = false }) {
  const wrapper = el(doc, 'div', `field${wide ? ' field-wide' : ''}`);
  const labelNode = el(doc, 'label', null, label);
  labelNode.setAttribute('for', id);
  wrapper.appendChild(labelNode);
  wrapper.appendChild(input);
  if (help) wrapper.appendChild(el(doc, 'p', 'field-help', help));
  return wrapper;
}

export function input(doc, { id, type = 'text', value = '', min, max, step, placeholder, required = false } = {}) {
  const node = el(doc, 'input');
  node.id = id;
  node.name = id;
  node.type = type;
  if (value !== undefined) node.value = value;
  if (min !== undefined) node.min = String(min);
  if (max !== undefined) node.max = String(max);
  if (step !== undefined) node.step = String(step);
  if (placeholder) node.placeholder = placeholder;
  if (required) node.required = true;
  return node;
}

export function select(doc, { id, options = [], value = '' } = {}) {
  const node = el(doc, 'select');
  node.id = id;
  node.name = id;
  for (const option of options) {
    const item = el(doc, 'option', null, option.label ?? option.value);
    item.value = option.value;
    if (option.value === value) item.selected = true;
    node.appendChild(item);
  }
  return node;
}

export function feedback(doc, id, className = 'rrhh-feedback') {
  const node = el(doc, 'p', className);
  node.id = id;
  node.setAttribute('role', 'status');
  node.setAttribute('aria-live', 'polite');
  node.hidden = true;
  return node;
}

export function showFeedback(node, message, tone = 'info') {
  if (!node) return;
  node.hidden = false;
  node.textContent = message;
  node.dataset.tone = tone;
}

export function hideFeedback(node) {
  if (!node) return;
  node.hidden = true;
  node.textContent = '';
  delete node.dataset.tone;
}

export function statusTone(estado) {
  if (estado === 'aprobada' || estado === 'pagada' || estado === 'abierto') return 'ok';
  if (estado === 'rechazada' || estado === 'anulada' || estado === 'cerrado') return 'danger';
  if (estado === 'pendiente' || estado === 'borrador') return 'warn';
  return 'neutral';
}

export function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const rounded = Math.round(number);
  const sign = rounded < 0 ? '-' : '';
  return `${sign}$${String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
}

export function currentPeriodoId(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}
