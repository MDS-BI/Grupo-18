import { describe, it, expect, beforeEach } from 'vitest';
import {
  actualizarTrabajador,
  crearTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';
import { abrirPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { crearNovedad } from '../../src/rrhh/utils/novedades-service.js';
import { listAuditoria } from '../../src/rrhh/seguridad/auditoria.js';
import {
  alertasSaldoMaximo,
  anularSolicitud,
  aprobarSolicitud,
  contarDiasHabiles,
  crearSolicitud,
  diasDevengados,
  getSolicitud,
  listSolicitudes,
  rechazarSolicitud,
  registrarFeriado,
  saldoVacaciones,
  VACACIONES_TABLE
} from '../../src/rrhh/utils/vacaciones-service.js';
import { crearFeriado } from '../../src/rrhh/utils/feriados-service.js';
import { hoyISO, sumarDias } from '../../src/rrhh/utils/fechas.js';
import { rangoPeriodo } from '../../src/rrhh/utils/periodos.js';

const admin = { role: 'administrador', usuario: 'Administrador RRHH' };

let store;
let jefe;
let worker;
let jefatura;
let trabajador;

function memoryStorage() {
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
}

/** First Monday at least `minDays` after today, so ranges are deterministic. */
function proximoLunes(minDays = 7) {
  let day = sumarDias(hoyISO(), minDays);
  while (new Date(`${day}T00:00:00Z`).getUTCDay() !== 1) day = sumarDias(day, 1);
  return day;
}

function mesesAtras(meses, dia = 1) {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth() - meses, dia));
  return date.toISOString().slice(0, 10);
}

function contrato(entityId) {
  crearContrato(
    {
      entityId,
      tipoContrato: 'indefinido',
      sueldoBase: 1000000,
      jornadaHorasSemanales: 42,
      fechaInicio: '2020-01-01',
      modalidadGratificacion: 'art50'
    },
    admin
  );
}

beforeEach(() => {
  memoryStorage();
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
  jefatura = { role: 'jefatura', usuario: 'Jefa Equipo', trabajadorId: jefe.entityId };
  trabajador = { role: 'trabajador', usuario: 'Ana Pérez', trabajadorId: worker.entityId };
});

describe('US7 - días hábiles y devengo', () => {
  it('cuenta lunes a viernes y excluye feriados', () => {
    // 2026-12-07 (lun) a 2026-12-11 (vie), con feriado el 8.
    expect(contarDiasHabiles('2026-12-07', '2026-12-13', new Set())).toBe(5);
    expect(contarDiasHabiles('2026-12-07', '2026-12-13', new Set(['2026-12-08']))).toBe(4);
    expect(contarDiasHabiles('2026-12-12', '2026-12-13', new Set())).toBe(0);
  });

  it('devenga 1,25 días por mes completo (8 meses = 10 días)', () => {
    expect(diasDevengados('2026-03-15', '2026-11-15')).toBe(10);
    expect(diasDevengados('2026-03-15', '2026-11-14')).toBe(8.75);
  });

  it('limita el saldo a 30 días y genera alerta', () => {
    const saldo = saldoVacaciones(jefe.entityId);
    expect(saldo.disponible).toBe(30);
    expect(saldo.alMaximo).toBe(true);
    expect(alertasSaldoMaximo().map((row) => row.entityId)).toContain(jefe.entityId);
  });
});

