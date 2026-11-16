import { getConfig } from '../module-config.js';
import { searchEntities, loadDocuments } from '../storage.js';

function qs(id) {
  return document.getElementById(id);
}

/** Fill the entity edit selector, keeping a placeholder as the first option. */
export function renderEntitySelect(select, entities, placeholder = 'Selecciona una entidad') {
  const previous = select.value;
  select.textContent = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder;
  select.appendChild(empty);
  for (const entity of entities) {
    const option = document.createElement('option');
    option.value = entity.id;
    option.textContent = `${entity.name} — ${entity.code}`;
    select.appendChild(option);
  }
  if (previous && entities.some((entity) => entity.id === previous)) select.value = previous;
  return select;
}

function addMeta(container, text, className) {
  if (!text) return;
  const node = document.createElement('p');
  if (className) node.className = className;
  node.textContent = text;
  container.appendChild(node);
}

/** Render search results (entities plus their related documents). */
export function renderSearchResults(container, emptyState, term) {
  const entities = searchEntities(term);
  const documents = loadDocuments();
  const config = getConfig();
  container.textContent = '';

  if (entities.length === 0) {
    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = term
        ? `No se encontraron coincidencias para "${term}". Intenta con otro término.`
        : 'Todavía no hay coincidencias. Crea tu primer registro desde el panel.';
    }
    return;
  }

  if (emptyState) emptyState.hidden = true;

  for (const entity of entities) {
    const item = document.createElement('article');
    item.className = 'entity-item';

    const title = document.createElement('h3');
    title.textContent = entity.name;
    item.appendChild(title);

    addMeta(item, entity.code ? `Código: ${entity.code}` : '', 'entity-meta');
    addMeta(item, entity.category ? `Categoría: ${entity.category}` : '', 'entity-meta');
    addMeta(item, entity.email || '', 'entity-meta');
    addMeta(item, entity.targetDate ? `Fecha objetivo: ${entity.targetDate}` : '', 'entity-meta');

    for (const field of config.customFields || []) {
      if (field.target !== 'entity') continue;
      const value = entity[field.key];
      if (value === undefined || value === null || value === '') continue;
      addMeta(item, `${field.label}: ${value}`, 'entity-custom');
    }

    const related = documents.filter(
      (documentRecord) => documentRecord.entity_id === entity.entity_id
    );
    if (related.length > 0) {
      const list = document.createElement('div');
      list.className = 'entity-documents';
      for (const documentRecord of related) {
        const row = document.createElement('div');
        row.className = 'result-document';
        const badge = document.createElement('span');
        badge.className = 'status-badge';
        badge.textContent = documentRecord.status || 'sin estado';
        const label = document.createElement('span');
        label.className = 'result-document-label';
        const series = documentRecord.series ? `${documentRecord.series}-` : '';
        label.textContent = `${series}${documentRecord.folio}`;
        row.append(badge, label);
        list.appendChild(row);
      }
      item.appendChild(list);
    }

    container.appendChild(item);
  }
}

/** Keep a reference to the search input for main.js wiring. */
export function searchInput() {
  return qs('search-input');
}
