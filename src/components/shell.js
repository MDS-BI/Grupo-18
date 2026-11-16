/** Workspace shell: branding, logo monogram, sidebar labels and identity. */

import { availableRoles } from '../rrhh/seguridad/session.js';
import { ROLE_MATRIX } from '../rrhh/seguridad/roles.js';

const FEMININE_TERMS = new Set([
  'entidad',
  'empresa',
  'persona',
  'factura',
  'orden',
  'cotizacion',
  'cotización',
  'liquidacion',
  'liquidación',
  'busqueda',
  'búsqueda',
  'nota',
  'categoria',
  'categoría',
  'cuenta',
  'boleta'
]);

function normalizeWord(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/** Return the Spanish article that agrees with the head noun of a term. */
export function articleFor(term) {
  const firstWord = normalizeWord(term).split(/\s+/)[0] || '';
  return FEMININE_TERMS.has(firstWord) ? 'la' : 'el';
}

/** Return "Nuevo"/"Nueva" for a term. */
export function newPrefix(term) {
  return articleFor(term) === 'la' ? 'Nueva' : 'Nuevo';
}

/** Return "seleccionada"/"seleccionado" for a term. */
export function selectedSuffix(term) {
  return articleFor(term) === 'la' ? 'seleccionada' : 'seleccionado';
}

/** Derive a two-letter monogram from the module name. */
export function deriveMonogram(moduleName) {
  const stopWords = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'base']);
  const words = String(moduleName || '')
    .trim()
    .split(/\s+/)
    .filter((word) => word && !stopWords.has(normalizeWord(word)));
  const source = words.length > 0 ? words : String(moduleName || 'M').split(/\s+/);
  return source
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/** Render the inline SVG monogram used by the top bar. */
export function renderLogo(container, moduleName) {
  const monogram = deriveMonogram(moduleName);
  container.textContent = '';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 40 40');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'logo-svg');

  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', '40');
  rect.setAttribute('height', '40');
  rect.setAttribute('rx', '10');
  rect.setAttribute('fill', 'var(--accent)');

  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.setAttribute('x', '20');
  text.setAttribute('y', '26');
  text.setAttribute('text-anchor', 'middle');
  text.setAttribute('font-size', '17');
  text.setAttribute('font-weight', '700');
  text.setAttribute('fill', '#ffffff');
  text.textContent = monogram;

  svg.appendChild(rect);
  svg.appendChild(text);
  container.appendChild(svg);
  return svg;
}

/** Apply the configured accent colour to the document root. */
export function applyTheme(config) {
  const accent =
    config && config.theme && config.theme.accentColor ? config.theme.accentColor : '#2563eb';
  document.documentElement.style.setProperty('--accent', accent);
}

/** Apply branding, navigation labels and headings for the configured module. */
export function renderShell(config) {
  const labels = config.labels;
  document.title = config.moduleName;
  document.getElementById('brand-name').textContent = config.moduleName;
  renderLogo(document.getElementById('logo-mark'), config.moduleName);
  applyTheme(config);

  document.getElementById('nav-dashboard-label').textContent = 'Panel';
  document.getElementById('nav-entities-label').textContent = labels.entities;
  document.getElementById('nav-documents-label').textContent = labels.documents;
  document.getElementById('nav-search-label').textContent = 'Búsqueda';

  const rrhhEnabled = Boolean(config.rrhh && config.rrhh.enabled);
  const rrhhLabel = config.rrhh?.label || 'RRHH / Planilla';
  const navRrhh = document.getElementById('nav-rrhh');
  if (navRrhh) {
    if (rrhhEnabled) {
      navRrhh.hidden = false;
      const navLabel = document.getElementById('nav-rrhh-label');
      if (navLabel) navLabel.textContent = rrhhLabel;
    } else {
      // Hidden nodes are still counted by the store; remove the module so a
      // base-only configuration has exactly the four core modules.
      navRrhh.remove();
    }
  }
  const rrhhHeading = document.getElementById('rrhh-view-heading');
  if (rrhhHeading) rrhhHeading.textContent = rrhhLabel;
  const rrhhEyebrow = document.getElementById('rrhh-view-eyebrow');
  if (rrhhEyebrow) rrhhEyebrow.textContent = rrhhLabel;

  renderRoleSelector(config);

  document.getElementById('entities-view-heading').textContent = labels.entities;
  document.getElementById('entity-form-heading').textContent = `Agregar / Editar ${labels.entity}`;
  document.getElementById('edit-entity-heading').textContent =
    `Editar o eliminar ${articleFor(labels.entity)} ${labels.entity.toLowerCase()}`;
  document.getElementById('delete-entity').textContent =
    `Eliminar ${articleFor(labels.entity)} ${labels.entity.toLowerCase()} ${selectedSuffix(labels.entity)}`;

  document.getElementById('documents-view-heading').textContent = labels.documents;
  document.getElementById('document-form-heading').textContent =
    `Agregar / Editar ${labels.document}`;
  document.getElementById('edit-document-heading').textContent =
    `Editar o eliminar ${articleFor(labels.document)} ${labels.document.toLowerCase()}`;
  document.getElementById('delete-document').textContent =
    `Eliminar ${articleFor(labels.document)} ${labels.document.toLowerCase()} ${selectedSuffix(labels.document)}`;

  document.getElementById('search-view-heading').textContent = `Buscar ${labels.entities}`;
  document
    .getElementById('search-input')
    .setAttribute('placeholder', `Buscar ${labels.entities.toLowerCase()}...`);
}

/** Fill the simulated role selector shown in the top bar. */
export function renderRoleSelector(config) {
  const select = document.getElementById('role-select');
  if (!select) return;
  if (config?.rrhh && config.rrhh.roleSelector === false) {
    select.closest('.role-picker')?.setAttribute('hidden', '');
    return;
  }
  select.closest('.role-picker')?.removeAttribute('hidden');
  const current = select.value || 'analista';
  select.textContent = '';
  for (const role of availableRoles()) {
    const option = document.createElement('option');
    option.value = role.value;
    option.textContent = role.label;
    select.appendChild(option);
  }
  if (ROLE_MATRIX[current]) select.value = current;
}
