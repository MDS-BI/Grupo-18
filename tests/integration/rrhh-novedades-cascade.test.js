import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  addEntity,
  addDocument,
  deleteEntity,
  loadDocuments,
  loadEntities
} from '../../src/storage.js';
import {
  crearNovedad,
  listNovedades
} from '../../src/rrhh/utils/novedades-service.js';
import { validarNovedad } from '../../src/rrhh/utils/novedades-data.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const admin = { role: 'administrador', usuario: 'Administrador' };

let dom;

function novedad(worker, extra = {}) {
  return {
    trabajadorEntityId: worker.entity_id,
    periodo: '2026-09',
    tipo: 'horas_extra',
    cantidad: 3,
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-03',
    ...extra
  };
}

function addLiquidation(worker, estado) {
  localStorage.setItem(
    'erp_rrhh:liquidaciones',
    JSON.stringify([
      {
        id: `liq-${estado}`,
        estado,
        trabajador: {
          id: worker.entity_id,
          entityId: worker.entity_id,
          nombre: worker.name,
          rut: worker.rut
        },
        totales: { haberes: 1000000, liquido: 900000 }
      }
    ])
  );
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  abrirPeriodo('2026-09', admin);
});

afterEach(() => {
  dom.window.close();
});

describe('US14 - worker entity link and cascade deletion', () => {
  it('requires the novedad to reference an existing worker entity', () => {
    const worker = addEntity({ name: 'Fabian Perez', code: 'TRAB-006', rut: '12.345.678-5' });
    expect(
      validarNovedad(novedad(worker), { entities: loadEntities() }).valid
    ).toBe(true);

    const invalid = validarNovedad(
      { ...novedad(worker), trabajadorEntityId: 'no-existe' },
      { entities: loadEntities() }
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join(' ')).toMatch(/no existe/i);
  });

  it('deletes novedades and documents in cascade when there are no closed liquidations', () => {
    const worker = addEntity({ name: 'Gabriela Nunez', code: 'TRAB-007', rut: '12.345.678-5' });
    const document = addDocument({
      entity_id: worker.entity_id,
      folio: 1,
      startDate: '2026-09-01',
      endDate: '2026-09-30'
    });
    crearNovedad(novedad(worker), analista);
    expect(listNovedades()).toHaveLength(1);
    expect(loadDocuments()).toHaveLength(1);

    expect(deleteEntity(worker.id)).toBe(true);
    expect(loadEntities()).toHaveLength(0);
    expect(listNovedades()).toHaveLength(0);
    expect(loadDocuments()).toHaveLength(0);
    expect(document.id).toBeTruthy();
  });

  for (const estado of ['aprobada', 'pagada']) {
    it(`applies logical deletion and retains novedades with a ${estado} liquidation`, () => {
      const worker = addEntity({
        name: `Worker ${estado}`,
        code: `TRAB-${estado}`,
        rut: '12.345.678-5'
      });
      crearNovedad(novedad(worker), analista);
      addLiquidation(worker, estado);

      expect(deleteEntity(worker.id)).toBe(true);
      const stored = loadEntities().find((row) => row.id === worker.id);
      expect(stored).toBeTruthy();
      expect(stored.bajaLogica).toBe(true);
      expect(stored.activo).toBe(false);
      expect(stored.deletedAt).toBeTruthy();
      expect(listNovedades({ trabajadorEntityId: worker.entity_id })).toHaveLength(1);
    });
  }

  it('still deletes normally when the liquidation is only calculated', () => {
    const worker = addEntity({ name: 'Hugo Lara', code: 'TRAB-008', rut: '12.345.678-5' });
    crearNovedad(novedad(worker), analista);
    addLiquidation(worker, 'calculada');

    deleteEntity(worker.id);
    expect(loadEntities()).toHaveLength(0);
    expect(listNovedades()).toHaveLength(0);
  });
});
