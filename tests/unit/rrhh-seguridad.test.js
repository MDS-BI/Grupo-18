import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ROLES,
  ROLE_MATRIX,
  SENSITIVE_DATA,
  can,
  canAccessSensitive,
  canViewLiquidacion,
  canViewLine
} from '../../src/rrhh/seguridad/roles.js';
import {
  SESSION_KEY,
  clearSession,
  getSession,
  getViewer,
  setRole,
  setSession
} from '../../src/rrhh/seguridad/session.js';
import {
  AUDITORIA_KEY,
  editarAuditoria,
  eliminarAuditoria,
  listAuditoria,
  registrarAuditoria,
  resetAuditoria
} from '../../src/rrhh/seguridad/auditoria.js';
import {
  AccesoDenegadoError,
  assertSensitiveAccess,
  auditarConsulta,
  canAccess,
  filterLiquidacionForViewer,
  maskSensitive
} from '../../src/rrhh/seguridad/acceso-datos.js';

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

describe('US14/US6 - role matrix and permission guards', () => {
  it('allows the analyst to register and edit but never approve or close', () => {
    expect(can('analista', 'canRegisterNovedades')).toBe(true);
    expect(can('analista', 'canEditNovedades')).toBe(true);
    expect(can('analista', 'canApproveNovedades')).toBe(false);
    expect(can('analista', 'canClosePeriodos')).toBe(false);
    expect(can('analista', 'canApproveLiquidaciones')).toBe(false);
  });

  it('reserves approval, rejection and period closure for Jefatura', () => {
    expect(can('jefatura', 'canApproveNovedades')).toBe(true);
    expect(can('jefatura', 'canClosePeriodos')).toBe(true);
    expect(can('jefatura', 'canViewLiquidaciones')).toBe(false);
    expect(can('jefatura', 'canViewSueldos')).toBe(false);
    expect(can('jefatura', 'canViewDatosBancarios')).toBe(false);
  });

  it('gives the administrator every sensitive permission', () => {
    for (const dataType of Object.values(SENSITIVE_DATA)) {
      expect(canAccessSensitive('administrador', dataType)).toBe(true);
    }
    expect(can('administrador', 'canClosePeriodos')).toBe(true);
  });

  it('supports legacy role names used by the liquidation view', () => {
    expect(ROLE_MATRIX.analista_rrhh).toBeDefined();
    expect(canAccessSensitive('analista_rrhh', SENSITIVE_DATA.sueldos)).toBe(true);
    expect(canAccessSensitive('trabajador', SENSITIVE_DATA.cuentas_bancarias)).toBe(true);
    expect(canAccessSensitive('auditor', SENSITIVE_DATA.cuotas_sindicales)).toBe(true);
  });

  it('denies unknown or missing roles by default', () => {
    expect(canAccessSensitive('rol-inexistente', SENSITIVE_DATA.sueldos)).toBe(false);
    expect(canAccessSensitive(undefined, SENSITIVE_DATA.sueldos)).toBe(false);
    expect(can(undefined, 'canRegisterNovedades')).toBe(false);
    expect(canViewLiquidacion({ trabajador: { id: 't1' } }, { role: 'desconocido' })).toBe(false);
  });

  it('scopes liquidations to the worker role and its own record', () => {
    const liquidacion = { trabajador: { id: 'trab-1' } };
    expect(canViewLiquidacion(liquidacion, { role: 'trabajador', trabajadorId: 'trab-1' })).toBe(
      true
    );
    expect(canViewLiquidacion(liquidacion, { role: 'trabajador', trabajadorId: 'trab-2' })).toBe(
      false
    );
    expect(canViewLiquidacion(liquidacion, { role: 'analista' })).toBe(true);
  });

  it('hides sensitive line concepts according to the role', () => {
    const line = { esSensible: true, clasificacion: SENSITIVE_DATA.cuotas_sindicales };
    expect(canViewLine(line, { role: 'analista' })).toBe(false);
    expect(canViewLine(line, { role: 'auditor' })).toBe(true);
    expect(canViewLine({ monto: 1000 }, { role: 'analista' })).toBe(true);
  });
});

