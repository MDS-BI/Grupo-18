import { describe, it, expect, beforeEach } from 'vitest';
import { crearTrabajador } from '../../src/rrhh/utils/trabajadores-service.js';
import {
  avisosEdadLimite,
  cargasParaAsignacion,
  crearCarga,
  listCargas,
  terminarCarga,
  CARGAS_TABLE
} from '../../src/rrhh/utils/cargas-service.js';
import { calcularLiquidacionTrabajador } from '../../src/rrhh/calculo/motor.js';
import {
  TRAMOS_ASIGNACION_FAMILIAR_INICIALES,
  resolverTramoAsignacion
} from '../../src/rrhh/calculo/parametros.js';
import { listAuditoria } from '../../src/rrhh/seguridad/auditoria.js';
import { hoyISO, sumarAnios, sumarDias } from '../../src/rrhh/utils/fechas.js';

const admin = { role: 'administrador', usuario: 'Administrador RRHH' };
const analista = { role: 'analista', usuario: 'Analista RRHH' };
let store;
let worker;
let otro;

beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  worker = crearTrabajador({ name: 'Ana Pérez', code: 'T-1', rut: '12.345.678-5' }, admin);
  otro = crearTrabajador({ name: 'Luis Soto', code: 'T-2', rut: '11.111.111-1' }, admin);
});

function carga(overrides = {}) {
  return {
    entityId: worker.entityId,
    nombre: 'Sofía Pérez',
    rut: '22.222.222-2',
    parentesco: 'hijo',
    fechaNacimiento: '2015-05-10',
    tipo: 'simple',
    resolucionNumero: 'RES-100',
    resolucionFecha: '2025-01-15',
    vigenteDesde: '2025-01-01',
    ...overrides
  };
}

describe('US8 - registro de cargas', () => {
  it('registra una carga vigente con datos completos y la audita', () => {
    const created = crearCarga(carga(), analista);
    expect(listCargas({ viewer: analista, entityId: worker.entityId })[0].vigente).toBe(true);
    expect(listAuditoria({ tabla: CARGAS_TABLE })[0].registroId).toBe(created.id);
  });

  it('exige el número y la fecha de la resolución', () => {
    expect(() => crearCarga(carga({ resolucionNumero: '' }), analista)).toThrow(
      /número de la resolución/
    );
    expect(() => crearCarga(carga({ resolucionFecha: '' }), analista)).toThrow(
      /fecha de la resolución/
    );
  });

  it('rechaza un RUT inválido y un RUT ya vigente para otro trabajador', () => {
    expect(() => crearCarga(carga({ rut: '12.345.678-9' }), analista)).toThrow(/RUT/);
    crearCarga(carga(), analista);
    expect(() => crearCarga(carga({ entityId: otro.entityId }), analista)).toThrow(
      /otro trabajador/
    );
  });

  it('permite reutilizar el RUT cuando la carga anterior terminó', () => {
    const anterior = crearCarga(carga(), analista);
    terminarCarga(anterior.id, '2025-06-30', analista);
    expect(() =>
      crearCarga(carga({ entityId: otro.entityId, vigenteDesde: '2025-07-01' }), analista)
    ).not.toThrow();
  });

  it('la jefatura no ve cargas y el trabajador solo las suyas', () => {
    crearCarga(carga(), analista);
    expect(() => listCargas({ viewer: { role: 'jefatura' } })).toThrow(/autorización/);
    expect(
      listCargas({ viewer: { role: 'trabajador', trabajadorId: worker.entityId } })
    ).toHaveLength(1);
    expect(
      listCargas({ viewer: { role: 'trabajador', trabajadorId: otro.entityId } })
    ).toHaveLength(0);
  });
});

