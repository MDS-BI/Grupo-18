import { describe, it, expect, beforeEach } from 'vitest';
import { crearTrabajador } from '../../src/rrhh/utils/trabajadores-service.js';
import {
  actualizarContrato,
  contratosVigentesEn,
  crearContrato,
  getContratoVigente,
  listContratos,
  registrarCambioSueldo,
  terminarContrato,
  validarContrato
} from '../../src/rrhh/utils/contratos-service.js';
import {
  contratosPorVencer,
  diasHastaVencimiento,
  resumenAlertas
} from '../../src/rrhh/utils/alertas-service.js';

const viewer = { role: 'analista', usuario: 'Analista RRHH' };

let store;

beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
});

function createWorker(name = 'Ana Pérez', code = 'TRAB-001') {
  return crearTrabajador({ name, code }, viewer);
}

function contractPayload(entityId, overrides = {}) {
  return {
    entityId,
    tipoContrato: 'indefinido',
    sueldoBase: 1000000,
    jornadaHorasSemanales: 45,
    fechaInicio: '2024-01-01',
    modalidadGratificacion: 'art50',
    asignacionColacion: 50000,
    asignacionMovilizacion: 30000,
    ...overrides
  };
}

function isoDaysFromToday(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

describe('US2 - validación de contratos', () => {
  it('rejects missing worker, salary, journey, type and dates', () => {
    const result = validarContrato({
      entityId: '',
      sueldoBase: 0,
      jornadaHorasSemanales: 60,
      tipoContrato: 'informal',
      fechaInicio: '2024-13-01'
    });
    expect(result.valid).toBe(false);
    expect(result.errors.entityId).toBeDefined();
    expect(result.errors.sueldoBase).toBeDefined();
    expect(result.errors.jornadaHorasSemanales).toBeDefined();
    expect(result.errors.tipoContrato).toBeDefined();
    expect(result.errors.fechaInicio).toBeDefined();
  });

  it('requires a term date for fixed-term contracts and validates its order', () => {
    const worker = createWorker();
    const missingTerm = validarContrato(
      contractPayload(worker.entityId, { tipoContrato: 'plazo_fijo' })
    );
    expect(missingTerm.errors.fechaTermino).toBeDefined();

    const reversed = validarContrato(
      contractPayload(worker.entityId, {
        tipoContrato: 'plazo_fijo',
        fechaInicio: '2024-06-01',
        fechaTermino: '2024-05-01'
      })
    );
    expect(reversed.errors.fechaTermino).toBeDefined();
  });

  it('rejects an unknown worker', () => {
    const result = validarContrato(contractPayload('no-existe'));
    expect(result.valid).toBe(false);
    expect(result.errors.entityId).toBeDefined();
  });
});

describe('US2 - historial y vigencia de contratos', () => {
  it('stores both entityId and entity_id and marks the contract as vigente', () => {
    const worker = createWorker();
    const contrato = crearContrato(contractPayload(worker.entityId), viewer);

    expect(contrato.entityId).toBe(worker.entityId);
    expect(contrato.entity_id).toBe(worker.entityId);
    expect(contrato.estado).toBe('vigente');
    expect(contrato.sueldoBase).toBe(1000000);
  });

  it('selects the contract active on a date', () => {
    const worker = createWorker();
    crearContrato(
      contractPayload(worker.entityId, {
        tipoContrato: 'plazo_fijo',
        fechaInicio: '2024-01-01',
        fechaTermino: '2024-06-30'
      }),
      viewer
    );

    expect(getContratoVigente(worker.entityId, '2024-03-15')).not.toBeNull();
    expect(getContratoVigente(worker.entityId, '2024-07-01')).toBeNull();
    expect(getContratoVigente(worker.entityId, '2023-12-31')).toBeNull();
  });

  it('registers a salary change closing the previous contract the day before', () => {
    const worker = createWorker();
    const original = crearContrato(contractPayload(worker.entityId), viewer);

    const cambio = registrarCambioSueldo(
      worker.entityId,
      { fechaInicio: '2024-07-01', sueldoBase: 1200000, observacion: 'Ajuste anual' },
      viewer
    );

    const rows = listContratos({ entityId: worker.entityId });
    expect(rows).toHaveLength(2);
    const previous = rows.find((row) => row.id === original.id);
    expect(previous.estado).toBe('terminado');
    expect(previous.fechaTermino).toBe('2024-06-30');
    expect(cambio.sueldoBase).toBe(1200000);
    expect(cambio.tipoContrato).toBe('indefinido');
    expect(getContratoVigente(worker.entityId, '2024-08-01').id).toBe(cambio.id);
  });

  it('returns one engine-shaped contract per worker for a date', () => {
    const worker = createWorker();
    const contrato = crearContrato(contractPayload(worker.entityId), viewer);

    const [vigente] = contratosVigentesEn('2024-03-01');
    expect(vigente.id).toBe(contrato.id);
    expect(vigente.entity_id).toBe(worker.entityId);
    expect(vigente.estado).toBe('vigente');
    expect(vigente.sueldoBase).toBe(1000000);
  });

  it('supports editing and terminating a contract', () => {
    const worker = createWorker();
    const contrato = crearContrato(contractPayload(worker.entityId), viewer);

    const edited = actualizarContrato(contrato.id, { sueldoBase: 1100000 }, viewer);
    expect(edited.sueldoBase).toBe(1100000);

    const terminated = terminarContrato(contrato.id, '2024-12-31', viewer);
    expect(terminated.estado).toBe('terminado');
    expect(terminated.fechaTermino).toBe('2024-12-31');
  });
});

describe('US2 - alertas de vencimiento', () => {
  it('computes whole days to expiry using date-only values', () => {
    expect(diasHastaVencimiento('2024-01-31', '2024-01-01')).toBe(30);
    expect(diasHastaVencimiento('2023-12-31', '2024-01-01')).toBe(-1);
    expect(diasHastaVencimiento('', '2024-01-01')).toBeNull();
  });

  it('alerts contracts that expire within 30 days and flags expired ones', () => {
    const soon = createWorker('Contrato Pronto', 'TRAB-010');
    const later = createWorker('Contrato Lejano', 'TRAB-011');
    const expired = createWorker('Contrato Vencido', 'TRAB-012');

    const soonContract = crearContrato(
      contractPayload(soon.entityId, {
        tipoContrato: 'plazo_fijo',
        fechaInicio: isoDaysFromToday(-10),
        fechaTermino: isoDaysFromToday(10)
      }),
      viewer
    );
    crearContrato(
      contractPayload(later.entityId, {
        tipoContrato: 'plazo_fijo',
        fechaInicio: isoDaysFromToday(-10),
        fechaTermino: isoDaysFromToday(90)
      }),
      viewer
    );
    const expiredContract = crearContrato(
      contractPayload(expired.entityId, {
        tipoContrato: 'plazo_fijo',
        fechaInicio: isoDaysFromToday(-30),
        fechaTermino: isoDaysFromToday(-2)
      }),
      viewer
    );

    const alerts = contratosPorVencer();
    expect(alerts.map((row) => row.contratoId)).toContain(soonContract.id);
    expect(alerts.map((row) => row.contratoId)).toContain(expiredContract.id);
    expect(alerts).toHaveLength(2);

    const summary = resumenAlertas();
    expect(summary.total).toBe(2);
    expect(summary.vencidos).toBe(1);
    expect(summary.proximos).toBe(1);
    expect(summary.alertas.find((row) => row.contratoId === expiredContract.id).vencido).toBe(true);
  });

  it('does not alert terminated contracts', () => {
    const worker = createWorker();
    const contrato = crearContrato(
      contractPayload(worker.entityId, {
        tipoContrato: 'plazo_fijo',
        fechaInicio: isoDaysFromToday(-10),
        fechaTermino: isoDaysFromToday(10)
      }),
      viewer
    );
    terminarContrato(contrato.id, isoDaysFromToday(0), viewer);

    expect(contratosPorVencer()).toHaveLength(0);
  });
});
