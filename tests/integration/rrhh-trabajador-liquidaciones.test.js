import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { loadSeedData, PERIODO_CERRADO, SEED_DISABLE_FLAG } from '../../src/rrhh/data/seed.js';
import { listLiquidacionesPeriodo } from '../../src/rrhh/utils/liquidacion-service.js';
import { renderLiquidacionesView } from '../../src/rrhh/views/liquidaciones.js';

let dom;
let previousStorage;
let previousDisableFlag;
let previousDocument;
let previousWindow;

beforeEach(() => {
  previousStorage = globalThis.localStorage;
  previousDisableFlag = globalThis[SEED_DISABLE_FLAG];
  previousDocument = globalThis.document;
  previousWindow = globalThis.window;

  dom = new JSDOM('<!DOCTYPE html><body><div id="root"></div></body>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis[SEED_DISABLE_FLAG] = false;
  dom.window.print = () => {};
  loadSeedData({ reset: true, mark: false });
});

afterEach(() => {
  globalThis[SEED_DISABLE_FLAG] = previousDisableFlag;
  globalThis.localStorage = previousStorage;
  globalThis.document = previousDocument;
  globalThis.window = previousWindow;
  dom.window.close();
});

describe('Liquidaciones del Trabajador (US5/US6)', () => {
  it('muestra las liquidaciones del período cerrado del representado', () => {
    const propias = listLiquidacionesPeriodo(PERIODO_CERRADO);
    expect(propias.length).toBeGreaterThan(0);
    const trabajadorId = propias[0].trabajador.entityId;
    const esperadas = propias.filter(
      (row) => String(row.trabajador?.entityId || row.trabajador?.id) === String(trabajadorId)
    );

    const root = document.getElementById('root');
    const vista = renderLiquidacionesView(root, {
      doc: document,
      viewer: { role: 'trabajador', usuario: 'Trabajador Demo', trabajadorId }
    });

    const filas = [...document.querySelectorAll('#liquidaciones-list [data-liquidacion-id]')];
    expect(filas).toHaveLength(esperadas.length);
    expect(
      filas.every((fila) =>
        [...document.querySelectorAll('#liquidaciones-list [data-liquidacion-id]')].includes(fila)
      )
    ).toBe(true);
    expect(document.getElementById('rrhh-liquidacion-root').hidden).toBe(true);

    const boton = filas[0].querySelector('button');
    expect(boton.textContent).toBe('Ver liquidación');

    boton.click();
    const detalle = document.getElementById('rrhh-liquidacion-root');
    expect(detalle.hidden).toBe(false);
    expect(detalle.parentElement).toBe(filas[0]);

    const cargo = propias[0].trabajador.cargo;
    if (cargo) {
      const ocurrencias = detalle.textContent.split(cargo).length - 1;
      expect(ocurrencias).toBe(1);
    }

    document.getElementById('liq-print').click();
    const host = document.getElementById('rrhh-print-host');
    expect(host).not.toBeNull();
    expect(detalle.parentElement).toBe(host);
    expect(host.textContent).toContain('Detalle de la liquidación');
    expect(host.textContent).toContain('Líquido a pagar');

    dom.window.dispatchEvent(new dom.window.Event('afterprint'));
    expect(detalle.parentElement).toBe(filas[0]);
    expect(document.getElementById('rrhh-print-host')).toBeNull();
    vista.dispose();
  });
});
