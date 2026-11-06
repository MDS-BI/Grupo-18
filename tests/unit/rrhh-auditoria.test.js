import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  AUDITORIA_KEY,
  auditarConsultaSensible,
  editarAuditoria,
  eliminarAuditoria,
  listAuditoria,
  readAuditoria,
  registrarAuditoria,
  resetAuditoria,
  traceAuditoria
} from '../../src/rrhh/seguridad/auditoria.js';
import { clearSession, setRole } from '../../src/rrhh/seguridad/session.js';

let store;

beforeEach(() => {
  store = new Map();
  globalThis.localStorage = {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear()
  };
  clearSession();
  resetAuditoria();
});

afterEach(() => {
  clearSession();
  resetAuditoria();
});

describe('US6 - insert-only audit log', () => {
  it('persists user, role, timestamp, action and affected record', () => {
    setRole('jefatura', { usuario: 'Jefatura Norte' });
    const entry = registrarAuditoria({
      accion: 'aprobar',
      tabla: 'novedades',
      registroId: 'nov-42',
      camposModificados: ['estado'],
      motivo: 'Aprobacion de horas extra'
    });

    expect(entry.id).toMatch(/^aud-/);
    expect(entry.usuario).toBe('Jefatura Norte');
    expect(entry.rol).toBe('jefatura');
    expect(entry.accion).toBe('aprobar');
    expect(entry.tabla).toBe('novedades');
    expect(entry.registroId).toBe('nov-42');
    expect(entry.camposModificados).toEqual(['estado']);
    expect(entry.motivo).toBe('Aprobacion de horas extra');
    expect(Number.isNaN(Date.parse(entry.fecha))).toBe(false);

    const stored = JSON.parse(store.get(AUDITORIA_KEY));
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(entry.id);
  });

  it('never stores field values, only field names', () => {
    registrarAuditoria({
      accion: 'editar',
      tabla: 'liquidaciones',
      registroId: 'liq-7',
      camposModificados: ['sueldoBase', 'cuentaBancaria']
    });
    const serialized = store.get(AUDITORIA_KEY);
    expect(serialized).toContain('sueldoBase');
    expect(serialized).not.toContain('1200000');
    expect(serialized).not.toContain('123456789');
  });

  it('keeps insertion order and supports filters', () => {
    registrarAuditoria({ accion: 'crear', tabla: 'novedades', registroId: 'n1', rol: 'analista' });
    registrarAuditoria({ accion: 'aprobar', tabla: 'novedades', registroId: 'n1', rol: 'jefatura' });
    registrarAuditoria({
      accion: 'ver_sensible',
      tabla: 'liquidaciones',
      registroId: 'l1',
      rol: 'auditor'
    });

    expect(readAuditoria()).toHaveLength(3);
    expect(listAuditoria({ tabla: 'novedades' })).toHaveLength(2);
    expect(listAuditoria({ registroId: 'n1' })).toHaveLength(2);
    expect(listAuditoria({ rol: 'auditor' })).toHaveLength(1);
    expect(listAuditoria({ accion: 'crear' })).toHaveLength(1);
    expect(traceAuditoria({ tabla: 'liquidaciones', registroId: 'l1' })).toHaveLength(1);
  });

  it('supports date-range queries', () => {
    registrarAuditoria({
      accion: 'crear',
      tabla: 'novedades',
      registroId: 'n1',
      fecha: '2026-09-01T10:00:00.000Z'
    });
    registrarAuditoria({
      accion: 'editar',
      tabla: 'novedades',
      registroId: 'n1',
      fecha: '2026-09-15T10:00:00.000Z'
    });

    expect(listAuditoria({ desde: '2026-09-10' })).toHaveLength(1);
    expect(listAuditoria({ hasta: '2026-09-10' })).toHaveLength(1);
  });

  it('records sensitive queries as ver_sensible', () => {
    const entry = auditarConsultaSensible({
      tabla: 'liquidaciones',
      registroId: 'liq-2',
      motivo: 'Revision de liquidacion'
    });
    expect(entry.accion).toBe('ver_sensible');
    expect(listAuditoria({ accion: 'ver_sensible' })).toHaveLength(1);
  });

  it('rejects every attempt to edit or delete an entry', () => {
    registrarAuditoria({ accion: 'crear', tabla: 'novedades', registroId: 'n1' });
    const before = store.get(AUDITORIA_KEY);

    expect(() => editarAuditoria('aud-1', { accion: 'eliminar' })).toThrow(/solo inserci/i);
    expect(() => eliminarAuditoria('aud-1')).toThrow(/solo inserci/i);
    expect(store.get(AUDITORIA_KEY)).toBe(before);
  });
});
