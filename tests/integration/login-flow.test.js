import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';
import { SEED_DISABLE_FLAG } from '../../src/rrhh/data/seed.js';
import { SESSION_KEY } from '../../src/rrhh/seguridad/session.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id) {
  return document.getElementById(id);
}

function setInputValue(id, value) {
  const el = qs(id);
  if (!el) return;
  el.value = value;
  el.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
  el.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

async function bootApp() {
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(
    normalizeConfig({
      moduleName: 'Recursos Humanos y Planilla',
      labels: { entity: 'Trabajador', entities: 'Trabajadores' },
      rrhh: { enabled: true, label: 'RRHH / Planilla', only: true }
    })
  );
}

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.sessionStorage = w.sessionStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
  w.sessionStorage.clear();
});

afterEach(() => {
  dom.window.close();
});

describe('Login flow (demo)', () => {
  it('muestra credenciales demo en pantalla', async () => {
    await bootApp();
    expect(qs('view-login').hidden).toBe(false);
    const text = document.body.textContent || '';
    expect(text).toContain('administrador/admin123');
    expect(text).toContain('analista/analista123');
    expect(text).toContain('jefatura/jefatura123');
    expect(text).toContain('trabajador/trabajador123');
  });

  it('muestra error con credenciales inválidas', async () => {
    await bootApp();
    setInputValue('login-role', 'administrador');
    setInputValue('login-password', 'wrong');
    const form = qs('login-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    const feedback = qs('login-feedback');
    expect(feedback.hidden).toBe(false);
    expect(feedback.textContent.toLowerCase()).toContain('credenciales');
    expect(qs('view-login').hidden).toBe(false);
  });

  it('inicia sesión como administrador y muestra workspace RRHH', async () => {
    await bootApp();
    setInputValue('login-role', 'administrador');
    setInputValue('login-password', 'admin123');
    const form = qs('login-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(qs('view-login').hidden).toBe(true);
    expect(qs('view-rrhh').hidden).toBe(false);
    expect(qs('rrhh-user-badge').hidden).toBe(false);
  });

  it('inicia sesión como analista y muestra workspace RRHH', async () => {
    await bootApp();
    setInputValue('login-role', 'analista');
    setInputValue('login-password', 'analista123');
    const form = qs('login-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(qs('view-login').hidden).toBe(true);
    expect(qs('view-rrhh').hidden).toBe(false);
  });

  it('inicia sesión como jefatura y muestra selección de representado', async () => {
    await bootApp();
    setInputValue('login-role', 'jefatura');
    setInputValue('login-password', 'jefatura123');
    const form = qs('login-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(qs('view-login').hidden).toBe(true);
    expect(qs('view-representado').hidden).toBe(false);
  });

  it('inicia sesión como trabajador y muestra selección de representado', async () => {
    await bootApp();
    setInputValue('login-role', 'trabajador');
    setInputValue('login-password', 'trabajador123');
    const form = qs('login-form');
    form.dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
    expect(qs('view-login').hidden).toBe(true);
    expect(qs('view-representado').hidden).toBe(false);
  });

  it('envía el formulario de acceso una sola vez al pulsar Entrar', async () => {
    await bootApp();
    setInputValue('login-role', 'administrador');
    setInputValue('login-password', 'admin123');

    const storageProto = Object.getPrototypeOf(window.localStorage);
    const spy = vi.spyOn(storageProto, 'setItem');
    try {
      qs('login-form').querySelector('button[type="submit"]').click();
      const writes = spy.mock.calls.filter(([key]) => key === SESSION_KEY);
      expect(writes).toHaveLength(1);
      expect(qs('view-rrhh').hidden).toBe(false);
    } finally {
      spy.mockRestore();
    }
  });

  it('muestra el botón de datos de prueba solo para Administrador', async () => {
    await bootApp();
    expect(qs('rrhh-seed-button').hidden).toBe(true);

    setInputValue('login-role', 'administrador');
    setInputValue('login-password', 'admin123');
    qs('login-form').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    expect(qs('rrhh-seed-button').hidden).toBe(false);

    qs('rrhh-logout-btn').click();
    expect(qs('rrhh-seed-button').hidden).toBe(true);

    setInputValue('login-role', 'trabajador');
    setInputValue('login-password', 'trabajador123');
    qs('login-form').dispatchEvent(
      new dom.window.Event('submit', { bubbles: true, cancelable: true })
    );
    expect(qs('rrhh-seed-button').hidden).toBe(true);
  });

  it('restaura datos con feedback claro y conserva la pestaña activa', async () => {
    const previousFlag = globalThis[SEED_DISABLE_FLAG];
    globalThis[SEED_DISABLE_FLAG] = false;
    try {
      await bootApp();
      setInputValue('login-role', 'administrador');
      setInputValue('login-password', 'admin123');
      qs('login-form').dispatchEvent(
        new dom.window.Event('submit', { bubbles: true, cancelable: true })
      );

      document.querySelector('[data-rrhh-tab="trabajadores"]').click();
      expect(qs('rrhh-panel-trabajadores').hidden).toBe(false);

      qs('rrhh-seed-button').click();

      const feedback = qs('rrhh-seed-feedback');
      expect(feedback.hidden).toBe(false);
      expect(feedback.textContent).toMatch(/Cargados: 12 trabajadores, 12 contratos/);
      expect(qs('view-rrhh').hidden).toBe(false);
      expect(qs('rrhh-panel-trabajadores').hidden).toBe(false);
    } finally {
      globalThis[SEED_DISABLE_FLAG] = previousFlag;
    }
  });

  it('muestra el aviso de rol al pulsar Ver sin permiso y lo limpia al cerrar sesión', async () => {
    const previousFlag = globalThis[SEED_DISABLE_FLAG];
    globalThis[SEED_DISABLE_FLAG] = false;
    try {
      await bootApp();
      setInputValue('login-role', 'jefatura');
      setInputValue('login-password', 'jefatura123');
      qs('login-form').dispatchEvent(
        new dom.window.Event('submit', { bubbles: true, cancelable: true })
      );

      const jefa = [...qs('rep-select').options].find((option) =>
        option.textContent.includes('TR-001')
      );
      setInputValue('rep-select', jefa.value);
      qs('rep-form').dispatchEvent(
        new dom.window.Event('submit', { bubbles: true, cancelable: true })
      );

      document.querySelector('[data-rrhh-tab="trabajadores"]').click();
      const ver = [...qs('rrhh-panel-trabajadores').querySelectorAll('button')].find(
        (button) => button.textContent === 'Ver'
      );
      expect(ver).toBeDefined();
      ver.click();

      const banner = qs('rrhh-role-feedback');
      expect(banner.hidden).toBe(false);
      expect(banner.textContent).toMatch(/no tiene permiso/i);

      qs('rrhh-logout-btn').click();
      expect(banner.hidden).toBe(true);
    } finally {
      globalThis[SEED_DISABLE_FLAG] = previousFlag;
    }
  });
});
