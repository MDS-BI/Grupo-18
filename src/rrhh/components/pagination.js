/**
 * Reusable 25-row pagination for RR.HH. lists (FR-108).
 * Search/filter state is owned by the caller; changing page only re-slices rows.
 */

export const PAGE_SIZE = 25;

export function paginateRows(rows, page = 1, pageSize = PAGE_SIZE) {
  const start = (Math.max(1, page) - 1) * pageSize;
  return rows.slice(start, start + pageSize);
}

export function createPagination(
  doc,
  { id = 'rrhh-pagination', pageSize = PAGE_SIZE, onChange } = {}
) {
  const documentRef = doc || (typeof document !== 'undefined' ? document : null);
  const element = documentRef.createElement('nav');
  element.id = id;
  element.className = 'rrhh-pagination';
  element.setAttribute('aria-label', 'Paginación de resultados');

  let total = 0;
  let page = 1;

  function pageCount() {
    return Math.max(1, Math.ceil(total / pageSize));
  }

  function go(next) {
    const bounded = Math.min(Math.max(1, next), pageCount());
    if (bounded === page) return;
    page = bounded;
    render();
    onChange?.(page);
  }

  function makeButton(label, disabled, handler) {
    const btn = documentRef.createElement('button');
    btn.type = 'button';
    btn.className = 'button button-secondary button-small';
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener('click', handler);
    return btn;
  }

  function render() {
    const pages = pageCount();
    if (page > pages) page = pages;
    const active = documentRef.activeElement;
    const focusedLabel = element.contains(active) ? active.textContent : null;
    element.textContent = '';
    const previous = makeButton('Anterior', page <= 1, () => go(page - 1));
    const status = documentRef.createElement('span');
    status.className = 'rrhh-pagination-status';
    status.setAttribute('aria-live', 'polite');
    status.textContent = `Página ${page} de ${pages} · ${total} registro(s)`;
    const next = makeButton('Siguiente', page >= pages, () => go(page + 1));
    element.appendChild(previous);
    element.appendChild(status);
    element.appendChild(next);
    const focusTarget = focusedLabel
      ? focusedLabel === 'Anterior' && !previous.disabled
        ? previous
        : focusedLabel === 'Siguiente' && !next.disabled
          ? next
          : !previous.disabled
            ? previous
            : !next.disabled
              ? next
              : null
      : null;
    focusTarget?.focus?.();
  }

  render();

  return {
    element,
    render(nextTotal) {
      total = Math.max(0, nextTotal || 0);
      render();
    },
    slice(rows) {
      return paginateRows(rows, page, pageSize);
    },
    reset() {
      page = 1;
      render();
    },
    get page() {
      return page;
    }
  };
}
