import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addDocument, loadDocuments, loadEntities } from '../../src/storage.js';
import {
  aprobarNovedad,
  crearNovedad,
  listNovedades
} from '../../src/rrhh/utils/novedades-service.js';
import { validarNovedad } from '../../src/rrhh/utils/novedades-data.js';
import {
  actualizarTrabajador,
  crearTrabajador,
  desactivarTrabajador,
  getTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { crearContrato, listContratos } from '../../src/rrhh/utils/contratos-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const jefatura = { role: 'jefatura', usuario: 'Jefatura RRHH' };
const admin = { role: 'administrador', usuario: 'Administrador' };

let dom;

function novedad(worker, extra = {}) {
  return {
    trabajadorEntityId: worker.entityId,
    periodo: '2026-09',
    tipo: 'horas_extra',
    cantidad: 3,
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-03',
    ...extra
  };
}

function seedWorker(name, code, rut) {
  return crearTrabajador({ name, code, rut }, analista);
}

function seedContract(worker) {
  return crearContrato(
    {
      entityId: worker.entityId,
      tipoContrato: 'indefinido',
      sueldoBase: 1000000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2026-01-01',
      modalidadGratificacion: 'art50'
    },
    analista
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

describe('US14 - worker link and historical preservation', () => {
  it('requires the novedad to reference an existing worker entity', () => {
    const worker = seedWorker('Fabian Perez', 'TRAB-006', '12.345.678-5');
    seedContract(worker);
    expect(validarNovedad(novedad(worker), { entities: loadEntities() }).valid).toBe(true);

    const invalid = validarNovedad(
      { ...novedad(worker), trabajadorEntityId: 'no-existe' },
      { entities: loadEntities() }
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors.join(' ')).toMatch(/no existe/i);
  });

  it('preserves the worker, documents, novedades and contracts after desvinculación', () => {
    const worker = seedWorker('Gabriela Nunez', 'TRAB-007', '11.111.111-1');
    const contrato = seedContract(worker);
    addDocument({
      entity_id: worker.entityId,
      folio: 1,
      startDate: '2026-09-01',
      endDate: '2026-09-30'
    });
    const created = crearNovedad(novedad(worker), analista);
    aprobarNovedad(created.id, jefatura);

    const stored = desactivarTrabajador(worker.entityId, '2026-09-30', analista);
    expect(stored.estadoLaboral).toBe('Desvinculado');
    expect(stored.fechaDesvinculacion).toBe('2026-09-30');
    expect(loadEntities()).toHaveLength(1);
    expect(getTrabajador(worker.entityId).name).toBe('Gabriela Nunez');
    expect(loadDocuments()).toHaveLength(1);
    expect(listNovedades({ trabajadorEntityId: worker.entityId })).toHaveLength(1);

    const terminated = listContratos({ entityId: worker.entityId }).find(
      (row) => row.id === contrato.id
    );
    expect(terminated.estado).toBe('terminado');
    expect(terminated.fechaTermino).toBe('2026-09-30');
  });

  it('blocks desvinculación while the worker has pending novedades', () => {
    const worker = seedWorker('Hugo Lara', 'TRAB-008', '22.222.222-2');
    seedContract(worker);
    crearNovedad(novedad(worker), analista);

    expect(() => desactivarTrabajador(worker.entityId, '2026-09-30', analista)).toThrow(
      /pendientes/i
    );
    expect(getTrabajador(worker.entityId).estadoLaboral).toBe('Activo');
    expect(listNovedades({ trabajadorEntityId: worker.entityId })).toHaveLength(1);
  });

  it('leaves direct reports without a jefatura', () => {
    const jefe = seedWorker('Jefa Equipo', 'TRAB-009', '13.579.246-2');
    seedContract(jefe);
    const report = seedWorker('Reporte Directo', 'TRAB-010', '24.680.135-5');
    seedContract(report);
    actualizarTrabajador(report.entityId, { jefeId: jefe.entityId }, analista);

    desactivarTrabajador(jefe.entityId, '2026-09-30', analista);

    expect(getTrabajador(report.entityId).jefeId).toBe('');
  });
});
