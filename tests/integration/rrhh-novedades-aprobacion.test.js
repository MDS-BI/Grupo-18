import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import { renderNovedadesView } from '../../src/rrhh/views/novedades.js';
import {
  aprobarNovedad,
  crearNovedad,
  estadoElegibilidad,
  listNovedades,
  novedadesAprobadas,
  rechazarNovedad
} from '../../src/rrhh/utils/novedades-service.js';
import { asegurarPeriodo } from '../../src/rrhh/utils/periodos-service.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };

let dom;
let entity;
let root;

function createNovedad(extra = {}) {
  return crearNovedad(
    {
      trabajadorEntityId: entity.entity_id,
      periodo: '2026-09',
      tipo: 'horas_extra',
      cantidad: 6,
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-05',
      observacion: 'Apoyo de cierre',
      ...extra
    },
    analista
  );
}

function click(element) {
  element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  entity = addEntity({ name: 'Bruno Diaz', code: 'TRAB-002', rut: '12.345.678-5' });
  asegurarPeriodo('2026-09');
  root = document.getElementById('root');
});

afterEach(() => {
  dom.window.close();
});

describe('US14 - individual approval and rejection', () => {
  it('lets Jefatura approve a novedad and updates the visible state and eligibility', () => {
    const novedad = createNovedad();
    const controller = renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura RRHH', equipo: [entity.entity_id] },
      initialPeriodo: '2026-09'
    });

    const item = document.querySelector(`[data-novedad-id="${novedad.id}"]`);
    expect(item.textContent).toContain('Pendiente');
    click(item.querySelector('.rrhh-approve'));

    expect(listNovedades({ periodo: '2026-09' })[0].estado).toBe('aprobada');
    expect(document.querySelector(`[data-novedad-id="${novedad.id}"]`).textContent).toContain(
      'Aprobada'
    );
    expect(document.getElementById('novedades-eligibility').textContent).toMatch(/elegibles/i);
    expect(controller.getPeriodo()).toBe('2026-09');
  });

  it('requires a motive to reject and then blocks eligibility', () => {
    const novedad = createNovedad();
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura RRHH', equipo: [entity.entity_id] },
      initialPeriodo: '2026-09'
    });

    const item = document.querySelector(`[data-novedad-id="${novedad.id}"]`);
    click(item.querySelector('.rrhh-reject'));
    expect(document.getElementById('novedades-feedback').textContent).toMatch(/motivo/i);
    expect(listNovedades()[0].estado).toBe('pendiente');

    const reason = document.getElementById(`motivo-rechazo-${novedad.id}`);
    reason.value = 'No corresponde al periodo';
    click(item.querySelector('.rrhh-reject'));

    const [stored] = listNovedades();
    expect(stored.estado).toBe('rechazada');
    expect(stored.motivoRechazo).toBe('No corresponde al periodo');
    expect(document.getElementById('novedades-eligibility').textContent).toMatch(/bloqueado/i);
    expect(document.getElementById('novedades-eligibility').textContent).toMatch(/rechazada/i);
  });

  it('does not expose approval actions to an analyst', () => {
    createNovedad();
    renderNovedadesView(root, {
      doc: document,
      viewer: analista,
      initialPeriodo: '2026-09'
    });
    expect(document.querySelector('.rrhh-approve')).toBeNull();
    expect(document.querySelector('.rrhh-reject')).toBeNull();
  });

  it('exposes only approved novedades to later processing', () => {
    const aprobada = createNovedad({ cantidad: 4 });
    const pendiente = createNovedad({ cantidad: 2, fechaInicio: '2026-09-08', fechaFin: '2026-09-09' });
    const rechazada = createNovedad({
      cantidad: 1,
      fechaInicio: '2026-09-10',
      fechaFin: '2026-09-10'
    });
    rechazarNovedad(rechazada.id, { role: 'jefatura', usuario: 'Jefatura' }, 'Duplicada');
    aprobarNovedad(aprobada.id, { role: 'jefatura', usuario: 'Jefatura' });

    const approved = novedadesAprobadas('2026-09', entity.entity_id);
    expect(approved.map((row) => row.id)).toEqual([aprobada.id]);

    const eligibility = estadoElegibilidad('2026-09');
    expect(eligibility.elegible).toBe(false);
    expect(eligibility.pendientes).toBe(1);
    expect(eligibility.rechazadas).toBe(1);
    expect(eligibility.advertencias.join(' ')).toMatch(/pendiente/i);
    expect(eligibility.advertencias.join(' ')).toMatch(/rechazada/i);
    expect([aprobada.id, pendiente.id, rechazada.id]).toHaveLength(3);
  });

  it('allows correcting and resubmitting a rejected novedad', () => {
    const novedad = createNovedad();
    rechazarNovedad(novedad.id, { role: 'jefatura' }, 'Falta detalle');
    renderNovedadesView(root, {
      doc: document,
      viewer: analista,
      initialPeriodo: '2026-09'
    });

    const item = document.querySelector(`[data-novedad-id="${novedad.id}"]`);
    expect(item.textContent).toContain('Motivo del rechazo: Falta detalle');
    click(item.querySelector('.rrhh-resubmit'));

    expect(document.getElementById('novedad-submit').textContent).toMatch(/reenviar/i);
    expect(document.getElementById('novedad-form').querySelector('h4').textContent).toMatch(
      /corregir/i
    );
  });
});
