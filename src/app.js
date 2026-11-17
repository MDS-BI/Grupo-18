import { loadModuleConfig, setActiveConfig, getConfig } from './module-config.js';
import {
  addEntity,
  updateEntity,
  deleteEntity,
  loadGenericEntities,
  addDocument,
  updateDocument,
  deleteDocument,
  loadGenericDocuments,
  validateEntity,
  validateDocument
} from './storage.js';
import { renderShell } from './components/shell.js';
import { renderDashboard, refreshStats } from './components/dashboard.js';
import {
  renderEntityCustomFields,
  readEntityForm,
  fillEntityForm,
  clearEntityForm,
  showEntityErrors
} from './components/entity-form.js';
import {
  renderDocumentCustomFields,
  readDocumentForm,
  fillDocumentForm,
  clearDocumentForm,
  showDocumentErrors,
  renderStatusControl
} from './components/document-form.js';
import { renderEntitySelect, renderSearchResults } from './components/entity-list.js';
import { renderDocumentSelect } from './components/document-list.js';
import { bindSearch } from './components/search-bar.js';
import { getViewer, setRole } from './rrhh/seguridad/session.js';
import { ensureSeedOnFirstBoot, restoreSeedData } from './rrhh/data/seed.js';
import { renderRrhhWorkspace } from './rrhh/views/rrhh-router.js';

const BASE_VIEWS = ['dashboard', 'entities', 'documents', 'search'];

let modelConfig = null;
let rrhhView = null;
let liquidationView = null;
let exclusiveMode = false;

function qs(id) {
  return document.getElementById(id);
}

function views() {
  return modelConfig?.rrhh?.enabled ? [...BASE_VIEWS, 'rrhh'] : BASE_VIEWS;
}

function isRrhhOnly() {
  return Boolean(modelConfig?.rrhh?.enabled && modelConfig?.rrhh?.only);
}

/**
 * Keep the base screens in the code, but remove them from the RRHH-only UI.
 * Called by the browser entry point, not by `boot()`/`initApp()` tests.
 */
export function applyExclusiveMode(exclusive = isRrhhOnly()) {
  exclusiveMode = exclusive;
  document.body?.classList.toggle('rrhh-only', exclusive);
  for (const name of BASE_VIEWS) {
    const navButton = qs(`nav-${name}`);
    if (navButton) navButton.hidden = exclusive;
  }
  if (exclusive) showView('rrhh');
}

function refreshEntityOptions() {
  const select = qs('edit-entity');
  if (!select) return;
  renderEntitySelect(select, loadGenericEntities(), 'Selecciona una entidad');
}

function refreshDocumentOptions() {
  const select = qs('edit-document');
  if (!select) return;
  renderDocumentSelect(select, loadGenericDocuments(), 'Selecciona un documento');
}

function refreshDocumentEntityOptions() {
  const select = qs('document-entity');
  if (!select) return;
  const entities = loadGenericEntities();
  const previous = select.value;
  select.textContent = '';
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecciona una entidad';
  select.appendChild(placeholder);
  for (const entity of entities) {
    const option = document.createElement('option');
    option.value = entity.entity_id;
    option.textContent = `${entity.name} — ${entity.code}`;
    select.appendChild(option);
  }
  if (previous && entities.some((entity) => entity.entity_id === previous)) {
    select.value = previous;
  }
}

function renderSearch() {
  const input = qs('search-input');
  renderSearchResults(qs('search-results-list'), qs('search-empty'), input ? input.value : '');
}

