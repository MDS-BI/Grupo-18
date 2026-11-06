import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import { createDemoLiquidacion, formatMoney, totals } from '../../src/rrhh/utils/liquidacion-data.js';
import { createPrintController, renderLiquidacion } from '../../src/rrhh/views/liquidacion.js';

const css = fs.readFileSync(fileURLToPath(new URL('../../src/styles.css', import.meta.url)), 'utf8');

let dom;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  dom.window.print = vi.fn();
  vi.restoreAllMocks();
});

afterEach(() => {
  dom.window.close();
});

function mount(liquidacion = createDemoLiquidacion(), options = {}) {
  return renderLiquidacion(dom.window.document.getElementById('root'), liquidacion, {
    doc: dom.window.document,
    win: dom.window,
    viewer: { role: 'analista_rrhh' },
    ...options
  });
}

function click(element) {
  element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

describe('US5 - clean printing and PDF', () => {
  it('offers a print action for a calculated liquidation', () => {
    const result = mount();
    const button = dom.window.document.getElementById('liq-print');
    expect(button).not.toBeNull();
    expect(button.textContent).toContain('Imprimir');
    expect(button.getAttribute('aria-label')).toContain('PDF');

    click(button);
    expect(dom.window.print).toHaveBeenCalledTimes(1);
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(true);
    result.dispose();
  });

  it('restores the screen state after printing or cancelling the dialog', () => {
    const result = mount();
    const selected = dom.window.document.querySelector('[data-line-id="l2"]');
    click(selected);

    dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(true);

    dom.window.dispatchEvent(new dom.window.Event('afterprint'));
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(false);
    expect(selected.getAttribute('aria-selected')).toBe('true');
    expect(dom.window.document.querySelectorAll('.liq-line')).toHaveLength(7);
    result.dispose();
  });

  it('uses matchMedia as a fallback when print events are unavailable', () => {
    let handler = null;
    const mediaQuery = {
      matches: false,
      addEventListener: (type, listener) => {
        if (type === 'change') handler = listener;
      },
      removeEventListener: vi.fn()
    };
    const controller = createPrintController({
      root: dom.window.document.body,
      win: dom.window,
      mediaQuery
    });

    handler({ matches: true });
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(true);
    handler({ matches: false });
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(false);
    controller.dispose();
  });

  it('hides the print action for a draft and keeps it for a paid liquidation', () => {
    const draft = mount({ ...createDemoLiquidacion(), estado: 'borrador' });
    expect(dom.window.document.getElementById('liq-print')).toBeNull();
    draft.dispose();

    dom.window.document.getElementById('root').textContent = '';
    const paid = mount({ ...createDemoLiquidacion(), estado: 'pagada', periodo: { ...createDemoLiquidacion().periodo, cerrado: true } });
    expect(dom.window.document.getElementById('liq-print')).not.toBeNull();
    paid.dispose();
  });

  it('includes company, worker, period, detail, totals, net pay and issue date in the printable content', () => {
    const liquidacion = createDemoLiquidacion();
    const result = mount(liquidacion, {
      empresa: { razonSocial: 'Comercial Andes SpA', rut: '76.543.210-K', direccion: 'Av. Providencia 1234' }
    });
    const text = dom.window.document.getElementById('root').textContent;
    const expected = totals(liquidacion);

    expect(text).toContain('Comercial Andes SpA');
    expect(text).toContain('76.543.210-K');
    expect(text).toContain(liquidacion.trabajador.nombre);
    expect(text).toContain(liquidacion.trabajador.rut);
    expect(text).toContain(liquidacion.periodo.etiqueta);
    expect(text).toContain('30/09/2026');
    expect(text).toContain(formatMoney(expected.haberes));
    expect(text).toContain(formatMoney(expected.descuentos));
    expect(text).toContain(formatMoney(expected.impuestos));
    expect(text).toContain(formatMoney(expected.liquido));
    for (const line of liquidacion.lineas) expect(text).toContain(line.concepto);
    result.dispose();
  });

  it('does not render editable or navigation controls inside the printable view', () => {
    const result = mount();
    const root = dom.window.document.getElementById('root');
    expect(root.querySelectorAll('input, select, textarea')).toHaveLength(0);
    expect(root.querySelector('.topbar')).toBeNull();
    expect(root.querySelector('.sidebar')).toBeNull();
    expect(root.querySelector('.nav-module')).toBeNull();
    expect(root.querySelectorAll('button')).toHaveLength(1);
    expect(root.querySelector('button#liq-print')).not.toBeNull();
    result.dispose();
  });

  it('declares print rules that hide application chrome and avoid page breaks inside sections', () => {
    expect(css).toMatch(/@media\s+print/);
    expect(css).toMatch(/\.print-clean[^{]*\.topbar|\.topbar[^{]*\{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.print-clean[^{]*\.sidebar|\.sidebar[^{]*\{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.print-clean[^{]*\.nav-module|\.nav-module[^{]*\{[^}]*display:\s*none/s);
    expect(css).toMatch(/page-break-inside:\s*avoid/);
    expect(css).toMatch(/size:\s*(letter|A4)/i);
  });
});