describe('US14 - simulated session persistence', () => {
  it('stores the role and exposes a viewer context', () => {
    setRole('jefatura', { usuario: 'Jefatura RRHH', equipo: ['trab-1'] });
    const raw = JSON.parse(store.get(SESSION_KEY));
    expect(raw.rol).toBe('jefatura');
    expect(raw.equipo).toEqual(['trab-1']);

    const viewer = getViewer();
    expect(viewer.role).toBe('jefatura');
    expect(viewer.usuario).toBe('Jefatura RRHH');
    expect(viewer.equipo).toEqual(['trab-1']);
  });

  it('falls back to the default session when storage is corrupted', () => {
    store.set(SESSION_KEY, '{not-json');
    expect(getSession().rol).toBe('analista');
  });

  it('preserves an unknown stored role so access is denied instead of granted', () => {
    setSession({ rol: 'intruso' });
    expect(getViewer().role).toBe('intruso');
    expect(canAccessSensitive(getViewer().role, SENSITIVE_DATA.sueldos)).toBe(false);
  });
});

describe('US6 - sensitive data guards and audit trail', () => {
  it('throws and audits a denied sensitive read', () => {
    expect(() =>
      assertSensitiveAccess('jefatura', SENSITIVE_DATA.sueldos, {
        tabla: 'liquidaciones',
        registroId: 'liq-1'
      })
    ).toThrow(AccesoDenegadoError);

    const rows = listAuditoria({ accion: 'acceso_denegado' });
    expect(rows).toHaveLength(1);
    expect(rows[0].tabla).toBe('liquidaciones');
    expect(rows[0].registroId).toBe('liq-1');
    expect(rows[0].motivo).toContain('sueldos');
  });

  it('allows authorised access without an audit denial', () => {
    expect(assertSensitiveAccess('analista', SENSITIVE_DATA.sueldos)).toBe(true);
    expect(canAccess('analista', SENSITIVE_DATA.liquidaciones)).toBe(true);
    expect(canAccess('jefatura', SENSITIVE_DATA.liquidaciones)).toBe(false);
    expect(listAuditoria({ accion: 'acceso_denegado' })).toHaveLength(0);
  });

  it('registers consultations with user, role, action and timestamp', () => {
    setRole('auditor', { usuario: 'Auditora Interna' });
    const entry = auditarConsulta({
      tabla: 'liquidaciones',
      registroId: 'liq-9',
      motivo: 'Revision'
    });

    expect(entry.usuario).toBe('Auditora Interna');
    expect(entry.rol).toBe('auditor');
    expect(entry.accion).toBe('ver_sensible');
    expect(entry.tabla).toBe('liquidaciones');
    expect(entry.registroId).toBe('liq-9');
    expect(Number.isNaN(Date.parse(entry.fecha))).toBe(false);
    expect(listAuditoria()).toHaveLength(1);
  });

  it('rejects editing and deleting audit entries', () => {
    registrarAuditoria({ accion: 'crear', tabla: 'novedades', registroId: 'nov-1' });
    expect(() => editarAuditoria()).toThrow(/solo inserci/i);
    expect(() => eliminarAuditoria()).toThrow(/solo inserci/i);
    expect(listAuditoria()).toHaveLength(1);
    expect(store.has(AUDITORIA_KEY)).toBe(true);
  });

  it('filters unauthorised lines and masks confidential amounts and bank data', () => {
    const liquidacion = {
      sueldoBase: 1200000,
      totalImponible: 1200000,
      trabajador: { id: 't1', nombre: 'Trabajador', banco: 'Banco X', numeroCuenta: '123' },
      lineas: [
        { id: 'l1', concepto: 'Sueldo', tipo: 'haber', monto: 1200000 },
        {
          id: 'l2',
          concepto: 'Cuota sindical',
          tipo: 'descuento',
          monto: 5000,
          esSensible: true,
          clasificacion: SENSITIVE_DATA.cuotas_sindicales
        }
      ]
    };

    const filtered = filterLiquidacionForViewer(liquidacion, { role: 'jefatura' });
    expect(filtered.lineas).toHaveLength(1);
    expect(filtered.sueldoBase).toBeNull();
    expect(filtered.totalImponible).toBeNull();
    expect(filtered.trabajador.banco).toBeUndefined();
    expect(filtered.trabajador.numeroCuenta).toBeUndefined();
    expect(maskSensitive(1200000)).not.toContain('1200');
  });
});
