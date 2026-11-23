import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { createPagination, paginateRows, PAGE_SIZE } from '../../src/rrhh/components/pagination.js';

describe('Paginación de 25 filas (FR-108)', () => {
  it('divide las filas en páginas de 25', () => {
    const rows = Array.from({ length: 60 }, (_, i) => `fila-${i}`);
    expect(PAGE_SIZE).toBe(25);
    expect(paginateRows(rows, 1)).toHaveLength(25);
    expect(paginateRows(rows, 2)[0]).toBe('fila-25');
    expect(paginateRows(rows, 3)).toHaveLength(10);
  });

  it('muestra controles anterior/siguiente y conserva el total', () => {
    const dom = new JSDOM('<!DOCTYPE html><body></body>', { url: 'http://localhost/' });
    const changes = [];
    const pagination = createPagination(dom.window.document, {
      onChange: (page) => changes.push(page)
    });
    pagination.render(30);
    expect(pagination.element.textContent).toContain('Página 1 de 2 · 30 registro(s)');
    const next = [...pagination.element.querySelectorAll('button')].find(
      (button) => button.textContent === 'Siguiente'
    );
    next.click();
    expect(changes).toEqual([2]);
    expect(pagination.slice(Array.from({ length: 30 }, (_, i) => i))).toHaveLength(5);
  });

  it('conserva el foco y los textos accesibles al paginar', () => {
    const dom = new JSDOM('<!DOCTYPE html><body></body>', { url: 'http://localhost/' });
    const pagination = createPagination(dom.window.document);
    dom.window.document.body.appendChild(pagination.element);
    pagination.render(30);
    const nav = pagination.element;
    expect(nav.getAttribute('aria-label')).toBe('Paginación de resultados');
    expect(nav.querySelector('.rrhh-pagination-status').textContent).toBe(
      'Página 1 de 2 · 30 registro(s)'
    );
    const next = [...nav.querySelectorAll('button')].find(
      (button) => button.textContent === 'Siguiente'
    );
    next.focus();
    next.click();
    expect(nav.querySelector('.rrhh-pagination-status').textContent).toBe(
      'Página 2 de 2 · 30 registro(s)'
    );
    const focused = dom.window.document.activeElement;
    expect(nav.contains(focused)).toBe(true);
    expect(focused.textContent).toBe('Anterior');
    expect(focused.disabled).toBe(false);
  });
});
