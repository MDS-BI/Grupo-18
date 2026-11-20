import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderResumenView } from '../../src/rrhh/views/resumen-view.js';

let dom;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><body></body>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
});

describe('Avisos del panel principal por rol (FR-114)', () => {
  it('la jefatura no ve alertas de contratos', () => {
    const html = renderResumenView({ viewer: { role: 'jefatura' } });
    expect(html).toContain('no tiene alertas de contratos');
    expect(html).not.toContain('rrhh-alertas-list');
  });

  it('el Trabajador ve su resumen sin sueldo base', () => {
    const html = renderResumenView({ viewer: { role: 'trabajador', trabajadorId: 'sin-contrato' } });
    expect(html).toContain('rrhh-resumen-trabajador');
    expect(html).toContain('rrhh-worker-summary');
    expect(html).toContain('rrhh-worker-summary__title');
    expect(html).toContain('Mi contrato');
    expect(html).toContain('No tienes un contrato registrado');
    expect(html).not.toContain('rrhh-alertas-list');
    expect(html).not.toMatch(/\$\s?\d/);
  });

  it('administrador/a y analista ven las alertas generales', () => {
    for (const role of ['administrador', 'analista']) {
      const html = renderResumenView({ viewer: { role } });
      expect(html).toContain('rrhh-alertas-list');
    }
  });
});
