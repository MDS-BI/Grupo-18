import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import { insert } from '../../src/rrhh/storage-rrhh.js';
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

function expectAccessibleFieldError(fieldId) {
  const control = qs(fieldId);
  const errorNode = qs(`${fieldId}-error`);
  expect(control).not.toBeNull();
  expect(errorNode).not.toBeNull();
  expect(errorNode.id).toBe(`${fieldId}-error`);
  expect(control.getAttribute('aria-invalid')).toBe('true');
  expect((control.getAttribute('aria-describedby') || '').split(/\s+/)).toContain(errorNode.id);
}

function focusablesIn(drawer) {
  return [...drawer.querySelectorAll('button, [href], input, select, textarea, [tabindex]')].filter(
    (node) =>
      !node.disabled &&
      !node.hidden &&
      node.type !== 'hidden' &&
      node.getAttribute('tabindex') !== '-1' &&
      node.getAttribute('aria-hidden') !== 'true' &&
      !node.closest('[hidden]')
  );
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
    expect(css).toMatch(/\.rrhh-section-header\s*\{[^}]*display:\s*flex/s);
    expect(css).toMatch(/\.rrhh-primary-action\s*\{[^}]*margin-left:\s*auto/s);
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

  it('confina el foco dentro del drawer modal', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    qs('trabajadores-registrar').click();
    const drawer = qs('trabajadores-form-drawer');
    const focusables = [...drawer.querySelectorAll('button, input, select, textarea')].filter(
      (node) => !node.disabled && !node.hidden && !node.closest('[hidden]')
    );
    expect(document.activeElement).toBe(drawer.querySelector('.rrhh-drawer-header button'));
    const last = focusables[focusables.length - 1];
    last.focus();
    last.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }));
    expect(document.activeElement).toBe(focusables[0]);
    vista.dispose();
  });

  it('solo pide descartar cambios cuando hubo una edición real', () => {
    dom.window.confirm = vi.fn(() => false);
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    const drawer = qs('trabajadores-form-drawer');
    const close = () => drawer.querySelector('.rrhh-drawer-header button').click();

    qs('trabajadores-registrar').click();
    qs('trabajador-name').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    close();
    expect(dom.window.confirm).not.toHaveBeenCalled();
    expect(drawer.hidden).toBe(true);

    qs('trabajadores-registrar').click();
    setValue('trabajador-name', 'Cambio real');
    close();
    expect(dom.window.confirm).toHaveBeenCalledWith('Descartar los cambios sin guardar?');
    expect(drawer.hidden).toBe(false);
    vista.dispose();
  });

  it('expone los drawers como diálogos modales etiquetados', () => {
    const pantallas = [
      [renderTrabajadoresView, 'trabajadores-form-drawer'],
      [renderContratosView, 'contratos-form-drawer'],
      [renderCatalogosView, 'catalogos-form-drawer']
    ];
    for (const [render, drawerId] of pantallas) {
      const vista = render(root, { doc: document, viewer: admin });
      const panel = qs(drawerId).querySelector('.rrhh-drawer-panel');
      expect(panel.getAttribute('role')).toBe('dialog');
      expect(panel.getAttribute('aria-modal')).toBe('true');
      const labelledBy = panel.getAttribute('aria-labelledby');
      expect(labelledBy).toBe(`${drawerId}-title`);
      expect(qs(labelledBy).textContent.length).toBeGreaterThan(0);
      vista.dispose();
    }
  });

  it('envuelve Shift+Tab desde el primer focusable al último', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    const opener = qs('trabajadores-registrar');
    opener.focus();
    opener.click();
    const drawer = qs('trabajadores-form-drawer');
    const focusables = focusablesIn(drawer);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    expect(document.activeElement).toBe(first);
    first.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
        cancelable: true
      })
    );
    expect(document.activeElement).toBe(last);
    vista.dispose();
  });

  it('cierra con Escape y devuelve el foco al botón que abrió el drawer', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    const opener = qs('trabajadores-registrar');
    opener.focus();
    opener.click();
    const drawer = qs('trabajadores-form-drawer');
    expect(drawer.hidden).toBe(false);
    expect(document.activeElement).not.toBe(opener);
    drawer.dispatchEvent(
      new dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })
    );
    expect(drawer.hidden).toBe(true);
    expect(document.activeElement).toBe(opener);
    vista.dispose();
  });

  it('deja el drawer sin cambios pendientes tras guardar', () => {
    dom.window.confirm = vi.fn(() => false);
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    const drawer = qs('trabajadores-form-drawer');
    qs('trabajadores-registrar').click();
    setValue('trabajador-name', 'Cambio temporal');
    setValue('trabajador-name', '');
    setValue('trabajador-name', 'Prueba Guardado');
    setValue('trabajador-code', 'TR-GUARDADO');
    setValue('trabajador-rut', '7.654.321-6');
    submitForm('trabajador-form');
    expect(qs('trabajador-form-errors').textContent).toMatch(/registrado/i);
    qs('trabajador-name').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    drawer.querySelector('.rrhh-drawer-header button').click();
    expect(dom.window.confirm).not.toHaveBeenCalled();
    expect(drawer.hidden).toBe(true);
    vista.dispose();
  });

  it('muestra paginación accesible en catálogos y reinicia la página al filtrar', () => {
    for (let index = 1; index <= 26; index += 1) {
      insert(
        'catalogos',
        { tipo: 'cargo', codigo: `CAR-PAG-${index}`, nombre: `Cargo paginado ${index}` },
        { prefix: 'cat' }
      );
    }
    insert(
      'catalogos',
      { tipo: 'departamento', codigo: 'DEP-PAG-1', nombre: 'Departamento paginado' },
      { prefix: 'cat' }
    );
    const vista = renderCatalogosView(root, { doc: document, viewer: admin });
    const pagination = qs('catalogos-pagination');
    expect(pagination.tagName).toBe('NAV');
    expect(pagination.getAttribute('aria-label')).toBe('Paginación de resultados');
    expect(pagination.hidden).toBe(false);
    expect(pagination.querySelector('.rrhh-pagination-status').textContent).toMatch(
      /Página 1 de 2 · 27 registro/
    );
    [...pagination.querySelectorAll('button')].at(-1).click();
    expect(pagination.querySelector('.rrhh-pagination-status').textContent).toMatch(
      /Página 2 de 2/
    );
    setValue('catalogo-filtro', 'departamento');
    expect(pagination.hidden).toBe(false);
    expect(pagination.querySelector('.rrhh-pagination-status').textContent).toMatch(
      /Página 1 de 1/
    );
    vista.dispose();
  });

  it('muestra paginación accesible en contratos y reinicia la página al filtrar', () => {
    const workerA = addEntity({ name: 'Trabajador Paginación A', code: 'PAG-A' });
    const workerB = addEntity({ name: 'Trabajador Paginación B', code: 'PAG-B' });
    for (let index = 1; index <= 26; index += 1) {
      insert(
        'contratos',
        {
          entityId: workerA.entity_id,
          tipoContrato: 'indefinido',
          sueldoBase: 1000000,
          jornadaHorasSemanales: 40,
          fechaInicio: '2024-01-01'
        },
        { prefix: 'con' }
      );
    }
    insert(
      'contratos',
      {
        entityId: workerB.entity_id,
        tipoContrato: 'indefinido',
        sueldoBase: 1000000,
        jornadaHorasSemanales: 40,
        fechaInicio: '2024-01-01'
      },
      { prefix: 'con' }
    );
    const vista = renderContratosView(root, { doc: document, viewer: admin });
    const pagination = qs('contratos-pagination');
    expect(pagination.tagName).toBe('NAV');
    expect(pagination.getAttribute('aria-label')).toBe('Paginación de resultados');
    expect(pagination.hidden).toBe(false);
    expect(pagination.querySelector('.rrhh-pagination-status').textContent).toMatch(
      /Página 1 de 2 · 27 registro/
    );
    [...pagination.querySelectorAll('button')].at(-1).click();
    expect(pagination.querySelector('.rrhh-pagination-status').textContent).toMatch(
      /Página 2 de 2/
    );
    setValue('contratos-filtro-trabajador', workerB.entity_id);
    expect(pagination.hidden).toBe(false);
    expect(pagination.querySelector('.rrhh-pagination-status').textContent).toMatch(
      /Página 1 de 1/
    );
    vista.dispose();
  });

  it('asocia errores por campo del trabajador con aria-invalid y aria-describedby', () => {
    const vista = renderTrabajadoresView(root, { doc: document, viewer: admin });
    qs('trabajadores-registrar').click();
    submitForm('trabajador-form');
    for (const fieldId of ['trabajador-name', 'trabajador-code', 'trabajador-rut']) {
      expectAccessibleFieldError(fieldId);
    }
    vista.dispose();
  });

  it('asocia errores por campo del catálogo con aria-invalid y aria-describedby', () => {
    const vista = renderCatalogosView(root, { doc: document, viewer: admin });
    qs('catalogos-nuevo-registro').click();
    submitForm('catalogo-form');
    for (const fieldId of ['catalogo-codigo', 'catalogo-nombre']) {
      expectAccessibleFieldError(fieldId);
    }
    vista.dispose();
  });

  it('asocia errores por campo del contrato con aria-invalid y aria-describedby', () => {
    const vista = renderContratosView(root, { doc: document, viewer: admin });
    qs('contratos-registrar').click();
    submitForm('contrato-form');
    for (const fieldId of ['contrato-entityId', 'contrato-sueldoBase', 'contrato-fechaInicio']) {
      expectAccessibleFieldError(fieldId);
    }
    vista.dispose();
  });
});
