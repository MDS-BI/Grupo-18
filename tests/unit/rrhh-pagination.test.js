import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { createPagination, paginateRows, PAGE_SIZE } from '../../src/rrhh/components/pagination.js';

function mountPagination(total, options = {}) {
  const dom = new JSDOM('<!DOCTYPE html><body></body>', { url: 'http://localhost/' });
  const pagination = createPagination(dom.window.document, options);
  const nav = pagination.element;
  dom.window.document.body.appendChild(nav);
  pagination.render(total);
  return { dom, pagination, nav };
}

function buttonByLabel(nav, label) {
  return [...nav.querySelectorAll('button')].find((button) => button.textContent === label);
}

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
    expect(pagination.element.getAttribute('aria-label')).toBe('Paginación de resultados');
    expect(pagination.element.textContent).toContain('Página 1 de 2 · 30 registro(s)');
    const status = pagination.element.querySelector('.rrhh-pagination-status');
    expect(status.getAttribute('aria-live')).toBe('polite');
    for (const button of pagination.element.querySelectorAll('button')) {
      expect(button.type).toBe('button');
    }
    expect(buttonByLabel(pagination.element, 'Anterior').disabled).toBe(true);
    const next = buttonByLabel(pagination.element, 'Siguiente');
    expect(next.disabled).toBe(false);
    next.click();
    expect(changes).toEqual([2]);
    expect(pagination.slice(Array.from({ length: 30 }, (_, i) => i))).toHaveLength(5);
  });

  it('conserva el foco y los textos accesibles al paginar', () => {
    const { dom, nav } = mountPagination(30);
    expect(nav.getAttribute('aria-label')).toBe('Paginación de resultados');
    expect(nav.querySelector('.rrhh-pagination-status').getAttribute('aria-live')).toBe('polite');
    expect(nav.querySelector('.rrhh-pagination-status').textContent).toBe(
      'Página 1 de 2 · 30 registro(s)'
    );
    const next = buttonByLabel(nav, 'Siguiente');
    next.focus();
    next.click();
    expect(nav.querySelector('.rrhh-pagination-status').textContent).toBe(
      'Página 2 de 2 · 30 registro(s)'
    );
    const focused = dom.window.document.activeElement;
    expect(nav.contains(focused)).toBe(true);
    expect(focused.textContent).toBe('Anterior');
    expect(focused.disabled).toBe(false);
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(true);
  });

  it('deshabilita Anterior en la primera página y Siguiente en la última', () => {
    const { dom, nav } = mountPagination(26);
    expect(buttonByLabel(nav, 'Anterior').disabled).toBe(true);
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(false);
    const next = buttonByLabel(nav, 'Siguiente');
    next.focus();
    next.click();
    expect(buttonByLabel(nav, 'Anterior').disabled).toBe(false);
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(true);
    expect(dom.window.document.activeElement).toBe(buttonByLabel(nav, 'Anterior'));
  });

  it('maneja totales límite y reinicia la página con reset()', () => {
    const { nav, pagination } = mountPagination(0);
    const status = () => nav.querySelector('.rrhh-pagination-status');
    expect(status().textContent).toBe('Página 1 de 1 · 0 registro(s)');
    expect(buttonByLabel(nav, 'Anterior').disabled).toBe(true);
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(true);

    pagination.render(25);
    expect(status().textContent).toBe('Página 1 de 1 · 25 registro(s)');
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(true);

    pagination.render(26);
    expect(status().textContent).toBe('Página 1 de 2 · 26 registro(s)');
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(false);
    buttonByLabel(nav, 'Siguiente').click();
    expect(pagination.page).toBe(2);
    expect(status().textContent).toBe('Página 2 de 2 · 26 registro(s)');
    expect(buttonByLabel(nav, 'Anterior').disabled).toBe(false);

    pagination.reset();
    expect(pagination.page).toBe(1);
    expect(status().textContent).toBe('Página 1 de 2 · 26 registro(s)');
    expect(buttonByLabel(nav, 'Anterior').disabled).toBe(true);
    expect(buttonByLabel(nav, 'Siguiente').disabled).toBe(false);
  });

  it('acota paginateRows ante páginas fuera de rango', () => {
    const rows = Array.from({ length: 60 }, (_, i) => `fila-${i}`);
    expect(paginateRows(rows, 0)).toEqual(paginateRows(rows, 1));
    expect(paginateRows(rows, -5)).toEqual(paginateRows(rows, 1));
    expect(paginateRows(rows, 99)).toEqual([]);
    expect(paginateRows([], 5)).toEqual([]);
  });
});