describe('US8 - asignación familiar', () => {
  it('cuenta doble la carga de invalidez', () => {
    crearCarga(carga(), analista);
    crearCarga(
      carga({
        rut: '13.579.246-2',
        nombre: 'Pedro',
        tipo: 'invalidez',
        fechaNacimiento: '1990-01-01'
      }),
      analista
    );
    expect(cargasParaAsignacion(worker.entityId, '2026-09')).toBe(3);
  });

  it('un hijo deja de contar al cumplir 18 años (24 si es estudiante)', () => {
    const nacimiento = '2008-03-15';
    crearCarga(carga({ fechaNacimiento: nacimiento }), analista);
    expect(cargasParaAsignacion(worker.entityId, '2026-03')).toBe(1); // vigente parte del mes
    expect(cargasParaAsignacion(worker.entityId, '2026-04')).toBe(0);
  });

  it('el tope de cada tramo es inclusivo y el tramo D no paga', () => {
    const tramoA = TRAMOS_ASIGNACION_FAMILIAR_INICIALES[0];
    expect(resolverTramoAsignacion(tramoA.hastaCLP).tramo).toBe('A');
    expect(resolverTramoAsignacion(tramoA.hastaCLP + 1).tramo).toBe('B');
    expect(resolverTramoAsignacion(5000000).montoPorCarga).toBe(0);
  });

  it('agrega la línea no imponible ni tributable al cálculo del tramo A', () => {
    const contrato = {
      sueldoBase: 400000,
      tipoContrato: 'indefinido',
      modalidadGratificacion: 'art50'
    };
    const sin = calcularLiquidacionTrabajador({ contrato, periodo: '2026-09' });
    const con = calcularLiquidacionTrabajador({
      contrato,
      periodo: '2026-09',
      cargasFamiliares: 2
    });
    const linea = con.lineas.find((row) => row.parametroLegal?.codigo === 'ASIG_FAMILIAR');
    expect(linea.monto).toBe(2 * linea.base);
    expect(linea.parametroLegal.tramo).toBe('A');
    expect(con.bases.imponible).toBe(sin.bases.imponible);
    expect(con.bases.tributable).toBe(sin.bases.tributable);
    expect(con.totales.liquido - sin.totales.liquido).toBe(linea.monto);
  });

  it('no paga asignación en el tramo D aunque haya cargas', () => {
    const contrato = {
      sueldoBase: 3000000,
      tipoContrato: 'indefinido',
      modalidadGratificacion: 'art50'
    };
    const con = calcularLiquidacionTrabajador({
      contrato,
      periodo: '2026-09',
      cargasFamiliares: 2
    });
    expect(con.lineas.some((row) => row.parametroLegal?.codigo === 'ASIG_FAMILIAR')).toBe(false);
  });
});

describe('US8 - avisos de edad límite', () => {
  it('avisa 30 días antes de que un hijo cumpla 18 años', () => {
    const hoy = hoyISO();
    const nacimiento = sumarAnios(sumarDias(hoy, 20), -18);
    crearCarga(carga({ fechaNacimiento: nacimiento, vigenteDesde: '2020-01-01' }), analista);
    const avisos = avisosEdadLimite({ hoy });
    expect(avisos).toHaveLength(1);
    expect(avisos[0].trabajador).toBe('Ana Pérez');
  });
});

describe('US8/US12 - tramos de asignación como parámetro legal', () => {
  it('se guardan en la tabla de parámetros y el último tramo sigue abierto', async () => {
    const { inicializarParametros, listTramosAsignacion, obtenerTramoAsignacion, resetSeedFlag } =
      await import('../../src/rrhh/utils/parametros-service.js');
    resetSeedFlag();
    inicializarParametros({ force: true });
    const guardados = listTramosAsignacion();
    expect(guardados.map((row) => row.tramo)).toEqual(['A', 'B', 'C', 'D']);
    // JSON turns Infinity into null: the open bracket must still resolve.
    expect(obtenerTramoAsignacion(9000000, '2026-09-30').tramo).toBe('D');
  });

  it('impide calcular la planilla si faltan los tramos del período', async () => {
    const { calcularPeriodo } = await import('../../src/rrhh/utils/liquidacion-service.js');
    const { TRAMOS_ASIGNACION_TABLE } = await import('../../src/rrhh/utils/parametros-service.js');
    localStorage.setItem(
      `erp_rrhh:${TRAMOS_ASIGNACION_TABLE}`,
      JSON.stringify([
        { id: 'x', tramo: 'A', hastaCLP: 1, montoPorCarga: 1, vigenciaDesde: '2030-01-01' }
      ])
    );
    expect(() => calcularPeriodo({ periodo: '2026-09', trabajadores: [], viewer: admin })).toThrow(
      /tramos de asignación familiar/
    );
  });
});
