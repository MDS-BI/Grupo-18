import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createDemoLiquidacion, formatMoney } from '../../src/rrhh/utils/liquidacion-data.js';
import { calcularLiquidacion } from '../../src/rrhh/utils/liquidacion-calculo.js';
import { clearLiquidaciones, loadLiquidacion } from '../../src/rrhh/utils/liquidacion-service.js';
import { renderLiquidacion } from '../../src/rrhh/views/liquidacion.js';

const store = new Map();
globalThis.localStorage = {
  getItem: (key) => (store.has(key) ? store.get(key) : null),
  setItem: (key, value) => store.set(key, String(value)),
  removeItem: (key) => store.delete(key),
  clear: () => store.clear()
};

let dom;

beforeEach(() => {
  store.clear();
  clearLiquidaciones();
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
  store.clear();
});

function mount(liquidacion, options = {}) {
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

describe('US5 - explanation and printing edge cases', () => {
  it('shows a manual line reason instead of a formula without omitting the line', () => {
    const liquidacion = createDemoLiquidacion();
    const result = mount(liquidacion);
    const manual = liquidacion.lineas.find((line) => line.manual);
    const row = dom.window.document.querySelector(`[data-line-id="${manual.id}"]`);
    expect(row).not.toBeNull();
    click(row);

    const panel = dom.window.document.getElementById('liq-explanation');
    expect(panel.textContent).toContain(manual.motivo);
    expect(panel.textContent).toContain('Motivo registrado');
    expect(panel.textContent).not.toContain('×');
    result.dispose();
  });

  it('keeps a line that has no legal parameter and displays a clear warning', () => {
    const liquidacion = createDemoLiquidacion();
    liquidacion.lineas[0] = { ...liquidacion.lineas[0], parametroLegal: null };
    const result = mount(liquidacion);
    expect(dom.window.document.querySelectorAll('.liq-line')).toHaveLength(liquidacion.lineas.length);

    click(dom.window.document.querySelector(`[data-line-id="${liquidacion.lineas[0].id}"]`));
    const panel = dom.window.document.getElementById('liq-explanation');
    expect(panel.textContent).toContain('sin parámetro legal');
    expect(panel.textContent).toContain(formatMoney(liquidacion.lineas[0].monto));
    result.dispose();
  });

  it('warns when the frozen parameter was not in force for the period', () => {
    const liquidacion = createDemoLiquidacion();
    liquidacion.lineas[0] = {
      ...liquidacion.lineas[0],
      parametroLegal: { ...liquidacion.lineas[0].parametroLegal, fechaVigencia: '2027-01-01' }
    };
    const result = mount(liquidacion);
    click(dom.window.document.querySelector(`[data-line-id="${liquidacion.lineas[0].id}"]`));
    const panel = dom.window.document.getElementById('liq-explanation');
    expect(panel.textContent).toContain('no estaba vigente');
    expect(panel.textContent).toContain(liquidacion.lineas[0].parametroLegal.codigo);
    result.dispose();
  });

  it('does not offer printing for drafts or annulled liquidations', () => {
    const draft = mount({ ...createDemoLiquidacion(), estado: 'borrador' });
    expect(dom.window.document.getElementById('liq-print')).toBeNull();
    draft.dispose();

    dom.window.document.getElementById('root').textContent = '';
    const annulled = mount({ ...createDemoLiquidacion(), estado: 'anulada' });
    expect(dom.window.document.getElementById('liq-print')).toBeNull();
    annulled.dispose();
  });

  it('uses frozen values for a closed paid period even if current parameters change', () => {
    const parametros = {
      SALUD: {
        codigo: 'SALUD',
        descripcion: 'Cotización de salud',
        fechaVigencia: '2026-01-01',
        valor: 0.07,
        fuente: 'Ley 18.933'
      }
    };
    const liquidacion = calcularLiquidacion({
      id: 'liq-cerrada-001',
      trabajador: { id: 'trab-001', nombre: 'María González', rut: '12.345.678-9' },
      periodo: {
        anio: 2026,
        mes: 9,
        etiqueta: 'Septiembre 2026',
        fechaInicio: '2026-09-01',
        fechaFin: '2026-09-30',
        cerrado: true
      },
      fechaEmision: '2026-09-30',
      estado: 'pagada',
      lineas: [
        { id: 'l1', concepto: 'Cotización de salud', tipo: 'descuento', base: 1000000, parametroCodigo: 'SALUD' }
      ],
      parametros
    });

    parametros.SALUD.valor = 0.12;
    const stored = loadLiquidacion('liq-cerrada-001');
    const result = mount(stored);
    click(dom.window.document.querySelector('[data-line-id="l1"]'));
    const panel = dom.window.document.getElementById('liq-explanation');

    expect(panel.textContent).toContain('7%');
    expect(panel.textContent).not.toContain('12%');
    expect(panel.textContent).toContain(formatMoney(70000));
    expect(dom.window.document.getElementById('liq-print')).not.toBeNull();
    result.dispose();
  });

  it('warns when issuer data is missing but still renders the receipt', () => {
    const liquidacion = { ...createDemoLiquidacion(), emisor: undefined };
    const result = mount(liquidacion, { empresa: {} });
    expect(dom.window.document.querySelector('.liq-warning').textContent).toContain(
      'Emisor no configurado'
    );
    expect(dom.window.document.querySelectorAll('.liq-line')).toHaveLength(liquidacion.lineas.length);
    result.dispose();
  });

  it('restores the view and selection after cancelling the print dialog', () => {
    const liquidacion = createDemoLiquidacion();
    const result = mount(liquidacion);
    const row = dom.window.document.querySelector('[data-line-id="l3"]');
    click(row);
    const beforeHtml = dom.window.document.getElementById('root').innerHTML;

    dom.window.dispatchEvent(new dom.window.Event('beforeprint'));
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(true);

    dom.window.dispatchEvent(new dom.window.Event('afterprint'));
    expect(dom.window.document.body.classList.contains('print-clean')).toBe(false);
    expect(dom.window.document.getElementById('root').innerHTML).toBe(beforeHtml);
    expect(row.getAttribute('aria-selected')).toBe('true');
    result.dispose();
  });
});
