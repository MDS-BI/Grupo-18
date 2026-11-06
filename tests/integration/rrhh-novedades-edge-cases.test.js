import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity, deleteEntity, loadEntities } from '../../src/storage.js';
import {
  actualizarNovedad,
  aprobarNovedad,
  crearNovedad,
  listNovedades,
  rechazarNovedad,
  reenviarNovedad
} from '../../src/rrhh/utils/novedades-service.js';
import {
  PeriodoCerradoError,
  abrirPeriodo,
  cerrarPeriodo
} from '../../src/rrhh/utils/periodos-service.js';
import { validarNovedad } from '../../src/rrhh/utils/novedades-data.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const jefatura = { role: 'jefatura', usuario: 'Jefatura RRHH' };
const admin = { role: 'administrador', usuario: 'Administrador' };

let dom;
let entity;

function input(extra = {}) {
  return {
    trabajadorEntityId: entity.entity_id,
    periodo: '2026-09',
    tipo: 'horas_extra',
    cantidad: 4,
    fechaInicio: '2026-09-01',
    fechaFin: '2026-09-04',
    ...extra
  };
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  entity = addEntity({ name: 'Carla Soto', code: 'TRAB-003', rut: '12.345.678-5' });
  abrirPeriodo('2026-09', admin);
});

afterEach(() => {
  dom.window.close();
});

describe('US14 - novedades edge cases', () => {
  it('blocks registration in a closed period', () => {
    cerrarPeriodo('2026-09', jefatura);
    expect(() => crearNovedad(input(), analista)).toThrow(PeriodoCerradoError);
    expect(listNovedades()).toHaveLength(0);
  });

  it('blocks approval, rejection and resubmission in a closed period', () => {
    const novedad = crearNovedad(input(), analista);
    cerrarPeriodo('2026-09', jefatura);

    expect(() => aprobarNovedad(novedad.id, jefatura)).toThrow(PeriodoCerradoError);
    expect(() => rechazarNovedad(novedad.id, jefatura, 'Motivo')).toThrow(PeriodoCerradoError);
    expect(listNovedades()[0].estado).toBe('pendiente');
  });

  it('rejects approval when the actor role is not Jefatura', () => {
    const novedad = crearNovedad(input(), analista);
    expect(() => aprobarNovedad(novedad.id, analista)).toThrow(/Jefatura/i);
    expect(() => aprobarNovedad(novedad.id, { role: 'trabajador' })).toThrow(/Jefatura/i);
    expect(listNovedades()[0].estado).toBe('pendiente');
  });

  it('requires a rejection motive and allows only rejected records to be resubmitted', () => {
    const novedad = crearNovedad(input(), analista);
    expect(() => rechazarNovedad(novedad.id, jefatura, '')).toThrow(/motivo/i);
    expect(() => reenviarNovedad(novedad.id, {}, analista)).toThrow(/reenviar|pendiente/i);

    rechazarNovedad(novedad.id, jefatura, 'Documentacion incompleta');
    const resubmitted = reenviarNovedad(novedad.id, {}, analista);
    expect(resubmitted.estado).toBe('pendiente');
    expect(resubmitted.motivoRechazo).toBe('');
  });

  it('detects duplicate novedades for the same worker, period and range', () => {
    crearNovedad(input(), analista);
    expect(() => crearNovedad(input(), analista)).toThrow(/id.ntica/i);

    const rejected = crearNovedad(
      input({ cantidad: 2, fechaInicio: '2026-09-08', fechaFin: '2026-09-09' }),
      analista
    );
    rechazarNovedad(rejected.id, jefatura, 'No aplica');
    const replacement = crearNovedad(
      input({ cantidad: 2, fechaInicio: '2026-09-08', fechaFin: '2026-09-09' }),
      analista
    );
    expect(replacement.estado).toBe('pendiente');
  });

  it('rejects dates outside the period and incoherent ranges', () => {
    const outside = validarNovedad(
      { ...input(), fechaInicio: '2026-08-28', fechaFin: '2026-09-02' },
      { entities: loadEntities() }
    );
    expect(outside.valid).toBe(false);
    expect(outside.errors.join(' ')).toMatch(/per.odo/i);

    const inverted = validarNovedad(
      { ...input(), fechaInicio: '2026-09-10', fechaFin: '2026-09-02' },
      { entities: loadEntities() }
    );
    expect(inverted.valid).toBe(false);
    expect(inverted.errors.join(' ')).toMatch(/anterior/i);
  });

  it('rejects references to a worker entity that does not exist', () => {
    expect(() =>
      crearNovedad(input({ trabajadorEntityId: 'entidad-inexistente' }), analista)
    ).toThrow(/no existe/i);
    expect(listNovedades()).toHaveLength(0);
  });

  it('accepts an absence without clinical justification', () => {
    const absence = crearNovedad(
      input({
        tipo: 'ausencia',
        cantidad: 1,
        fechaInicio: '2026-09-15',
        fechaFin: '2026-09-15',
        observacion: 'Tramite personal'
      }),
      analista
    );
    expect(absence.tipo).toBe('ausencia');
    expect(absence.observacion).toBe('Tramite personal');
    expect(JSON.stringify(absence)).not.toMatch(/diagnost|cie|tratamiento/i);
  });

  it('keeps the stored record unchanged when a correction fails validation', () => {
    const novedad = crearNovedad(input(), analista);
    expect(() =>
      actualizarNovedad(novedad.id, { cantidad: 0, fechaInicio: '2026-10-01' }, analista)
    ).toThrow(/cantidad/i);

    const [stored] = listNovedades();
    expect(stored.id).toBe(novedad.id);
    expect(stored.cantidad).toBe(4);
    expect(stored.fechaInicio).toBe('2026-09-01');
  });

  it('deletes novedades in cascade and applies logical deletion with closed liquidations', () => {
    crearNovedad(input(), analista);
    expect(deleteEntity(entity.id)).toBe(true);
    expect(loadEntities()).toHaveLength(0);
    expect(listNovedades()).toHaveLength(0);

    const worker = addEntity({ name: 'Diego Rojas', code: 'TRAB-004', rut: '12.345.678-5' });
    crearNovedad(
      {
        ...input(),
        trabajadorEntityId: worker.entity_id
      },
      analista
    );
    localStorage.setItem(
      'erp_rrhh:liquidaciones',
      JSON.stringify([
        {
          id: 'liq-cerrada',
          estado: 'aprobada',
          trabajador: { id: worker.entity_id, entityId: worker.entity_id, nombre: 'Diego Rojas' }
        }
      ])
    );

    expect(deleteEntity(worker.id)).toBe(true);
    const after = loadEntities().find((row) => row.id === worker.id);
    expect(after.bajaLogica).toBe(true);
    expect(after.activo).toBe(false);
    expect(listNovedades({ trabajadorEntityId: worker.entity_id })).toHaveLength(1);
  });
});
