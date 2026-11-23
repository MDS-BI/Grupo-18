import { describe, it, expect, beforeEach } from 'vitest';
import {
  actualizarTrabajador,
  crearTrabajador
} from '../../src/rrhh/utils/trabajadores-service.js';
import { crearCatalogo } from '../../src/rrhh/utils/catalogos-service.js';
import { crearContrato } from '../../src/rrhh/utils/contratos-service.js';
import { asegurarPeriodo } from '../../src/rrhh/utils/periodos-service.js';
import { listAuditoria } from '../../src/rrhh/seguridad/auditoria.js';
import { calcularDigitoVerificador } from '../../src/rrhh/calculo/rut.js';
import {
  brechaPorcentual,
  mediana,
  variacionPorcentual
} from '../../src/rrhh/calculo/estadisticas.js';
import {
  MENSAJE_SIN_PERIODOS,
  generarReporte,
  reportesDisponibles
} from '../../src/rrhh/utils/reportes-service.js';

const admin = { role: 'administrador', usuario: 'Administrador RRHH' };
const analista = { role: 'analista', usuario: 'Analista RRHH' };
let store;
let seq;
let cargoId;
let deptoId;

function rut() {
  seq += 1;
  const body = String(10000000 + seq);
  return `${body}-${calcularDigitoVerificador(body)}`;
}

function persona(genero, sueldo, extra = {}) {
  const worker = crearTrabajador(
    {
      name: `${genero} ${seq + 1}`,
      code: `T-${seq + 1}`,
      rut: rut(),
      fechaIngreso: '2025-01-01',
      cargoId,
      departamentoId: deptoId,
      genero,
      ...extra
    },
    admin
  );
  crearContrato(
    {
      entityId: worker.entityId,
      tipoContrato: 'indefinido',
      sueldoBase: sueldo,
      jornadaHorasSemanales: 42,
      fechaInicio: '2025-01-01',
      modalidadGratificacion: 'art50'
    },
    admin
  );
  return worker;
}

beforeEach(() => {
  store = new Map();
  seq = 0;
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  cargoId = crearCatalogo({ tipo: 'cargo', codigo: 'CAR-A', nombre: 'Analista' }, admin).id;
  deptoId = crearCatalogo({ tipo: 'departamento', codigo: 'OPE', nombre: 'Operaciones' }, admin).id;
});

describe('US10 - estadísticas', () => {
  it('calcula mediana, variación y brecha', () => {
    expect(mediana([3, 1, 2])).toBe(2);
    expect(mediana([1, 2, 3, 4])).toBe(2.5);
    expect(variacionPorcentual(110, 100)).toBe(10);
    expect(variacionPorcentual(5, 0)).toBeNull();
    expect(brechaPorcentual(1000, 900)).toBe(10);
  });
});

describe('US10 - reportes', () => {
  it('muestra un estado vacío cuando no hay períodos cerrados', () => {
    asegurarPeriodo('2026-09', { estado: 'abierto' });
    const reporte = generarReporte('dotacion', { viewer: admin });
    expect(reporte.vacio).toBe(true);
    expect(reporte.mensaje).toBe(MENSAJE_SIN_PERIODOS);
  });

  it('calcula la brecha entre Femenino y Masculino y cuenta aparte al resto', () => {
    asegurarPeriodo('2026-08', { estado: 'cerrado' });
    for (let i = 0; i < 6; i += 1) persona('Femenino', 900000);
    for (let i = 0; i < 7; i += 1) persona('Masculino', 1000000);
    persona('Prefiere no informar', 950000);
    persona('No binario', 950000);
    const reporte = generarReporte('brecha', { viewer: admin });
    const fila = reporte.filas[0];
    expect(fila.oculto).toBe(false);
    expect(fila.medianaFemenino).toBe(900000);
    expect(fila.medianaMasculino).toBe(1000000);
    expect(fila.brecha).toBe(10);
    expect(fila.otros).toBeNull(); // 2 personas: se oculta
    expect(fila.otrosOculto).toBe(true);
    expect(listAuditoria({ tabla: 'reportes' }).some((row) => row.accion === 'ver_sensible')).toBe(
      true
    );
  });

  it('oculta la brecha de un cargo con menos de 5 personas en un grupo', () => {
    asegurarPeriodo('2026-08', { estado: 'cerrado' });
    for (let i = 0; i < 3; i += 1) persona('Femenino', 900000);
    for (let i = 0; i < 10; i += 1) persona('Masculino', 1000000);
    const fila = generarReporte('brecha', { viewer: admin }).filas[0];
    expect(fila.oculto).toBe(true);
    expect(fila.brecha).toBeNull();
  });

  it('cuenta dotación, altas y bajas y oculta grupos pequeños', () => {
    asegurarPeriodo('2026-08', { estado: 'cerrado' });
    for (let i = 0; i < 5; i += 1) persona('Femenino', 900000);
    persona('Masculino', 900000, { fechaIngreso: '2026-08-10' });
    const reporte = generarReporte('dotacion', { viewer: admin });
    expect(reporte.filas[0]).toMatchObject({
      grupo: 'Operaciones',
      activos: 6,
      altas: 1,
      bajas: 0
    });

    const otro = crearCatalogo(
      { tipo: 'departamento', codigo: 'FIN', nombre: 'Finanzas' },
      admin
    ).id;
    const solo = persona('Femenino', 900000);
    actualizarTrabajador(solo.entityId, { departamentoId: otro }, admin);
    const conPequeno = generarReporte('dotacion', { viewer: admin });
    const finanzas = conPequeno.filas.find((row) => row.grupo === 'Finanzas');
    expect(finanzas.oculto).toBe(true);
    expect(finanzas.activos).toBeNull();
  });

  it('aplica los permisos por rol', () => {
    asegurarPeriodo('2026-08', { estado: 'cerrado' });
    expect(reportesDisponibles(analista).map((row) => row.tipo)).not.toContain('brecha');
    expect(() => generarReporte('brecha', { viewer: analista })).toThrow(/autorización/);
    const jefatura = { role: 'jefatura', usuario: 'Jefa', trabajadorId: 'x' };
    expect(reportesDisponibles(jefatura).map((row) => row.tipo)).toEqual([
      'horas_extra',
      'ausentismo'
    ]);
    expect(() => generarReporte('costo', { viewer: jefatura })).toThrow(/autorización/);
    expect(() => generarReporte('dotacion', { viewer: { role: 'trabajador' } })).toThrow(
      /autorización/
    );
  });

  it('oculta las cifras del equipo pequeño de una jefatura', () => {
    asegurarPeriodo('2026-08', { estado: 'cerrado' });
    const jefa = persona('Femenino', 1500000);
    for (let i = 0; i < 3; i += 1) {
      const miembro = persona('Masculino', 900000);
      actualizarTrabajador(miembro.entityId, { jefeId: jefa.entityId }, admin);
    }
    const jefatura = { role: 'jefatura', usuario: 'Jefa', trabajadorId: jefa.entityId };
    const fila = generarReporte('horas_extra', { viewer: jefatura }).filas[0];
    expect(fila.grupo).toBe('Mi equipo');
    expect(fila.oculto).toBe(true);
  });
});
