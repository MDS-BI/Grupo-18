import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

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
});
