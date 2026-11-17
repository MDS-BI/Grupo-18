import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { crearTrabajador } from '../../src/rrhh/utils/trabajadores-service.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

const viewer = { role: 'analista', usuario: 'Analista RRHH' };

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

function isoDaysFromToday(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
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

describe('US2 - contracts flow inside the ERP shell', () => {
  it('registers a contract, records a salary change and keeps history', async () => {
    const worker = crearTrabajador(
      { name: 'Ana Pérez', code: 'TRAB-001', rut: '12.345.678-5' },
      viewer
    );

    await bootRrhh();
    click('nav-rrhh');
    click('rrhh-tab-contratos');

    expect(document.getElementById('rrhh-contratos-view')).not.toBeNull();
    setValue('contrato-entityId', worker.entityId);
    setValue('contrato-tipoContrato', 'indefinido');
    setValue('contrato-sueldoBase', '1000000');
    setValue('contrato-jornadaHorasSemanales', '42');
    setValue('contrato-fechaInicio', '2024-01-01');
    setValue('contrato-asignacionColacion', '50000');
    setValue('contrato-asignacionMovilizacion', '30000');

    submit(document.getElementById('contrato-form'));

    const tbody = document.querySelector('#rrhh-contratos-view tbody');
    expect(tbody.textContent).toContain('Ana Pérez');
    expect(tbody.textContent).toContain('$1.000.000');
    expect(tbody.textContent).toContain('vigente');

    const cambioButton = [...tbody.querySelectorAll('button')].find(
      (button) => button.textContent === 'Cambio sueldo'
    );
    cambioButton.click();
    setValue('contrato-sueldoBase', '1200000');
    submit(document.getElementById('contrato-form'));

    const rows = [...document.querySelectorAll('#rrhh-contratos-view tbody tr')];
    expect(rows).toHaveLength(2);
    expect(document.querySelector('#rrhh-contratos-view tbody').textContent).toContain(
      '$1.200.000'
    );
    expect(document.querySelector('#rrhh-contratos-view tbody').textContent).toContain('terminado');
  });

  it('shows expiring contracts on the dashboard', async () => {
    const worker = crearTrabajador(
      { name: 'Bruno Soto', code: 'TRAB-002', rut: '11.111.111-1' },
      viewer
    );
    crearContrato(
      {
        entityId: worker.entityId,
        tipoContrato: 'plazo_fijo',
        sueldoBase: 900000,
        jornadaHorasSemanales: 42,
        fechaInicio: isoDaysFromToday(-10),
        fechaTermino: isoDaysFromToday(12),
        modalidadGratificacion: 'art50'
      },
      viewer
    );

    await bootRrhh();

    const alerts = document.getElementById('dashboard-alertas');
    expect(alerts.hidden).toBe(false);
    expect(document.getElementById('dashboard-alertas-list').textContent).toContain('Bruno Soto');
    expect(document.getElementById('dashboard-alertas-list').textContent).toMatch(/vence en 12/);
  });
});
