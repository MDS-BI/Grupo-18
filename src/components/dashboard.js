import { labelFor } from '../module-config.js';
import { loadEntities, loadDocuments } from '../storage.js';
import { newPrefix } from './shell.js';

function qs(id) {
  return document.getElementById(id);
}

/** Render dashboard labels and quick-action titles for the active module. */
export function renderDashboard(config) {
  qs('dashboard-heading').textContent = config.moduleName;
  qs('dashboard-subtitle').textContent = `Espacio de trabajo de ${config.moduleName}`;

  qs('action-new-entity-title').textContent =
    `${newPrefix(labelFor('entity'))} ${labelFor('entity')}`;
  qs('action-new-document-title').textContent =
    `${newPrefix(labelFor('document'))} ${labelFor('document')}`;
  qs('action-open-entities-title').textContent = labelFor('entities');
  qs('action-find-title').textContent = 'Buscar registros';

  qs('stat-entities-label').textContent = labelFor('entities');
  qs('stat-documents-label').textContent = labelFor('documents');
}

/** Refresh live record counts shown by the dashboard. */
export function refreshStats() {
  const entities = loadEntities().length;
  const documents = loadDocuments().length;
  const entityStat = qs('stat-entities');
  const documentStat = qs('stat-documents');
  if (entityStat) entityStat.textContent = String(entities);
  if (documentStat) documentStat.textContent = String(documents);
}
