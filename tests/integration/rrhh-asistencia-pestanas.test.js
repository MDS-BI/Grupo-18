import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RRHH_ROUTES } from '../../src/rrhh/views/rrhh-router.js';
import { RrhhWorkspace } from '../../src/rrhh/views/workspace.js';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

function makeDom() {
  const dom = new JSDOM(
    `<!DOCTYPE html><body><div id="view-rrhh">
      <button data-rrhh-tab="resumen" role="tab">Resumen</button>
      <button data-rrhh-tab="trabajadores" role="tab">Trabajadores</button>
      <button data-rrhh-tab="novedades" role="tab">Asistencia</button>
      <button data-rrhh-tab="liquidaciones" role="tab">Liquidaciones</button>
      <div id="rrhh-panel-resumen" hidden></div>
      <div id="rrhh-panel-trabajadores" hidden></div>
      <div id="rrhh-panel-novedades" hidden></div>
      <div id="rrhh-panel-liquidaciones" hidden></div>
    </div></body>`,
    { url: 'http://localhost/' }
  );
  return dom;
}

describe('Rótulo Asistencia y pestañas del Trabajador', () => {
  it('usa Asistencia como rótulo de la pestaña superior', () => {
    expect(RRHH_ROUTES.novedades).toBe('Asistencia');
    const html = readFileSync(`${rootDir}index.html`, 'utf8');
    expect(html).toMatch(/data-rrhh-tab="novedades"[^>]*>Asistencia<\/button>/);
  });

  it('vincula pestañas y paneles con aria-controls y aria-labelledby', () => {
    const html = readFileSync(`${rootDir}index.html`, 'utf8');
    const doc = new JSDOM(html).window.document;
    for (const name of ['resumen', 'novedades', 'liquidaciones', 'auditoria']) {
      const tab = doc.querySelector(`[data-rrhh-tab="${name}"]`);
      const panel = doc.getElementById(`rrhh-panel-${name}`);
      expect(tab.id).toBe(`rrhh-tab-${name}`);
      expect(tab.getAttribute('aria-controls')).toBe(panel.id);
      expect(panel.getAttribute('aria-labelledby')).toBe(tab.id);
    }
  });

  it('muestra solo Resumen y Liquidaciones al Trabajador', () => {
    const dom = makeDom();
    const doc = dom.window.document;
    const workspace = new RrhhWorkspace({
      doc,
      config: { rrhh: { enabled: true } },
      viewer: { role: 'trabajador', trabajadorId: 't-1' }
    });
    const visible = [...doc.querySelectorAll('[data-rrhh-tab]')]
      .filter((tab) => !tab.hidden)
      .map((tab) => tab.dataset.rrhhTab);
    expect(visible).toEqual(['resumen', 'liquidaciones']);
    const liquidacionesTab = doc.querySelector('[data-rrhh-tab="liquidaciones"]');
    expect(liquidacionesTab.getAttribute('aria-controls')).toBe('rrhh-panel-liquidaciones');
    expect(doc.getElementById('rrhh-panel-liquidaciones').getAttribute('aria-labelledby')).toBe(
      liquidacionesTab.id
    );
    workspace.dispose();
    dom.window.close();
  });
});
