import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderTrabajadoresView } from '../../src/rrhh/views/trabajadores-view.js';
import { renderContratosView } from '../../src/rrhh/views/contratos-view.js';
import { renderCatalogosView } from '../../src/rrhh/views/catalogos-view.js';

const admin = { role: 'administrador', usuario: 'Admin' };
let dom;
let root;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><body><div id="root"></div></body>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  root = document.getElementById('root');
});

function qs(id) {
  return document.getElementById(id);
}

function setValue(id, value) {
  const node = qs(id);
  node.value = value;
  node.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

function submitForm(id) {
  qs(id).dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
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
    const css = readFileSync(
      fileURLToPath(new URL('../../src/styles.css', import.meta.url)),
      'utf8'
    );
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

  it('mantiene el mensaje de éxito visible tras registrar trabajador', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    qs('trabajadores-registrar').click();
    setValue('trabajador-name', 'Prueba Feedback');
    setValue('trabajador-code', 'TR-FEEDBACK');
    setValue('trabajador-rut', '7.654.321-6');
    submitForm('trabajador-form');

    const feedback = qs('trabajador-form-errors');
    expect(feedback.hidden).toBe(false);
    expect(feedback.textContent).toMatch(/registrado/i);
    expect(qs('trabajadores-form-drawer').hidden).toBe(false);
    expect(qs('trabajador-name').value).toBe('');
    vista.dispose();
  });

  it('mantiene el mensaje de éxito visible tras registrar contrato', () => {
    const entity = addEntity({
      name: 'Ana Torres',
      code: 'TRAB-001',
      rut: '12.345.678-5'
    });
    const vista = renderContratosView(root, { doc: document, viewer: admin });
    qs('contratos-registrar').click();
    setValue('contrato-entityId', entity.entity_id);
    setValue('contrato-sueldoBase', '1000000');
    setValue('contrato-fechaInicio', '2026-01-01');
    submitForm('contrato-form');

    const feedback = qs('contrato-form-errors');
    expect(feedback.hidden).toBe(false);
    expect(feedback.textContent).toMatch(/registrado/i);
    expect(qs('contratos-form-drawer').hidden).toBe(false);
    expect(qs('contrato-entityId').value).toBe('');
    vista.dispose();
  });
});