function showView(name) {
  const target = exclusiveMode && name !== 'rrhh' ? 'rrhh' : name;
  for (const view of views()) {
    const section = qs(`view-${view}`);
    if (section) section.hidden = view !== target;
  }
  document.querySelectorAll('.nav-module').forEach((button) => {
    if (button.dataset.module === target) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (target === 'dashboard') {
    refreshStats();
  } else if (target === 'entities') {
    clearEntityForm();
    refreshEntityOptions();
  } else if (target === 'documents') {
    clearDocumentForm();
    refreshDocumentEntityOptions();
    refreshDocumentOptions();
  } else if (target === 'search') {
    renderSearch();
  } else if (target === 'rrhh') {
    renderRrhh();
  }
}

function renderRrhh(tab) {
  if (!modelConfig?.rrhh?.enabled) return;
  liquidationView?.dispose?.();
  liquidationView = null;
  rrhhView?.dispose?.();
  rrhhView = renderRrhhWorkspace({
    doc: document,
    config: modelConfig,
    viewer: getViewer(),
    initialTab: tab,
    onRoleRequired: () => setRole('jefatura'),
    onLiquidationView: (view) => {
      liquidationView = view;
    }
  });
}

function handleEntitySubmit(event) {
  event.preventDefault();
  const record = readEntityForm();
  const validation = validateEntity(record);
  if (!validation.valid) {
    showEntityErrors(validation.errors);
    return;
  }
  const id = qs('entity-id').value;
  try {
    if (id) updateEntity(id, record);
    else addEntity(record);
  } catch (error) {
    showEntityErrors(error.errors || { name: error.message });
    return;
  }
  clearEntityForm();
  refreshEntityOptions();
  refreshStats();
}

function handleEntitySelection() {
  const id = qs('edit-entity').value;
  const entity = loadGenericEntities().find((item) => item.id === id);
  if (entity) fillEntityForm(entity);
  else clearEntityForm();
}

function handleEntityDelete() {
  const id = qs('edit-entity').value;
  if (!id) return;
  const entity = loadGenericEntities().find((item) => item.id === id);
  if (!entity) {
    showFeedback(
      'entity-feedback',
      'El registro seleccionado no se gestiona en la pantalla genérica.'
    );
    return;
  }
  if (
    typeof confirm === 'function' &&
    !confirm(`¿Eliminar ${entity.name}? Se eliminarán también sus documentos.`)
  ) {
    return;
  }
  try {
    deleteEntity(id);
  } catch (error) {
    showFeedback('entity-feedback', error.message);
    return;
  }
  showFeedback('entity-feedback', '');
  clearEntityForm();
  refreshEntityOptions();
  refreshStats();
}

function handleDocumentSubmit(event) {
  event.preventDefault();
  const record = readDocumentForm();
  const validation = validateDocument(record);
  if (!validation.valid) {
    showDocumentErrors(validation.errors);
    return;
  }
  const id = qs('document-id').value;
  try {
    if (id) updateDocument(id, record);
    else addDocument(record);
  } catch (error) {
    showDocumentErrors(error.errors || { status: error.message });
    return;
  }
  clearDocumentForm();
  refreshDocumentEntityOptions();
  refreshDocumentOptions();
  refreshStats();
}

function handleDocumentSelection() {
  const id = qs('edit-document').value;
  const documentRecord = loadGenericDocuments().find((item) => item.id === id);
  if (documentRecord) fillDocumentForm(documentRecord);
  else clearDocumentForm();
}

function handleDocumentDelete() {
  const id = qs('edit-document').value;
  if (!id) return;
  const documentRecord = loadGenericDocuments().find((item) => item.id === id);
  if (!documentRecord) {
    showFeedback(
      'document-feedback',
      'El documento seleccionado no se gestiona en la pantalla genérica.'
    );
    return;
  }
  if (typeof confirm === 'function' && !confirm('¿Eliminar el documento seleccionado?')) return;
  try {
    deleteDocument(id);
  } catch (error) {
    showFeedback('document-feedback', error.message);
    return;
  }
  showFeedback('document-feedback', '');
  clearDocumentForm();
  refreshDocumentOptions();
  refreshStats();
}

function handleSeedDataRestore() {
  const message =
    'Esto reemplazará los datos de RR.HH. de ejemplo por el dataset de prueba. ¿Continuar?';
  if (typeof confirm === 'function' && !confirm(message)) return;

  const summary = restoreSeedData();
  if (!summary) {
    showFeedback('rrhh-seed-feedback', 'La carga de datos de prueba no está disponible.');
    return;
  }

  refreshStats();
  if (modelConfig?.rrhh?.enabled && qs('view-rrhh') && !qs('view-rrhh').hidden) {
    renderRrhh();
  }
  showFeedback(
    'rrhh-seed-feedback',
    `Datos de prueba cargados: ${summary.trabajadores} trabajadores, ${summary.contratos} contratos, ${summary.novedades} novedades y ${summary.liquidaciones} liquidaciones.`
  );
}

function bindEvents() {
  for (const name of views()) {
    const button = qs(`nav-${name}`);
    if (button) button.addEventListener('click', () => showView(name));
  }

  const roleSelect = qs('role-select');
  if (roleSelect) {
    roleSelect.addEventListener('change', () => {
      setRole(roleSelect.value);
      if (modelConfig?.rrhh?.enabled && qs('view-rrhh') && !qs('view-rrhh').hidden) {
        renderRrhh();
      }
    });
  }

  const newEntity = qs('action-new-entity');
  if (newEntity) {
    newEntity.addEventListener('click', () => {
      showView('entities');
      qs('name').focus();
    });
  }

  const newDocument = qs('action-new-document');
  if (newDocument) {
    newDocument.addEventListener('click', () => {
      showView('documents');
      qs('document-entity').focus();
    });
  }

  const openEntities = qs('action-open-entities');
  if (openEntities) openEntities.addEventListener('click', () => showView('entities'));

  const seedButton = qs('rrhh-seed-button');
  if (seedButton) seedButton.addEventListener('click', handleSeedDataRestore);

  const find = qs('action-find');
  if (find) {
    find.addEventListener('click', () => {
      showView('search');
      qs('search-input').focus();
    });
  }

  qs('entity-form').addEventListener('submit', handleEntitySubmit);
  qs('edit-entity').addEventListener('change', handleEntitySelection);
  qs('delete-entity').addEventListener('click', handleEntityDelete);

  qs('document-form').addEventListener('submit', handleDocumentSubmit);
  qs('edit-document').addEventListener('change', handleDocumentSelection);
  qs('delete-document').addEventListener('click', handleDocumentDelete);

  bindSearch(qs('search-input'), renderSearch);
}

function showFeedback(id, message) {
  const node = qs(id);
  if (!node) return;
  node.hidden = !message;
  node.textContent = message || '';
}

function renderRrhhExclusionNotes() {
  const enabled = Boolean(modelConfig?.rrhh?.enabled);
  for (const id of ['entities-rrhh-note', 'documents-rrhh-note']) {
    const note = qs(id);
    if (note) note.hidden = !enabled;
  }
  const seedButton = qs('rrhh-seed-button');
  if (seedButton) seedButton.hidden = !enabled;
}

function showConfigErrors(errors) {
  const banner = qs('config-errors');
  if (!banner) return;
  if (errors && errors.length > 0) {
    banner.hidden = false;
    banner.textContent = `Revisa la configuración del módulo: ${errors.join(' ')}`;
  } else {
    banner.hidden = true;
    banner.textContent = '';
  }
}

/**
 * Boot the workspace with the module profile declared in module-config.js.
 */
export async function boot(options = {}) {
  const result = await loadModuleConfig();
  return initApp(result, options);
}

/**
 * Initialize the workspace with an already-normalized configuration.
 */
export async function initApp(result, options = {}) {
  const normalized = result || (await loadModuleConfig());
  exclusiveMode = false;
  setActiveConfig(normalized.config || null);
  modelConfig = getConfig();
  ensureSeedOnFirstBoot();

  renderShell(modelConfig);
  renderRrhhExclusionNotes();
  renderDashboard(modelConfig);
  renderEntityCustomFields();
  renderDocumentCustomFields();
  renderStatusControl(null);

  clearEntityForm();
  clearDocumentForm();
  bindEvents();
  showView('dashboard');
  applyExclusiveMode(Boolean(options.exclusive && isRrhhOnly()));
  showConfigErrors(normalized.errors);

  return modelConfig;
}
