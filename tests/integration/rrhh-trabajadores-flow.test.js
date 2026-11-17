import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { crearCatalogo } from '../../src/rrhh/utils/catalogos-service.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function click(id) {
  document.getElementById(id).click();
}

function submit(form) {
  form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function setValue(id, value) {
  const field = document.getElementById(id);
  field.value = value;
  field.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  field.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

async function bootRrhh() {
  const { initApp } = await import('../../src/app.js');
  const { normalizeConfig } = await import('../../src/module-config.js');
  await initApp(
    normalizeConfig({
      moduleName: 'Recursos Humanos',
      labels: { entity: 'Trabajador', entities: 'Trabajadores' },
      rrhh: { enabled: true, label: 'Remuneraciones' }
    })
  );
}

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  dom.window.scrollTo = vi.fn();
  dom.window.localStorage.clear();
  vi.resetModules();
});

afterEach(() => {
  dom.window.close();
});

describe('US1 - workers flow inside the ERP shell', () => {
  it('registers, searches and updates a worker from the RRHH tab', async () => {
    crearCatalogo(
      { tipo: 'cargo', codigo: 'CAR-01', nombre: 'Analista de remuneraciones' },
      { role: 'analista', usuario: 'Analista RRHH' }
    );
    crearCatalogo(
      { tipo: 'departamento', codigo: 'RRHH', nombre: 'Recursos Humanos' },
      { role: 'analista', usuario: 'Analista RRHH' }
    );

    await bootRrhh();
    click('nav-rrhh');
    click('rrhh-tab-trabajadores');

    expect(document.getElementById('rrhh-trabajadores-view')).not.toBeNull();
    const form = document.getElementById('trabajador-form');
    expect(form).not.toBeNull();

    setValue('trabajador-name', 'Ana Pérez');
    setValue('trabajador-code', 'TRAB-001');
    setValue('trabajador-rut', '12.345.678-5');
    setValue('trabajador-email', 'ana.perez@example.com');
    setValue('trabajador-fechaIngreso', '2024-01-15');
    const cargoOption = [...document.getElementById('trabajador-cargo').options].find((option) =>
      option.textContent.includes('Analista de remuneraciones')
    );
    setValue('trabajador-cargo', cargoOption.value);
    const departamentoOption = [...document.getElementById('trabajador-departamento').options].find(
      (option) => option.textContent.includes('Recursos Humanos')
    );
    setValue('trabajador-departamento', departamentoOption.value);

    submit(form);

    const tbody = document.querySelector('#rrhh-trabajadores-view tbody');
    expect(tbody.textContent).toContain('Ana Pérez');
    expect(tbody.textContent).toContain('12.345.678-5');
    expect(tbody.textContent).toContain('Analista de remuneraciones');

    setValue('trabajadores-buscar', 'ana');
    expect(tbody.textContent).toContain('Ana Pérez');

    setValue('trabajadores-buscar', 'no-existe');
    expect(document.querySelector('#rrhh-trabajadores-view .rrhh-empty').hidden).toBe(false);

    setValue('trabajadores-buscar', '');
    const editButton = [...tbody.querySelectorAll('button')].find(
      (button) => button.textContent === 'Editar'
    );
    editButton.click();
    setValue('trabajador-name', 'Ana María Pérez');
    submit(document.getElementById('trabajador-form'));

    expect(tbody.textContent).toContain('Ana María Pérez');
  });

  it('manages base catalogs from the catalogs tab', async () => {
    await bootRrhh();
    click('nav-rrhh');
    click('rrhh-tab-catalogos');

    expect(document.getElementById('rrhh-catalogos-view')).not.toBeNull();
    setValue('catalogo-tipo', 'departamento');
    setValue('catalogo-codigo', 'FIN');
    setValue('catalogo-nombre', 'Finanzas');
    submit(document.getElementById('catalogo-form'));

    const tbody = document.querySelector('#rrhh-catalogos-view tbody');
    expect(tbody.textContent).toContain('Finanzas');
    expect(tbody.textContent).toContain('FIN');

    const inactiveButton = [...tbody.querySelectorAll('button')].find(
      (button) => button.textContent === 'Desactivar'
    );
    inactiveButton.click();
    expect(document.querySelector('#rrhh-catalogos-view tbody').textContent).not.toContain(
      'Finanzas'
    );

    click('rrhh-tab-trabajadores');
    const options = [...document.getElementById('trabajador-departamento').options].map(
      (option) => option.textContent
    );
    expect(options.some((label) => label.includes('Finanzas'))).toBe(false);
  });
});
