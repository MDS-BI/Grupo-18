import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import {
  crearTrabajador,
  desactivarTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { crearCarga, listCargas } from '../../src/rrhh/utils/cargas-service.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { crearNovedad, listNovedades } from '../../src/rrhh/utils/novedades-service.js';
import { getPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { listAuditoria } from '../../src/rrhh/seguridad/auditoria.js';
import { crearFeriado } from '../../src/rrhh/utils/feriados-service.js';
import { validarSolicitud } from '../../src/rrhh/utils/vacaciones-service.js';
import { loadEntities } from '../../src/storage.js';
import { hoyISO, sumarDias } from '../../src/rrhh/utils/fechas.js';
import { periodoActual, periodosHastaHoy } from '../../src/rrhh/utils/limites-fechas.js';
import { renderTrabajadoresView } from '../../src/rrhh/views/trabajadores-view.js';
import { renderPeriodosView } from '../../src/rrhh/views/periodos.js';

const admin = { role: 'administrador', usuario: 'Administrador RRHH' };
let dom;
let root;

function siguientePeriodo() {
  const [y, m] = periodoActual().split('-').map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
}

function setValue(id, value) {
  const node = document.getElementById(id);
  node.value = value;
  node.dispatchEvent(new window.Event('change'));
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  root = document.createElement('div');
  document.body.appendChild(root);
});

afterEach(() => {
  dom.window.close();
});

describe('Trabajadores - columna de cargas familiares', () => {
  it('muestra cuántas cargas vigentes tiene cada trabajador', () => {
    const ana = crearTrabajador({ name: 'Ana Pérez', code: 'T-1', rut: '12.345.678-5' }, admin);
    crearTrabajador({ name: 'Luis Soto', code: 'T-2', rut: '11.111.111-1' }, admin);
    crearCarga(
      {
        entityId: ana.entityId,
        nombre: 'Sofía',
        rut: '22.222.222-2',
        parentesco: 'hijo',
        fechaNacimiento: '2015-05-10',
        tipo: 'simple',
        resolucionNumero: 'R-1',
        resolucionFecha: '2025-01-15',
        vigenteDesde: '2025-01-15'
      },
      admin
    );
    renderTrabajadoresView(root, { doc: document, viewer: admin });
    const encabezados = [...root.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(encabezados).toContain('Cargas familiares');
    const celdas = [...root.querySelectorAll('.rrhh-cargas-cell')].map((td) => td.textContent);
    expect(celdas).toEqual(['1 vigente', 'Sin cargas']);
  });

  it('la jefatura no ve la columna de cargas', () => {
    const jefe = crearTrabajador({ name: 'Jefa', code: 'J-1', rut: '12.345.678-5' }, admin);
    renderTrabajadoresView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefa', trabajadorId: jefe.entityId }
    });
    const encabezados = [...root.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(encabezados).not.toContain('Cargas familiares');
  });
});

describe('Trabajadores - registrar cargas junto con la ficha', () => {
  function llenarFicha() {
    setValue('trabajador-name', 'Marta Díaz');
    setValue('trabajador-code', 'T-9');
    setValue('trabajador-rut', '12.345.678-5');
    setValue('trabajador-fechaIngreso', '2024-01-10');
  }

  function llenarCarga(n, rut) {
    setValue(`ficha-carga-${n}-nombre`, `Hijo ${n}`);
    setValue(`ficha-carga-${n}-rut`, rut);
    setValue(`ficha-carga-${n}-parentesco`, 'hijo');
    setValue(`ficha-carga-${n}-nacimiento`, '2016-03-01');
    setValue(`ficha-carga-${n}-resolucion`, `R-${n}`);
    setValue(`ficha-carga-${n}-resolucion-fecha`, '2024-02-01');
  }

  function guardar() {
    document
      .getElementById('trabajador-form')
      .dispatchEvent(new window.Event('submit', { cancelable: true }));
  }

  it('crea el trabajador y sus cargas en una sola acción', () => {
    renderTrabajadoresView(root, { doc: document, viewer: admin });
    llenarFicha();
    document.getElementById('trabajador-agregar-carga').click();
    llenarCarga(1, '22.222.222-2');
    guardar();
    const trabajador = loadEntities().find((row) => row.name === 'Marta Díaz');
    expect(trabajador).toBeTruthy();
    const cargas = listCargas({ entityId: trabajador.entity_id });
    expect(cargas).toHaveLength(1);
    expect(cargas[0].vigenteDesde).toBe('2024-02-01');
    expect(document.getElementById('trabajador-form-errors').textContent).toContain('1 carga');
  });

  it('no guarda nada si una carga es inválida', () => {
    renderTrabajadoresView(root, { doc: document, viewer: admin });
    llenarFicha();
    document.getElementById('trabajador-agregar-carga').click();
    llenarCarga(1, '22.222.222-2');
    setValue('ficha-carga-1-resolucion', '');
    guardar();
    expect(loadEntities().some((row) => row.name === 'Marta Díaz')).toBe(false);
    expect(document.getElementById('ficha-carga-1-resolucion').getAttribute('aria-invalid')).toBe(
      'true'
    );
  });
});

describe('Fechas sin sentido', () => {
  it('no permite abrir un período futuro ni lo ofrece en la pantalla', () => {
    expect(() => abrirPeriodo(siguientePeriodo(), admin)).toThrow(/período futuro/);
    expect(periodosHastaHoy([siguientePeriodo(), periodoActual()])).toEqual([periodoActual()]);
    renderPeriodosView(root, { doc: document, viewer: admin });
    expect(document.getElementById('periodo-nuevo').max).toBe(periodoActual());
  });

  it('rechaza ingreso, desvinculación y nacimiento en el futuro', () => {
    const manana = sumarDias(hoyISO(), 1);
    expect(() =>
      crearTrabajador({ name: 'X', code: 'X-1', rut: '12.345.678-5', fechaIngreso: manana }, admin)
    ).toThrow();
    const w = crearTrabajador({ name: 'Y', code: 'Y-1', rut: '11.111.111-1' }, admin);
    expect(() => desactivarTrabajador(w.entityId, manana, admin)).toThrow(/futura/);
    expect(() =>
      crearCarga(
        {
          entityId: w.entityId,
          nombre: 'Z',
          rut: '22.222.222-2',
          parentesco: 'hijo',
          fechaNacimiento: manana,
          tipo: 'simple',
          resolucionNumero: 'R',
          resolucionFecha: '2025-01-01',
          vigenteDesde: '2025-01-01'
        },
        admin
      )
    ).toThrow(/nacimiento no puede ser una fecha futura/);
  });

  it('no registra asistencia que aún no ocurrió (salvo la licencia que sigue corriendo)', () => {
    const w = crearTrabajador({ name: 'A', code: 'A-1', rut: '12.345.678-5' }, admin);
    crearContrato(
      {
        entityId: w.entityId,
        tipoContrato: 'indefinido',
        sueldoBase: 900000,
        jornadaHorasSemanales: 42,
        fechaInicio: '2024-01-01',
        modalidadGratificacion: 'art50'
      },
      admin
    );
    abrirPeriodo(periodoActual(), admin);
    const hoy = hoyISO();
    const manana = sumarDias(hoy, 1);
    const base = { trabajadorEntityId: w.entityId, periodo: periodoActual(), cantidad: 1 };
    expect(() =>
      crearNovedad({ ...base, tipo: 'ausencia', fechaInicio: manana, fechaFin: manana }, admin)
    ).toThrow(/futura/);
    expect(() =>
      crearNovedad(
        { ...base, tipo: 'horas_extra', fechaInicio: hoy, fechaFin: manana, justificacion: 'x' },
        admin
      )
    ).toThrow(/Solo una licencia médica/);
  });

  it('acota vacaciones y feriados a un horizonte razonable', () => {
    const w = crearTrabajador({ name: 'V', code: 'V-1', rut: '12.345.678-5' }, admin);
    const ayer = sumarDias(hoyISO(), -1);
    const lejos = sumarDias(hoyISO(), 400);
    expect(
      validarSolicitud({ entityId: w.entityId, fechaInicio: ayer, fechaFin: ayer }).errors[0]
    ).toMatch(/anterior a hoy/);
    expect(
      validarSolicitud({ entityId: w.entityId, fechaInicio: lejos, fechaFin: lejos }).errors[0]
    ).toMatch(/más de un año/);
    expect(() => crearFeriado({ fecha: '2999-01-01', nombre: 'Lejano' }, admin)).toThrow(/entre/);
  });
});

describe('Licencia médica que continúa en meses futuros', () => {
  function trabajadorConContrato() {
    const w = crearTrabajador({ name: 'L', code: 'L-1', rut: '12.345.678-5' }, admin);
    crearContrato(
      {
        entityId: w.entityId,
        tipoContrato: 'indefinido',
        sueldoBase: 900000,
        jornadaHorasSemanales: 42,
        fechaInicio: '2024-01-01',
        modalidadGratificacion: 'art50'
      },
      admin
    );
    abrirPeriodo(periodoActual(), admin);
    return w;
  }

  it('crea automáticamente el período del mes siguiente y registra ambas partes', () => {
    const w = trabajadorConContrato();
    const hoy = hoyISO();
    const fin = sumarDias(hoy, 40); // always reaches the next month
    crearNovedad(
      {
        trabajadorEntityId: w.entityId,
        periodo: periodoActual(),
        tipo: 'licencia_medica',
        cantidad: 41,
        fechaInicio: hoy,
        fechaFin: fin
      },
      admin
    );
    expect(getPeriodo(siguientePeriodo())).toBeTruthy();
    const partes = listNovedades({ trabajadorEntityId: w.entityId });
    expect(partes.map((row) => row.periodo)).toContain(siguientePeriodo());
    expect(
      listAuditoria({ tabla: 'periodos' }).some((row) => /licencia médica/.test(row.motivo))
    ).toBe(true);
  });

  it('no crea períodos si la licencia no es válida', () => {
    const w = trabajadorConContrato();
    expect(() =>
      crearNovedad(
        {
          trabajadorEntityId: w.entityId,
          periodo: periodoActual(),
          tipo: 'licencia_medica',
          cantidad: 1,
          fechaInicio: hoyISO(),
          fechaFin: sumarDias(hoyISO(), 400)
        },
        admin
      )
    ).toThrow(/más de un año/);
    expect(getPeriodo(siguientePeriodo())).toBeNull();
  });

  it('abrir a mano un período futuro sigue prohibido', () => {
    expect(() => abrirPeriodo(siguientePeriodo(), admin)).toThrow(/período futuro/);
  });
});
