import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  addDocument,
  addEntity,
  deleteDocument,
  deleteEntity,
  loadDocuments,
  loadEntities,
  loadGenericDocuments,
  loadGenericEntities,
  saveDocuments
} from '../../src/storage.js';
import { crearTrabajador } from '../../src/rrhh/utils/trabajadores-service.js';
import { createDemoLiquidacion } from '../../src/rrhh/utils/liquidacion-data.js';
import { saveLiquidacion } from '../../src/rrhh/utils/liquidacion-service.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function qs(id) {
  return document.getElementById(id);
}

function optionTexts(select) {
  return [...select.options].map((option) => option.textContent);
}

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
  vi.resetModules();
  const { boot } = await import('../../src/app.js');
  await boot();
});

afterEach(() => {
  dom.window.close();
});

function createWorker(name, code, rut) {
  return crearTrabajador(
    { name, code, rut },
    { role: 'analista', usuario: 'Analista RRHH' }
  );
}

describe('generic screens exclude RRHH-managed records', () => {
  it('does not list workers in generic entity selectors or search results', () => {
    addEntity({ name: 'Proveedor Andes', code: 'PROV-01' });
    createWorker('Ana Pérez', 'TRAB-001', '12.345.678-5');

    qs('nav-entities').click();
    const entityOptions = optionTexts(qs('edit-entity'));
    expect(entityOptions.some((text) => text.includes('Proveedor Andes'))).toBe(true);
    expect(entityOptions.some((text) => text.includes('Ana Pérez'))).toBe(false);

    qs('nav-search').click();
    qs('search-input').value = 'Ana';
    qs('search-input').dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    expect(qs('search-results-list').querySelectorAll('.entity-item').length).toBe(0);
  });

  it('does not delete a worker forced into the generic entity selector', () => {
    const worker = createWorker('Ana Pérez', 'TRAB-001', '12.345.678-5');
    const select = qs('edit-entity');
    const option = document.createElement('option');
    option.value = worker.id;
    option.textContent = 'Ana Pérez (trabajador forzado)';
    select.appendChild(option);
    select.value = worker.id;

    qs('delete-entity').click();

    expect(loadEntities().some((entity) => entity.id === worker.id)).toBe(true);
    expect(qs('entity-feedback').hidden).toBe(false);
    expect(qs('entity-feedback').textContent).toContain(
      'no se gestiona en la pantalla genérica'
    );
  });

  it('rejects deleting a worker from generic storage', () => {
    const generic = addEntity({ name: 'Proveedor Andes', code: 'PROV-01' });
    const worker = createWorker('Ana Pérez', 'TRAB-001', '12.345.678-5');

    let error;
    try {
      deleteEntity(worker.id);
    } catch (thrown) {
      error = thrown;
    }
    expect(error?.code).toBe('TRABAJADOR_RRHH_NO_ELIMINABLE');
    expect(error?.message).toContain('Trabajadores');
    expect(loadGenericEntities().map((entity) => entity.name)).toEqual(['Proveedor Andes']);

    deleteEntity(generic.id);
    expect(loadGenericEntities()).toHaveLength(0);
  });

  it('does not list liquidations in generic document selectors and rejects their deletion', () => {
    const generic = addEntity({ name: 'Proveedor Andes', code: 'PROV-01' });
    const worker = createWorker('Ana Pérez', 'TRAB-001', '12.345.678-5');
    const genericDocument = addDocument({
      entityId: generic.entity_id,
      folio: 1001,
      startDate: '2026-09-01',
      endDate: '2026-09-30'
    });
    const liquidacion = saveLiquidacion(createDemoLiquidacion());
    saveDocuments([
      ...loadDocuments(),
      {
        id: liquidacion.id,
        entity_id: worker.entityId,
        folio: 9001,
        startDate: '2026-09-01',
        endDate: '2026-09-30'
      }
    ]);

    qs('nav-documents').click();
    const documentOptions = [...qs('edit-document').options].map((option) => option.value);
    expect(documentOptions).toContain(genericDocument.id);
    expect(documentOptions).not.toContain(liquidacion.id);
    expect(optionTexts(qs('document-entity')).some((text) => text.includes('Ana Pérez'))).toBe(
      false
    );
    expect(loadGenericDocuments().map((documentRecord) => documentRecord.id)).toEqual([
      genericDocument.id
    ]);

    let error;
    try {
      deleteDocument(liquidacion.id);
    } catch (thrown) {
      error = thrown;
    }
    expect(error?.code).toBe('LIQUIDACION_RRHH_NO_ELIMINABLE');
    expect(error?.message).toContain('Liquidaciones');
  });
});
