import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity, loadEntities } from '../../src/storage.js';
import {
  actualizarNovedad,
  anularNovedad,
  aprobarNovedad,
  crearNovedad,
  listNovedades,
  rechazarNovedad
} from '../../src/rrhh/utils/novedades-service.js';
import {
  PeriodoCerradoError,
  abrirPeriodo,
  cerrarPeriodo
} from '../../src/rrhh/utils/periodos-service.js';
import { validarNovedad } from '../../src/rrhh/utils/novedades-data.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';

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
  crearContrato(
    {
      entityId: entity.entity_id,
      tipoContrato: 'indefinido',
      sueldoBase: 1000000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2026-01-01',
      modalidadGratificacion: 'art50'
    },
    analista
  );
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

  it('blocks approval, rejection and annulment in a closed period', () => {
    const novedad = crearNovedad(input(), analista);
    cerrarPeriodo('2026-09', jefatura);

    expect(() => aprobarNovedad(novedad.id, jefatura)).toThrow(PeriodoCerradoError);
    expect(() => rechazarNovedad(novedad.id, jefatura, 'Motivo')).toThrow(PeriodoCerradoError);
    expect(() => anularNovedad(novedad.id, analista, 'Motivo')).toThrow(PeriodoCerradoError);
    expect(listNovedades()[0].estado).toBe('pendiente');
  });

  it('rejects approval when the actor role is not Jefatura', () => {
    const novedad = crearNovedad(input(), analista);
    expect(() => aprobarNovedad(novedad.id, analista)).toThrow(/Jefatura/i);
    expect(() => aprobarNovedad(novedad.id, { role: 'trabajador' })).toThrow(/Jefatura/i);
    expect(listNovedades()[0].estado).toBe('pendiente');
  });

  it('requires a rejection motive and keeps rejected records immutable', () => {
    const novedad = crearNovedad(input(), analista);
    expect(() => rechazarNovedad(novedad.id, jefatura, '')).toThrow(/motivo/i);

    rechazarNovedad(novedad.id, jefatura, 'Documentacion incompleta');
    expect(() => actualizarNovedad(novedad.id, { cantidad: 2 }, analista)).toThrow(/pendientes/i);
    expect(() => anularNovedad(novedad.id, analista, 'Duplicada')).toThrow(/rechazada/i);
    expect(listNovedades()[0].estado).toBe('rechazada');
    expect(listNovedades()[0].motivoRechazo).toBe('Documentacion incompleta');
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

  it('keeps annulled novedades instead of deleting them', () => {
    const novedad = crearNovedad(input(), analista);
    anularNovedad(novedad.id, analista, 'Registro duplicado');

    const [stored] = listNovedades();
    expect(stored.id).toBe(novedad.id);
    expect(stored.estado).toBe('anulada');
    expect(stored.motivoAnulacion).toBe('Registro duplicado');
    expect(loadEntities()).toHaveLength(1);
  });
});
