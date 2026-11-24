import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';
import {
  actualizarTrabajador,
  crearTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';
import { asegurarPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { listSolicitudes } from '../../src/rrhh/utils/vacaciones-service.js';
import { hoyISO, sumarDias } from '../../src/rrhh/utils/fechas.js';
import { renderVacacionesView } from '../../src/rrhh/views/vacaciones.js';
import { renderReportesView } from '../../src/rrhh/views/reportes.js';
import { RrhhWorkspace } from '../../src/rrhh/views/workspace.js';
import { renderTrabajadoresView } from '../../src/rrhh/views/trabajadores-view.js';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');
const admin = { role: 'administrador', usuario: 'Administrador RRHH' };

let dom;
let root;
let jefe;
let worker;

function proximoLunes(minDays = 7) {
  let day = sumarDias(hoyISO(), minDays);
  while (new Date(`${day}T00:00:00Z`).getUTCDay() !== 1) day = sumarDias(day, 1);
  return day;
}

function contrato(entityId) {
  crearContrato(
    {
      entityId,
      tipoContrato: 'indefinido',
      sueldoBase: 900000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2020-01-01',
      modalidadGratificacion: 'art50'
    },
    admin
  );
}

function setValue(id, value) {
  const node = document.getElementById(id);
  node.value = value;
  node.dispatchEvent(new window.Event('change'));
}

function submit(formChild) {
  formChild.closest('form').dispatchEvent(new window.Event('submit', { cancelable: true }));
}

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  root = document.createElement('div');
  document.body.appendChild(root);
  jefe = crearTrabajador(
    { name: 'Jefa Equipo', code: 'J-1', rut: '11.111.111-1', fechaIngreso: '2020-01-01' },
    admin
  );
  worker = crearTrabajador(
    { name: 'Ana Pérez', code: 'T-1', rut: '12.345.678-5', fechaIngreso: '2021-01-01' },
    admin
  );
  actualizarTrabajador(worker.entityId, { jefeId: jefe.entityId }, admin);
  contrato(jefe.entityId);
  contrato(worker.entityId);
});

afterEach(() => {
  dom.window.close();
});

describe('US7 - pantalla de vacaciones', () => {
  it('el trabajador ve su saldo, solicita y la jefatura aprueba desde la pantalla', () => {
    const trabajador = { role: 'trabajador', usuario: 'Ana Pérez', trabajadorId: worker.entityId };
    renderVacacionesView(root, { doc: document, viewer: trabajador });
    expect(document.getElementById('vacaciones-saldo').textContent).toContain(
      'Saldo disponible hoy'
    );

    const inicio = proximoLunes();
    setValue('vacaciones-inicio', inicio);
    setValue('vacaciones-fin', sumarDias(inicio, 2));
    expect(document.getElementById('vacaciones-preview').textContent).toContain(
      '3 día(s) hábil(es)'
    );
    submit(document.getElementById('vacaciones-submit'));
    expect(document.getElementById('vacaciones-feedback').dataset.tone).toBe('ok');
    expect(listSolicitudes({ viewer: trabajador })[0].estado).toBe('pendiente');

    root.textContent = '';
    const jefatura = { role: 'jefatura', usuario: 'Jefa Equipo', trabajadorId: jefe.entityId };
    renderVacacionesView(root, {
      doc: document,
      viewer: jefatura,
      payload: { entityId: worker.entityId }
    });
    const aprobar = [...root.querySelectorAll('button')].find((b) => b.textContent === 'Aprobar');
    aprobar.click();
    expect(listSolicitudes({ viewer: jefatura })[0].estado).toBe('aprobada');
  });

  it('muestra el error junto al campo cuando la solicitud supera el saldo', () => {
    actualizarTrabajador(worker.entityId, { fechaIngreso: hoyISO() }, admin);
    renderVacacionesView(root, {
      doc: document,
      viewer: admin,
      payload: { entityId: worker.entityId }
    });
    const inicio = proximoLunes(1);
    setValue('vacaciones-inicio', inicio);
    setValue('vacaciones-fin', sumarDias(inicio, 4));
    submit(document.getElementById('vacaciones-submit'));
    expect(document.getElementById('vacaciones-feedback').dataset.tone).toBe('error');
    expect(document.getElementById('vacaciones-inicio').getAttribute('aria-invalid')).toBe('true');
  });
});

