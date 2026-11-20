import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderTrabajadoresView } from '../../src/rrhh/views/trabajadores-view.js';
import { renderContratosView } from '../../src/rrhh/views/contratos-view.js';
import { renderCatalogosView } from '../../src/rrhh/views/catalogos-view.js';

const admin = { role: 'administrador', usuario: 'Admin' };
let dom;
let root;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><body><div id="root"></div></body>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  root = document.getElementById('root');
});

function qs(id) {
  return document.getElementById(id);
}

describe('Panel lateral de formularios de alta (FR-116)', () => {
  it('deja el listado a todo el ancho y el botón arriba a la derecha', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    const view = qs('rrhh-trabajadores-view');
    const header = view.querySelector('.rrhh-section-header');
    expect(header.lastElementChild.id).toBe('trabajadores-registrar');
    expect(header.lastElementChild.classList.contains('rrhh-primary-action')).toBe(true);
    expect(view.querySelector('.rrhh-list-layout > .rrhh-list-panel')).not.toBeNull();
    expect(view.querySelector('.rrhh-split')).toBeNull();
    const css = readFileSync(fileURLToPath(new URL('../../src/styles.css', import.meta.url)), 'utf8');
    expect(css).toMatch(/\.rrhh-list-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0, 1fr\)/s);
    expect(css).toMatch(/\.rrhh-section-header\s*\{[^}]*justify-content|display:\s*flex/s);
    vista.dispose();
  });

  it('abre el formulario de trabajador solo al pulsar Registrar trabajador', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    expect(qs('trabajadores-form-drawer').hidden).toBe(true);
    qs('trabajadores-registrar').click();
    expect(qs('trabajadores-form-drawer').hidden).toBe(false);
    expect(qs('trabajador-form')).not.toBeNull();
    qs('trabajadores-form-drawer').querySelector('.rrhh-drawer-header button').click();
    expect(qs('trabajadores-form-drawer').hidden).toBe(true);
    vista.dispose();
  });

  it('abre el formulario de contrato desde el botón superior derecho', () => {
    const vista = renderContratosView(root, { doc: document, viewer: admin });
    expect(qs('contratos-form-drawer').hidden).toBe(true);
    qs('contratos-registrar').click();
    expect(qs('contratos-form-drawer').hidden).toBe(false);
    expect(qs('contrato-form')).not.toBeNull();
    vista.dispose();
  });

  it('abre el formulario de catálogo desde el botón superior derecho', () => {
    const vista = renderCatalogosView(root, { doc: document, viewer: admin });
    expect(qs('catalogos-form-drawer').hidden).toBe(true);
    qs('catalogos-nuevo-registro').click();
    expect(qs('catalogos-form-drawer').hidden).toBe(false);
    expect(qs('catalogo-form')).not.toBeNull();
    vista.dispose();
  });
});
