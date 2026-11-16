import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderPeriodosView } from '../../src/rrhh/views/periodos.js';
import {
  PeriodoCerradoError,
  getPeriodo
} from '../../src/rrhh/utils/periodos-service.js';
import { cerrarPeriodo } from '../../src/rrhh/utils/periodos-service.js';

let dom;
let root;

function click(element) {
  element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function setValue(id, value) {
  const node = document.getElementById(id);
  node.value = value;
  node.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  return node;
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  root = document.getElementById('root');
});

afterEach(() => {
  dom.window.close();
});

describe('US14 - period management view', () => {
  it('lets Jefatura open a period and then close it', () => {
    renderPeriodosView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura RRHH' }
    });

    setValue('periodo-nuevo', '2026-10');
    click(document.getElementById('periodo-abrir'));
    expect(document.getElementById('periodos-feedback').textContent).toMatch(/abierto/i);
    expect(getPeriodo('2026-10').estado).toBe('abierto');

    const row = document.querySelector('[data-periodo-id="2026-10"]');
    expect(row.textContent).toContain('Abierto');
    click(row.querySelector('button'));
    expect(document.getElementById('periodos-feedback').textContent).toMatch(/cerrado/i);
    expect(getPeriodo('2026-10').estado).toBe('cerrado');
    expect(document.querySelector('[data-periodo-id="2026-10"]').textContent).toContain('Cerrado');
  });

  it('shows a closed period as read-only for an analyst', () => {
    cerrarPeriodo('2026-10', { role: 'jefatura', usuario: 'Jefatura RRHH' });
    renderPeriodosView(root, {
      doc: document,
      viewer: { role: 'analista', usuario: 'Analista RRHH' }
    });

    expect(document.getElementById('periodos-permission')).not.toBeNull();
    expect(document.getElementById('periodo-abrir').disabled).toBe(true);
    const row = document.querySelector('[data-periodo-id="2026-10"]');
    expect(row.textContent).toContain('Solo lectura');
    expect(row.querySelector('button')).toBeNull();
  });

  it('blocks operations once the period is closed', () => {
    cerrarPeriodo('2026-10', { role: 'jefatura', usuario: 'Jefatura RRHH' });
    expect(() =>
      cerrarPeriodo('2026-10', { role: 'jefatura', usuario: 'Jefatura RRHH' })
    ).toThrow(PeriodoCerradoError);
  });

  it('reports invalid period input without creating a record', () => {
    renderPeriodosView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura RRHH' }
    });
    setValue('periodo-nuevo', '');
    click(document.getElementById('periodo-abrir'));
    expect(document.getElementById('periodos-feedback').textContent).toMatch(/v.lido/i);
  });
});