/* El apartado independiente de cargas familiares fue eliminado; las cargas se
 * gestionan desde la ficha del trabajador. */

describe('US10 - pantalla de reportes', () => {
  it('muestra el estado vacío sin períodos cerrados', () => {
    renderReportesView(root, { doc: document, viewer: admin });
    expect(document.getElementById('reporte-vacio').textContent).toContain('períodos cerrados');
  });

  it('muestra tabla y oculta grupos de menos de 5 personas', () => {
    asegurarPeriodo('2026-08', { estado: 'cerrado' });
    renderReportesView(root, { doc: document, viewer: admin });
    const tabla = document.getElementById('reporte-tabla');
    expect(tabla).not.toBeNull();
    expect(tabla.textContent).toContain('muy pocas personas');
  });

  it('la jefatura solo puede elegir horas extra y ausentismo', () => {
    renderReportesView(root, {
      doc: document,
      viewer: { role: 'jefatura', trabajadorId: jefe.entityId }
    });
    const opciones = [...document.getElementById('reporte-tipo').options].map((o) => o.value);
    expect(opciones).toEqual(['horas_extra', 'ausentismo']);
    expect(document.getElementById('reporte-departamento')).toBeNull();
  });
});

describe('Navegación por rol', () => {
  function visibles(role) {
    const ws = new RrhhWorkspace({
      doc: document,
      viewer: { role, usuario: role, trabajadorId: worker.entityId }
    });
    const tabs = [...document.querySelectorAll('[data-rrhh-tab]')]
      .filter((tab) => !tab.hidden)
      .map((tab) => tab.dataset.rrhhTab);
    ws.dispose();
    return tabs;
  }

  it('muestra las pestañas nuevas según el rol', () => {
    expect(visibles('administrador')).toEqual(
      expect.arrayContaining(['vacaciones', 'reportes'])
    );
    expect(visibles('administrador')).not.toContain('cargas');
    expect(visibles('jefatura')).toEqual(expect.arrayContaining(['vacaciones', 'reportes']));
    expect(visibles('jefatura')).not.toContain('cargas');
    expect(visibles('trabajador')).toEqual(['resumen', 'liquidaciones', 'vacaciones']);
  });
});

describe('FR-112 - resumen en la ficha del trabajador', () => {
  it('muestra saldo y cargas en el resumen del trabajador, sin apartado separado', () => {
    const navegaciones = [];
    renderTrabajadoresView(root, {
      doc: document,
      viewer: admin,
      onNavigate: (tab, payload) => navegaciones.push([tab, payload])
    });
    const fila = root.querySelector(`tr[data-entity-id="${worker.entityId}"]`);
    [...fila.querySelectorAll('button')].find((b) => b.textContent === 'Resumen').click();
    const resumen = document.getElementById('trabajador-resumen');
    expect(resumen.hidden).toBe(false);
    expect(resumen.textContent).toContain('Saldo de vacaciones');
    expect(resumen.textContent).toContain('Cargas familiares vigentes');
    expect(document.getElementById('trabajador-ir-cargas')).toBeNull();
    expect(navegaciones).toEqual([]);
  });

  it('la jefatura ve el resumen de vacaciones pero no el de cargas', () => {
    const jefatura = { role: 'jefatura', usuario: 'Jefa Equipo', trabajadorId: jefe.entityId };
    renderTrabajadoresView(root, { doc: document, viewer: jefatura });
    const fila = root.querySelector(`tr[data-entity-id="${worker.entityId}"]`);
    [...fila.querySelectorAll('button')].find((b) => b.textContent === 'Resumen').click();
    const resumen = document.getElementById('trabajador-resumen');
    expect(resumen.textContent).toContain('Saldo de vacaciones');
    expect(resumen.textContent).not.toContain('Cargas familiares');
    expect(document.getElementById('trabajador-ir-cargas')).toBeNull();
  });
});
