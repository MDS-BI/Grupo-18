import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { addEntity } from '../../src/storage.js';
import {
  aprobarNovedad,
  crearNovedad
} from '../../src/rrhh/utils/novedades-service.js';
import {
  aprobarLiquidacion,
  calcularPeriodo,
  loadLiquidacion
} from '../../src/rrhh/utils/liquidacion-service.js';
import {
  abrirPeriodo,
  cerrarPeriodo
} from '../../src/rrhh/utils/periodos-service.js';
import {
  auditarConsulta,
  assertSensitiveAccess
} from '../../src/rrhh/seguridad/acceso-datos.js';
import { SENSITIVE_DATA } from '../../src/rrhh/seguridad/roles.js';
import {
  AUDITORIA_KEY,
  editarAuditoria,
  eliminarAuditoria,
  listAuditoria,
  readAuditoria
} from '../../src/rrhh/seguridad/auditoria.js';
import { setRole } from '../../src/rrhh/seguridad/session.js';
import { renderAuditoriaView } from '../../src/rrhh/views/auditoria.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const jefatura = { role: 'jefatura', usuario: 'Jefatura RRHH' };
const admin = { role: 'administrador', usuario: 'Administrador RRHH' };

const contrato = {
  id: 'contrato-auditoria',
  entity_id: 'trab-auditoria',
  estado: 'vigente',
  sueldoBase: 1000000,
  jornadaHorasSemanales: 42,
  tipoContrato: 'indefinido',
  modalidadGratificacion: 'art50',
  asignacionColacion: 0,
  asignacionMovilizacion: 0
};

let dom;
let root;
let worker;

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();
  setRole('analista', { usuario: 'Analista RRHH' });
  abrirPeriodo('2026-09', admin);
  worker = addEntity({
    name: 'Trabajador Auditoria',
    code: 'AUD-001',
    rut: '12.345.678-5'
  });
  root = document.getElementById('root');
});

afterEach(() => {
  dom.window.close();
});

function novedad() {
  return crearNovedad(
    {
      trabajadorEntityId: worker.entity_id,
      periodo: '2026-09',
      tipo: 'horas_extra',
      cantidad: 4,
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-04'
    },
    analista
  );
}

function calculate() {
  return calcularPeriodo({
    periodo: '2026-09',
    trabajadores: [
      {
        entity_id: worker.entity_id,
        name: worker.name,
        taxId: worker.rut
      }
    ],
    contratos: [{ ...contrato, entity_id: worker.entity_id }],
    viewer: analista
  }).liquidaciones[0];
}

