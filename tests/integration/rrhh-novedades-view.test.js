import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import { crearNovedad } from '../../src/rrhh/utils/novedades-service.js';
import { asegurarPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { rangoPeriodo } from '../../src/rrhh/utils/periodos.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function currentPeriodo() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
}

function click(id) {
  document.getElementById(id).click();
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

describe('US14 - novedades view inside the ERP shell', () => {
  it('integrates the configured RRHH navigation labels', async () => {
    await bootRrhh();

    const nav = document.getElementById('nav-rrhh');
    expect(nav).not.toBeNull();
    expect(document.getElementById('nav-rrhh-label').textContent).toBe('Remuneraciones');
    expect(document.querySelectorAll('.nav-module')).toHaveLength(5);

    click('nav-rrhh');
    expect(document.getElementById('view-rrhh').hidden).toBe(false);
    expect(document.getElementById('rrhh-view-heading').textContent).toBe('Remuneraciones');
  });

  it('navigates to the novedades tab and shows pending totals by period', async () => {
    const periodo = currentPeriodo();
    const { fechaInicio, fechaFin } = rangoPeriodo(periodo);
    asegurarPeriodo(periodo);
    const entity = addEntity({
      name: 'Elena Vargas',
      code: 'TRAB-005',
      rut: '12.345.678-5'
    });
    crearNovedad(
      {
        trabajadorEntityId: entity.entity_id,
        periodo,
        tipo: 'ausencia',
        cantidad: 1,
        fechaInicio,
        fechaFin,
        observacion: 'Tramite personal'
      },
      { role: 'analista', usuario: 'Analista RRHH' }
    );

    await bootRrhh();
    click('nav-rrhh');
    click('rrhh-tab-novedades');

    expect(document.getElementById('rrhh-tab-novedades').getAttribute('aria-selected')).toBe(
      'true'
    );
    expect(document.getElementById('rrhh-panel-novedades').hidden).toBe(false);
    expect(document.getElementById('rrhh-novedades-view')).not.toBeNull();
    expect(document.getElementById('novedades-summary').textContent).toContain('Pendientes');
    expect(document.getElementById('novedades-summary').textContent).toContain('1');
    expect(document.getElementById('novedades-list').textContent).toContain('Elena Vargas');
    expect(document.getElementById('novedades-eligibility').textContent).toMatch(/bloqueado/i);
  });

  it('disposes and re-renders tabs without duplicating the view', async () => {
    await bootRrhh();
    click('nav-rrhh');
    click('rrhh-tab-novedades');
    const first = document.getElementById('rrhh-novedades-view');
    expect(first).not.toBeNull();

    click('rrhh-tab-periodos');
    expect(document.getElementById('rrhh-panel-novedades').hidden).toBe(true);
    expect(document.getElementById('rrhh-periodos-view')).not.toBeNull();

    click('rrhh-tab-novedades');
    expect(document.querySelectorAll('#rrhh-novedades-view')).toHaveLength(1);
  });
});
