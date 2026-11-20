import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

const liquidacion = {
  id: 'liq-1',
  numero: 'LIQ-1',
  estado: 'aprobada',
  periodo: { etiqueta: '2026-11', cerrado: true },
  trabajador: { nombre: 'Ana Pérez', id: 't-1' }
};

vi.mock('../../src/rrhh/utils/liquidacion-service.js', () => ({
  listLiquidaciones: () => [liquidacion],
  loadLiquidacion: () => null,
  cambiarEstadoLiquidacion: () => liquidacion
}));

vi.mock('../../src/rrhh/views/liquidacion.js', () => ({
  renderLiquidacion: (root) => {
    root.textContent = 'DETALLE DE LIQUIDACIÓN';
    return { dispose() {} };
  }
}));

vi.mock('../../src/rrhh/seguridad/auditoria.js', () => ({
  registrarAuditoria: () => true
}));

const { renderLiquidacionesView } = await import('../../src/rrhh/views/liquidaciones.js');

let dom;
let root;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><body><div id="root"></div></body>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  root = document.getElementById('root');
});

describe('Ver liquidación despliega bajo la persona seleccionada (FR-115)', () => {
  it('no muestra ningún detalle calculado antes de pulsar Ver liquidación', () => {
    const vista = renderLiquidacionesView(root, {
      doc: document,
      viewer: { role: 'administrador', usuario: 'Admin' }
    });
    const detalle = document.getElementById('rrhh-liquidacion-root');
    expect(detalle.textContent).toBe('');
    expect(detalle.hidden).toBe(true);
    expect(document.getElementById('liq-approve')).toBeNull();
    vista.dispose();
  });

  it('el detalle queda dentro del registro seleccionado, no al final', () => {
    const vista = renderLiquidacionesView(root, {
      doc: document,
      viewer: { role: 'administrador', usuario: 'Admin' }
    });
    const boton = [...document.querySelectorAll('button')].find(
      (node) => node.textContent === 'Ver liquidación'
    );
    boton.click();
    const detalle = document.getElementById('rrhh-liquidacion-root');
    expect(detalle.textContent).toContain('DETALLE DE LIQUIDACIÓN');
    expect(detalle.parentElement).toBe(
      document.querySelector('[data-liquidacion-id="liq-1"]')
    );
    vista.dispose();
  });
});
