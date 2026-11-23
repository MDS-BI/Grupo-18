import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { normalizeConfig } from '../../src/module-config.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
const css = fs.readFileSync(fileURLToPath(new URL('../../src/styles.css', import.meta.url)), 'utf8');

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

  it('aplica el acento configurado sin renderizar el shell completo', async () => {
    const originalTitle = document.title;
    await bootWith({ theme: { accentColor: '#123456' } });
    expect(document.documentElement.style.getPropertyValue('--accent')).toBe('#123456');
    expect(document.getElementById('logo-mark').textContent).toBe('');
    expect(document.title).toBe(originalTitle);
  });
});

describe('Verificación estructural T152/SC-031 de src/styles.css', () => {
  it('cubre 768 px con reglas responsive y 1920 px con el layout base', () => {
    const breakpoints = [...css.matchAll(/@media\s*\(max-width:\s*(\d+)px\)/g)].map((match) =>
      Number(match[1])
    );
    expect(breakpoints).toContain(768);
    expect(Math.max(...breakpoints)).toBeGreaterThanOrEqual(768);
    expect(breakpoints.every((width) => width < 1920)).toBe(true);
    expect(css).toMatch(/\.workspace\s*\{[^}]*grid-template-columns:\s*232px minmax\(0, 1fr\)/s);
  });

  it('usa ancho completo con tope y confina el scroll a tablas y listas anchas', () => {
    expect(css).toMatch(/\.main-content\s*\{[^}]*max-width:\s*\d+px[^}]*width:\s*100%/s);
    expect(css).toMatch(/\.rrhh-main-only\s*\{[^}]*max-width:\s*\d+px[^}]*width:\s*100%/s);
    expect(css).toMatch(/\.rrhh-list-container\s*\{[^}]*overflow-x:\s*auto/s);
    expect(css).toMatch(/\.rrhh-table-cell\s*\{[^}]*overflow-wrap:\s*anywhere/s);
    expect(css).toMatch(/\.rrhh-list-meta[^{}]*\{[^}]*overflow-wrap:\s*anywhere/s);
  });

  it('no define variables --color-* ni oculta el desbordamiento horizontal global', () => {
    expect(css).not.toMatch(/--color-/);
    for (const match of css.matchAll(/(?:html|body)\s*\{([^}]*)\}/g)) {
      expect(match[1]).not.toMatch(/overflow-x:\s*hidden/);
    }
  });
});