describe('US7 - solicitudes', () => {
  it('registra una solicitud pendiente con sus días hábiles', () => {
    const inicio = proximoLunes();
    const created = crearSolicitud(
      { entityId: worker.entityId, fechaInicio: inicio, fechaFin: sumarDias(inicio, 4) },
      trabajador
    );
    expect(created.estado).toBe('pendiente');
    expect(created.diasHabiles).toBe(5);
    expect(listAuditoria({ tabla: VACACIONES_TABLE }).some((row) => row.accion === 'crear')).toBe(
      true
    );
  });

  it('rechaza una solicitud que supera el saldo e informa el máximo', () => {
    actualizarTrabajador(worker.entityId, { fechaIngreso: mesesAtras(3) }, admin);
    const inicio = proximoLunes(1);
    expect(() =>
      crearSolicitud(
        { entityId: worker.entityId, fechaInicio: inicio, fechaFin: sumarDias(inicio, 11) },
        trabajador
      )
    ).toThrow(/como máximo/);
  });

  it('solo permite días completos de un saldo con decimales', () => {
    // 3 meses completos = 3,75 días: 4 días hábiles no caben, 3 sí.
    actualizarTrabajador(
      worker.entityId,
      { fechaIngreso: mesesAtras(3, new Date().getDate()) },
      admin
    );
    const inicio = proximoLunes(1);
    expect(() =>
      crearSolicitud(
        { entityId: worker.entityId, fechaInicio: inicio, fechaFin: sumarDias(inicio, 3) },
        trabajador,
        { hoy: sumarDias(inicio, -1) }
      )
    ).toThrow(/como máximo 3/);
  });

  it('acepta una solicitud futura usando el saldo proyectado', () => {
    actualizarTrabajador(worker.entityId, { fechaIngreso: hoyISO() }, admin);
    const inicio = proximoLunes(100); // al menos 3 meses completos más adelante
    const created = crearSolicitud(
      { entityId: worker.entityId, fechaInicio: inicio, fechaFin: sumarDias(inicio, 1) },
      trabajador
    );
    expect(created.diasHabiles).toBe(2);
  });

  it('rechaza una solicitud que se superpone con una licencia médica', () => {
    // A leave starts today at the latest (no future attendance records) and
    // may run past today within the current period.
    const hoy = hoyISO();
    const finDeMes = rangoPeriodo(hoy.slice(0, 7)).fechaFin;
    const finLicencia = sumarDias(hoy, 3) < finDeMes ? sumarDias(hoy, 3) : finDeMes;
    abrirPeriodo(hoy.slice(0, 7), admin);
    crearNovedad(
      {
        trabajadorEntityId: worker.entityId,
        periodo: hoy.slice(0, 7),
        tipo: 'licencia_medica',
        cantidad: 1,
        fechaInicio: hoy,
        fechaFin: finLicencia
      },
      admin
    );
    expect(() =>
      crearSolicitud(
        { entityId: worker.entityId, fechaInicio: hoy, fechaFin: finLicencia },
        trabajador
      )
    ).toThrow(/licencia médica/);
  });

  it('impide que un trabajador solicite para otra persona', () => {
    const inicio = proximoLunes();
    expect(() =>
      crearSolicitud({ entityId: jefe.entityId, fechaInicio: inicio, fechaFin: inicio }, trabajador)
    ).toThrow(/autorización/);
  });
});

describe('US7 - aprobación, rechazo y anulación', () => {
  function pendiente(viewer = trabajador) {
    const inicio = proximoLunes();
    return crearSolicitud(
      { entityId: worker.entityId, fechaInicio: inicio, fechaFin: sumarDias(inicio, 2) },
      viewer
    );
  }

  it('la jefatura directa aprueba y los días se descuentan del saldo', () => {
    const antes = saldoVacaciones(worker.entityId).disponible;
    const solicitud = pendiente();
    const aprobada = aprobarSolicitud(solicitud.id, jefatura);
    expect(aprobada.estado).toBe('aprobada');
    expect(saldoVacaciones(worker.entityId).disponible).toBe(Math.min(30, antes) - 3);
  });

  it('exige motivo para rechazar', () => {
    const solicitud = pendiente();
    expect(() => rechazarSolicitud(solicitud.id, jefatura, '')).toThrow(/motivo/);
    expect(rechazarSolicitud(solicitud.id, jefatura, 'Cierre de mes').estado).toBe('rechazada');
  });

  it('la jefatura no aprueba lo que ella registró; el administrador sí', () => {
    const solicitud = pendiente(jefatura);
    expect(() => aprobarSolicitud(solicitud.id, jefatura)).toThrow(/autorización/);
    expect(aprobarSolicitud(solicitud.id, admin).estado).toBe('aprobada');
  });

  it('anula una aprobada antes de su inicio y devuelve los días; después no', () => {
    const solicitud = pendiente();
    aprobarSolicitud(solicitud.id, jefatura);
    const conAprobada = saldoVacaciones(worker.entityId).disponible;
    expect(() => anularSolicitud(solicitud.id, trabajador, { hoy: solicitud.fechaInicio })).toThrow(
      /comenzaron/
    );
    anularSolicitud(solicitud.id, trabajador);
    expect(getSolicitud(solicitud.id).estado).toBe('anulada');
    expect(saldoVacaciones(worker.entityId).disponible).toBeGreaterThan(conAprobada);
  });

  it('recalcula una aprobada cuando se agrega un feriado en su rango', () => {
    const solicitud = pendiente();
    aprobarSolicitud(solicitud.id, jefatura);
    registrarFeriado({ fecha: solicitud.fechaInicio, nombre: 'Feriado de prueba' }, admin);
    expect(getSolicitud(solicitud.id).diasHabiles).toBe(2);
  });

  it('solo el administrador mantiene el calendario y no repite fechas', () => {
    expect(() => crearFeriado({ fecha: '2026-12-25', nombre: 'Navidad' }, jefatura)).toThrow(
      /administrador/
    );
    crearFeriado({ fecha: '2026-12-25', nombre: 'Navidad' }, admin);
    expect(() => crearFeriado({ fecha: '2026-12-25', nombre: 'Otra' }, admin)).toThrow(/Ya existe/);
  });

  it('limita el listado al alcance de cada rol', () => {
    pendiente();
    expect(listSolicitudes({ viewer: trabajador })).toHaveLength(1);
    expect(listSolicitudes({ viewer: jefatura })).toHaveLength(1);
    expect(
      listSolicitudes({ viewer: { role: 'trabajador', trabajadorId: jefe.entityId } })
    ).toHaveLength(0);
  });
});