describe('US6 - automatic audit of sensitive consultations and changes', () => {
  it('audits every creation and state change with actor, role, date and record', () => {
    const created = novedad();
    aprobarNovedad(created.id, jefatura);
    const liquidation = calculate();
    aprobarLiquidacion(liquidation.id, admin);
    loadLiquidacion(liquidation.id, { role: 'auditor', usuario: 'Auditora Interna' });
    cerrarPeriodo('2026-09', jefatura);

    const rows = readAuditoria();
    expect(rows.length).toBeGreaterThanOrEqual(6);
    expect(rows.map((row) => row.accion)).toEqual(
      expect.arrayContaining([
        'crear',
        'aprobar',
        'calcular',
        'ver_sensible',
        'cerrar_periodo'
      ])
    );

    for (const row of rows) {
      expect(row.usuario).toBeTruthy();
      expect(row.rol).toBeTruthy();
      expect(Number.isNaN(Date.parse(row.fecha))).toBe(false);
      expect(row.tabla).toBeTruthy();
      expect(row).toHaveProperty('camposModificados');
    }

    const creation = rows.find((row) => row.accion === 'crear');
    expect(creation.usuario).toBe('Analista RRHH');
    expect(creation.rol).toBe('analista');
    expect(creation.registroId).toBe(created.id);

    const approval = rows.find((row) => row.accion === 'aprobar' && row.tabla === 'novedades');
    expect(approval.usuario).toBe('Jefatura RRHH');
    expect(approval.rol).toBe('jefatura');

    const calculation = rows.find((row) => row.accion === 'calcular');
    expect(calculation.registroId).toBe('2026-09');
    expect(calculation.rol).toBe('analista');

    const stateChange = rows.find((row) => row.accion === 'aprobar' && row.tabla === 'liquidaciones');
    expect(stateChange.registroId).toBe(liquidation.id);
    expect(stateChange.rol).toBe('administrador');

    const sensitiveRead = rows.find((row) => row.accion === 'ver_sensible');
    expect(sensitiveRead.usuario).toBe('Auditora Interna');
    expect(sensitiveRead.rol).toBe('auditor');
    expect(sensitiveRead.registroId).toBe(liquidation.id);

    const closure = rows.find((row) => row.accion === 'cerrar_periodo');
    expect(closure.registroId).toBe('2026-09');
    expect(closure.rol).toBe('jefatura');
  });

  it('audits sensitive reads of salaries, bank accounts and union dues', () => {
    setRole('auditor', { usuario: 'Auditora Interna' });
    for (const dataType of Object.values(SENSITIVE_DATA)) {
      auditarConsulta({
        tabla: 'datos_sensibles',
        registroId: dataType,
        motivo: `Consulta autorizada de ${dataType}`
      });
    }

    const rows = listAuditoria({ accion: 'ver_sensible', tabla: 'datos_sensibles' });
    expect(rows).toHaveLength(4);
    expect(rows.map((row) => row.registroId)).toEqual(
      expect.arrayContaining([
        SENSITIVE_DATA.sueldos,
        SENSITIVE_DATA.liquidaciones,
        SENSITIVE_DATA.cuentas_bancarias,
        SENSITIVE_DATA.cuotas_sindicales
      ])
    );
    for (const row of rows) {
      expect(row.usuario).toBe('Auditora Interna');
      expect(row.rol).toBe('auditor');
    }
  });

  it('audits denied attempts without storing sensitive values', () => {
    expect(() =>
      assertSensitiveAccess('jefatura', SENSITIVE_DATA.sueldos, {
        tabla: 'liquidaciones',
        registroId: 'liq-99'
      })
    ).toThrow(/Acceso denegado/i);

    const [denied] = listAuditoria({ accion: 'acceso_denegado' });
    expect(denied.rol).toBe('jefatura');
    expect(denied.tabla).toBe('liquidaciones');
    expect(denied.registroId).toBe('liq-99');
    expect(denied.motivo).toContain('sueldos');

    const raw = localStorage.getItem(AUDITORIA_KEY);
    expect(raw).not.toContain('1200000');
    expect(raw).not.toContain('123456789');
    expect(raw).not.toContain('Banco');
  });

  it('rejects editing or deleting audit records', () => {
    novedad();
    const before = localStorage.getItem(AUDITORIA_KEY);
    expect(() => editarAuditoria()).toThrow(/solo inserci/i);
    expect(() => eliminarAuditoria()).toThrow(/solo inserci/i);
    expect(localStorage.getItem(AUDITORIA_KEY)).toBe(before);
  });

  it('renders the audit log for Auditoria and filters by table', () => {
    const created = novedad();
    aprobarNovedad(created.id, jefatura);
    const liquidation = calculate();
    aprobarLiquidacion(liquidation.id, admin);

    renderAuditoriaView(root, {
      doc: document,
      viewer: { role: 'auditor', usuario: 'Auditora Interna' }
    });

    expect(document.getElementById('rrhh-auditoria-view')).not.toBeNull();
    expect(document.getElementById('auditoria-list')).not.toBeNull();
    expect(document.getElementById('auditoria-list').textContent).toMatch(/Consulta sensible|Creaci.n|Aprobaci.n/i);

    const filter = document.getElementById('auditoria-tabla');
    filter.value = 'liquidaciones';
    filter.dispatchEvent(new dom.window.Event('change', { bubbles: true }));

    const rows = document.querySelectorAll('#auditoria-list .rrhh-table-row:not(.rrhh-table-head)');
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.textContent).toContain('liquidaciones');
    }
  });

  it('denies the audit view to a role without permission', () => {
    renderAuditoriaView(root, {
      doc: document,
      viewer: { role: 'analista', usuario: 'Analista RRHH' }
    });
    expect(document.getElementById('auditoria-access-denied')).not.toBeNull();
    expect(document.getElementById('auditoria-list')).toBeNull();
  });
});
