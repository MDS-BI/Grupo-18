import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

beforeEach(async () => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  const w = dom.window;
  globalThis.window = w;
  globalThis.document = w.document;
  globalThis.localStorage = w.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  w.scrollTo = vi.fn();
  w.localStorage.clear();
});

afterEach(() => {
  dom.window.close();
});

async function bootWith(configOverride) {
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(configOverride));
}

describe('RRHH-only workspace shell', () => {
  it('muestra la pantalla de login al iniciar sin sesión', async () => {
    await bootWith(undefined);
    const loginView = document.getElementById('view-login');
    expect(loginView).not.toBeNull();
    expect(loginView.hidden).toBe(false);
    expect(document.getElementById('view-rrhh').hidden).toBe(true);
    expect(document.getElementById('rrhh-sidebar')).toBeNull();
  });
});
