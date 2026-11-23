import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  createDemoLiquidacion,
  formatMoney,
  totals
} from '../../src/rrhh/utils/liquidacion-data.js';
import { createPrintController, renderLiquidacion } from '../../src/rrhh/views/liquidacion.js';

const css = fs.readFileSync(
  fileURLToPath(new URL('../../src/styles.css', import.meta.url)),
  'utf8'
);

function printRuleSet() {
  const source = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const start = source.search(/@media\s+print/);
  expect(start).toBeGreaterThanOrEqual(0);
  const open = source.indexOf('{', start);
  let depth = 0;
  let close = -1;
  for (let index = open; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}' && --depth === 0) {
      close = index;
      break;
    }
  }
  expect(close).toBeGreaterThan(open);
  const body = source.slice(open + 1, close);
  const rules = [];
  let cursor = 0;
  while (cursor < body.length) {
    const ruleOpen = body.indexOf('{', cursor);
    if (ruleOpen === -1) break;
    const selectors = body
      .slice(cursor, ruleOpen)
      .split(',')
      .map((selector) => selector.trim())
      .filter(Boolean);
    let level = 1;
    let ruleClose = ruleOpen + 1;
    while (ruleClose < body.length && level > 0) {
      if (body[ruleClose] === '{') level += 1;
      if (body[ruleClose] === '}' && --level === 0) break;
      ruleClose += 1;
    }
    rules.push({
      selectors,
      declarations: body
        .slice(ruleOpen + 1, ruleClose)
        .split(';')
        .map((declaration) => declaration.trim().replace(/\s*!important\s*$/, ''))
        .filter(Boolean)
    });
    cursor = ruleClose + 1;
  }
  return rules;
}

function hasDecl(selector, prop, value) {
  const prefix = `${prop}:`;
  return printRuleSet().some(
    (rule) =>
      rule.selectors.includes(selector) &&
      rule.declarations.some((declaration) => {
        if (!declaration.startsWith(prefix)) return false;
        const actual = declaration.slice(prefix.length).trim();
        return value instanceof RegExp ? value.test(actual) : actual === value;
      })
  );
}

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

  it('mueve el detalle de Ver liquidación a la hoja de impresión y lo devuelve después', () => {
    const result = mount();
    const detalle = dom.window.document.getElementById('root');
    const padreOriginal = detalle.parentNode;
    const siguienteOriginal = detalle.nextSibling;
    const boton = dom.window.document.getElementById('liq-print');

    click(boton);

    const host = dom.window.document.getElementById('rrhh-print-host');
    expect(host).not.toBeNull();
    expect(detalle.parentNode).toBe(host);
    expect(host.textContent).toContain('Detalle de la liquidación');
    expect(host.textContent).toContain('Líquido a pagar');

    dom.window.dispatchEvent(new dom.window.Event('afterprint'));
    expect(detalle.parentNode).toBe(padreOriginal);
    expect(detalle.nextSibling).toBe(siguienteOriginal);
    expect(dom.window.document.getElementById('rrhh-print-host')).toBeNull();
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
    const paid = mount({
      ...createDemoLiquidacion(),
      estado: 'pagada',
      periodo: { ...createDemoLiquidacion().periodo, cerrado: true }
    });
    expect(dom.window.document.getElementById('liq-print')).not.toBeNull();
    paid.dispose();
  });

  it('includes company, worker, period, detail, totals, net pay and issue date in the printable content', () => {
    const liquidacion = createDemoLiquidacion();
    const result = mount(liquidacion, {
      empresa: {
        razonSocial: 'Comercial Andes SpA',
        rut: '76.543.210-K',
        direccion: 'Av. Providencia 1234'
      }
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

  it('no repite el cargo cuando un dato guardado lo trae también como departamento', () => {
    const base = createDemoLiquidacion();
    const cargo = base.trabajador.cargo;
    const result = mount({
      ...base,
      trabajador: { ...base.trabajador, departamento: cargo }
    });

    const bloque = dom.window.document.querySelector('.liq-worker-name').parentElement;
    expect(bloque.textContent.split(cargo).length - 1).toBe(1);
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

  it('declares print rules that isolate the comprobante and keep selected explanations', () => {
    expect(printRuleSet().length).toBeGreaterThan(0);
    expect(hasDecl('.print-clean .topbar', 'display', 'none')).toBe(true);
    expect(hasDecl('.print-clean .sidebar', 'display', 'none')).toBe(true);
    expect(hasDecl('.print-clean .nav-module', 'display', 'none')).toBe(true);
    expect(hasDecl('.print-clean #view-rrhh > .view-header', 'display', 'none')).toBe(true);
    expect(
      hasDecl('.print-clean #rrhh-liquidaciones-view > .rrhh-list-container', 'display', 'none')
    ).toBe(true);
    expect(
      hasDecl('.print-clean #liq-explanation > .liq-explanation-hint', 'display', 'none')
    ).toBe(true);
    expect(hasDecl('.print-clean #liq-explanation', 'display', 'none')).toBe(false);
    expect(hasDecl('.print-clean #rrhh-liquidacion-root', 'width', '100%')).toBe(true);
    expect(hasDecl('.print-clean #rrhh-print-host', 'display', 'block')).toBe(true);
    expect(hasDecl('.print-clean .app-shell', 'display', 'none')).toBe(true);
    expect(hasDecl('.print-clean .liq-line', 'page-break-inside', 'avoid')).toBe(true);
    expect(hasDecl('.print-clean .liq-meta-block', 'page-break-inside', 'avoid')).toBe(true);
    expect(hasDecl('@page', 'size', /^(letter|A4)/i)).toBe(true);
  });
});
