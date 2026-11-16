import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createDemoLiquidacion, totals, formatMoney } from '../../src/rrhh/utils/liquidacion-data.js';
import { renderLiquidacion } from '../../src/rrhh/views/liquidacion.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id) {
  return document.getElementById(id);
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  vi.restoreAllMocks();
});

afterEach(() => {
  dom.window.close();
});

function mount(options = {}) {
  const liquidacion = options.liquidacion || createDemoLiquidacion();
  const root = qs('root');
  const result = renderLiquidacion(root, liquidacion, {
    doc: dom.window.document,
    win: dom.window,
    viewer: options.viewer || { role: 'analista_rrhh' },
    empresa: options.empresa,
    ...options
  });
  return { result, liquidacion, root };
}

function click(element) {
  element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

function keydown(element, key) {
  element.dispatchEvent(
    new dom.window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  );
}

describe('US5 - explanatory liquidation view', () => {
  it('renders every line with its concept, type and amount', () => {
    const { liquidacion, root } = mount();
    const rows = root.querySelectorAll('.liq-line');

    expect(rows).toHaveLength(liquidacion.lineas.length);
    for (const line of liquidacion.lineas) {
      const row = root.querySelector(`[data-line-id="${line.id}"]`);
      expect(row).not.toBeNull();
      expect(row.textContent).toContain(line.concepto);
      expect(row.textContent).toContain(formatMoney(line.monto));
    }
    expect(root.querySelectorAll('[data-tipo="haber"] .liq-line').length).toBe(3);
    expect(root.querySelectorAll('[data-tipo="descuento"] .liq-line').length).toBe(3);
    expect(root.querySelectorAll('[data-tipo="impuesto"] .liq-line').length).toBe(1);
  });

  it('shows base, rate, formula, amount and legal parameter when a line is selected', () => {
    const { root } = mount();
    const row = root.querySelector('[data-line-id="l2"]');
    click(row);

    expect(row.getAttribute('aria-selected')).toBe('true');
    expect(root.querySelectorAll('.liq-line[aria-selected="true"]')).toHaveLength(1);

    const panel = qs('liq-explanation');
    expect(panel.textContent).toContain('Gratificación legal');
    expect(panel.textContent).toContain('$1.200.000');
    expect(panel.textContent).toContain('25%');
    expect(panel.textContent).toContain('$1.200.000 × 25% = $300.000');
    expect(panel.textContent).toContain('GRATIFICACION_LEGAL');
    expect(panel.textContent).toContain('01/01/2026');
    expect(panel.textContent).toContain('Código del Trabajo');
  });

  it('keeps totals consistent with the line amounts', () => {
    const { liquidacion, root } = mount();
    const expected = totals(liquidacion);
    expect(root.querySelector('[data-total="haberes"]').textContent).toContain(
      formatMoney(expected.haberes)
    );
    expect(root.querySelector('[data-total="descuentos"]').textContent).toContain(
      formatMoney(expected.descuentos)
    );
    expect(root.querySelector('[data-total="impuestos"]').textContent).toContain(
      formatMoney(expected.impuestos)
    );
    expect(root.querySelector('[data-total="liquido"]').textContent).toContain(
      formatMoney(expected.liquido)
    );
  });

  it('supports keyboard selection and focus', () => {
    const { root } = mount();
    const first = root.querySelector('[data-line-id="l1"]');
    const list = root.querySelector('[data-tipo="haber"] .liq-lines');
    first.focus();
    keydown(first, 'ArrowDown');

    expect(root.querySelector('[data-line-id="l2"]').getAttribute('aria-selected')).toBe('true');
    expect(dom.window.document.activeElement.dataset.lineId).toBe('l2');

    keydown(dom.window.document.activeElement, 'End');
    expect(dom.window.document.activeElement.getAttribute('aria-selected')).toBe('true');
    expect(list.getAttribute('role')).toBe('listbox');
  });

  it('denies access to a worker viewing another worker liquidation', () => {
    const { root } = mount({ viewer: { role: 'trabajador', trabajadorId: 'otro-trabajador' } });
    expect(root.querySelector('.rrhh-access-denied')).not.toBeNull();
    expect(root.querySelectorAll('.liq-line')).toHaveLength(0);
    expect(root.querySelector('#liq-print')).toBeNull();
  });

  it('allows a worker to see their own liquidation', () => {
    const liquidacion = createDemoLiquidacion();
    const { root } = mount({
      liquidacion,
      viewer: { role: 'trabajador', trabajadorId: liquidacion.trabajador.id }
    });
    expect(root.querySelectorAll('.liq-line').length).toBe(liquidacion.lineas.length);
  });

  it('integrates the RRHH navigation and view into the ERP shell', async () => {
    const integrationDom = new JSDOM(html, { url: 'http://localhost/' });
    globalThis.window = integrationDom.window;
    globalThis.document = integrationDom.window.document;
    globalThis.localStorage = integrationDom.window.localStorage;
    globalThis.alert = vi.fn();
    globalThis.confirm = vi.fn(() => true);
    integrationDom.window.scrollTo = vi.fn();
    integrationDom.window.localStorage.clear();
    vi.resetModules();

    try {
      const { initApp } = await import('../../src/app.js');
      const { normalizeConfig } = await import('../../src/module-config.js');
      await initApp(
        normalizeConfig({
          moduleName: 'Recursos Humanos y Planilla',
          labels: {
            entity: 'Trabajador',
            entities: 'Trabajadores',
            document: 'Liquidación',
            documents: 'Liquidaciones'
          },
          rrhh: { enabled: true, label: 'RRHH / Planilla' },
          empresa: { razonSocial: 'Comercial Andes SpA', rut: '76.543.210-K' }
        })
      );

      expect(document.querySelectorAll('.nav-module')).toHaveLength(5);
      expect(qs('nav-rrhh')).not.toBeNull();
      qs('nav-rrhh').click();
      expect(qs('view-rrhh').hidden).toBe(false);
      expect(qs('rrhh-liquidacion-root').querySelector('.rrhh-liquidacion')).not.toBeNull();
      expect(qs('rrhh-liquidacion-root').querySelector('#liq-print')).not.toBeNull();
    } finally {
      integrationDom.window.close();
    }
  });
});
