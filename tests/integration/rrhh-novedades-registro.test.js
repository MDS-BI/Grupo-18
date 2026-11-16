import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import { renderNovedadesView } from '../../src/rrhh/views/novedades.js';
import { listNovedades } from '../../src/rrhh/utils/novedades-service.js';
import { asegurarPeriodo } from '../../src/rrhh/utils/periodos-service.js';

let dom;
let entity;
let root;

function setValue(id, value) {
  const node = document.getElementById(id);
  node.value = value;
  node.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
  return node;
}

function submit() {
  document
    .getElementById('novedad-form')
    .dispatchEvent(new dom.window.Event('submit', { bubbles: true, cancelable: true }));
}

function fillBase({ tipo = 'horas_extra', cantidad = 5, inicio = '2026-09-01', fin = '2026-09-05' }) {
  setValue('novedad-trabajador', entity.entity_id);
  setValue('novedad-periodo', '2026-09');
  setValue('novedad-tipo', tipo);
  setValue('novedad-cantidad', cantidad);
  setValue('novedad-fecha-inicio', inicio);
  setValue('novedad-fecha-fin', fin);
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  entity = addEntity({
    name: 'Ana Torres',
    code: 'TRAB-001',
    rut: '12.345.678-5',
    cargo: 'Analista'
  });
  asegurarPeriodo('2026-09');
  root = document.getElementById('root');
});

afterEach(() => {
  dom.window.close();
});

describe('US14 - novedad registration form', () => {
  it('renders the registration fields and a privacy notice without clinical fields', () => {
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'analista', usuario: 'Analista RRHH' },
      initialPeriodo: '2026-09'
    });

    expect(document.getElementById('novedad-form')).not.toBeNull();
    expect(document.getElementById('novedad-trabajador')).not.toBeNull();
    expect(document.getElementById('novedad-tipo')).not.toBeNull();
    expect(document.getElementById('novedad-privacy').textContent).toMatch(/Ley 21.719/);
    expect(document.querySelector('[id*="diagnost"], [name*="diagnost"]')).toBeNull();
    expect(document.querySelector('[id*="cie"], [name*="cie"]')).toBeNull();
    expect(document.getElementById('novedades-summary')).not.toBeNull();
    expect(document.getElementById('novedades-eligibility')).not.toBeNull();
  });

  it('registers an hours-extra novedad in pending state', () => {
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'analista', usuario: 'Analista RRHH' },
      initialPeriodo: '2026-09'
    });
    fillBase({ tipo: 'horas_extra', cantidad: 5 });
    setValue('novedad-observacion', 'Apoyo en cierre de mes');
    submit();

    const rows = listNovedades({ periodo: '2026-09' });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      trabajadorEntityId: entity.entity_id,
      periodo: '2026-09',
      tipo: 'horas_extra',
      cantidad: 5,
      estado: 'pendiente',
      registradoPor: 'Analista RRHH'
    });
    expect(document.getElementById('novedades-list').textContent).toContain('Ana Torres');
    expect(document.getElementById('novedades-list').textContent).toContain('Pendiente');
  });

  it('shows inline validation errors and persists nothing on invalid input', () => {
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'analista' },
      initialPeriodo: '2026-09'
    });
    submit();

    const feedback = document.getElementById('novedad-form-errors');
    expect(feedback.hidden).toBe(false);
    expect(feedback.textContent).toMatch(/trabajador/i);
    expect(feedback.textContent).toMatch(/cantidad/i);
    expect(listNovedades()).toHaveLength(0);
  });

  it('rejects dates outside the selected period', () => {
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'analista' },
      initialPeriodo: '2026-09'
    });
    fillBase({ inicio: '2026-08-30', fin: '2026-09-02' });
    submit();

    expect(document.getElementById('novedad-form-errors').textContent).toMatch(/per.odo/i);
    expect(listNovedades()).toHaveLength(0);
  });

  it('stores only type and days for medical leave and discards clinical text', () => {
    renderNovedadesView(root, {
      doc: document,
      viewer: { role: 'analista' },
      initialPeriodo: '2026-09'
    });
    fillBase({ tipo: 'licencia_medica', cantidad: 3, inicio: '2026-09-07', fin: '2026-09-09' });
    expect(document.getElementById('novedad-observacion').closest('.field').hidden).toBe(true);
    setValue('novedad-observacion', 'Diagnostico CIE-10 J11 y tratamiento medico');
    submit();

    const [row] = listNovedades({ periodo: '2026-09' });
    expect(row.tipo).toBe('licencia_medica');
    expect(row.cantidad).toBe(3);
    expect(row.observacion).toBe('');
    expect(row.diagnostico).toBeUndefined();
    expect(row.codigoCie).toBeUndefined();
    expect(JSON.stringify(row)).not.toMatch(/diagnost|cie-?10|tratamiento/i);
  });
});
