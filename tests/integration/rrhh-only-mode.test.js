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

beforeEach(() => {
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

async function bootWith(config) {
  vi.resetModules();
  const { initApp } = await import('../../src/app.js');
  await initApp(normalizeConfig(config), { exclusive: true });
}

const rrhhOnlyConfig = {
  moduleName: 'Recursos Humanos y Planilla',
  rrhh: { enabled: true, label: 'RRHH / Planilla', only: true }
};

describe('RRHH-only mode', () => {
  it('opens directly in the RRHH workspace and hides every generic screen', async () => {
    await bootWith(rrhhOnlyConfig);

    expect(document.body.classList.contains('rrhh-only')).toBe(true);
    expect(qs('view-rrhh').hidden).toBe(false);
    expect(qs('nav-rrhh').hidden).toBe(false);
    expect(qs('nav-rrhh').getAttribute('aria-current')).toBe('page');
    expect(qs('brand-name').textContent).toBe('Recursos Humanos y Planilla');

    for (const id of ['view-dashboard', 'view-entities', 'view-documents', 'view-search']) {
      expect(qs(id).hidden).toBe(true);
    }
    for (const id of ['nav-dashboard', 'nav-entities', 'nav-documents', 'nav-search']) {
      expect(qs(id).hidden).toBe(true);
    }
  });

  it('cannot be redirected to a generic screen by activating a hidden button', async () => {
    await bootWith(rrhhOnlyConfig);

    qs('nav-entities').click();
    expect(qs('view-entities').hidden).toBe(true);
    expect(qs('view-rrhh').hidden).toBe(false);

    qs('action-new-entity').click();
    expect(qs('view-documents').hidden).toBe(true);
    expect(qs('view-rrhh').hidden).toBe(false);
  });

  it('keeps the generic dashboard as the entry point when only is disabled', async () => {
    await bootWith({ moduleName: 'Módulo Base ERP' });

    expect(document.body.classList.contains('rrhh-only')).toBe(false);
    expect(qs('view-dashboard').hidden).toBe(false);
    expect(qs('nav-entities').hidden).toBe(false);
    expect(qs('nav-rrhh')).toBeNull();
  });
});
