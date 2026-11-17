import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const html = fs.readFileSync(fileURLToPath(new URL('../../index.html', import.meta.url)), 'utf8');

let dom;

function click(id) {
  document.getElementById(id).click();
}

async function bootRrhh() {
  const { initApp } = await import('../../src/app.js');
  const { normalizeConfig } = await import('../../src/module-config.js');
  await initApp(
    normalizeConfig({
      moduleName: 'Recursos Humanos',
      labels: { entity: 'Trabajador', entities: 'Trabajadores' },
      rrhh: { enabled: true, label: 'Remuneraciones' }
    })
  );
}

beforeEach(() => {
  dom = new JSDOM(html, { url: 'http://localhost/' });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.alert = vi.fn();
  globalThis.confirm = vi.fn(() => true);
  dom.window.scrollTo = vi.fn();
  dom.window.localStorage.clear();
  globalThis.__ERP_BASE_SEED_DISABLED__ = false;
  vi.resetModules();
});

afterEach(() => {
  globalThis.__ERP_BASE_SEED_DISABLED__ = true;
  dom.window.close();
});

describe('Datos de prueba RRHH', () => {
  it('precarga solo una vez y no recarga datos borrados por el usuario', async () => {
    const seed = await import('../../src/rrhh/data/seed.js');

    expect(seed.ensureSeedOnFirstBoot()).toBe(true);
    expect(localStorage.getItem(seed.SEED_LOADED_KEY)).toBe('loaded');

    localStorage.removeItem('erp_rrhh:trabajadores');
    localStorage.removeItem('erp_base_module:entities');
    expect(seed.ensureSeedOnFirstBoot()).toBe(false);

    const { listTrabajadores } = await import('../../src/rrhh/utils/trabajadores-service.js');
    expect(listTrabajadores({ incluirBaja: true })).toHaveLength(0);
  });

  it('carga un dataset válido y representativo sin exponer trabajadores en lo genérico', async () => {
    const seed = await import('../../src/rrhh/data/seed.js');
    const summary = seed.loadSeedData();
    expect(summary).toMatchObject({ trabajadores: 5, contratos: 5, novedades: 5, liquidaciones: 3 });

    const { validarRut } = await import('../../src/rrhh/calculo/rut.js');
    const { listTrabajadores } = await import('../../src/rrhh/utils/trabajadores-service.js');
    const { listContratos, getContratoVigente } = await import(
      '../../src/rrhh/utils/contratos-service.js'
    );
    const { listNovedades } = await import('../../src/rrhh/utils/novedades-service.js');
    const { listLiquidaciones } = await import('../../src/rrhh/utils/liquidacion-service.js');
    const { loadGenericEntities } = await import('../../src/storage.js');

    const trabajadores = listTrabajadores({ incluirBaja: true });
    expect(trabajadores).toHaveLength(5);
    expect(trabajadores.every((row) => validarRut(row.rut))).toBe(true);
    expect(validarRut(seed.RUT_INVALIDO_EJEMPLO)).toBe(false);
    expect(trabajadores.filter((row) => row.estadoLaboral === 'Desvinculado')).toHaveLength(1);
    expect(trabajadores.filter((row) => row.estadoLaboral === 'Activo')).toHaveLength(4);

    const camila = trabajadores.find((row) => row.code === 'TR-003');
    expect(getContratoVigente(camila.entityId, '2026-11-17')).toBeNull();
    expect(listContratos().some((row) => row.sueldoBase === 553553)).toBe(true);
    expect(listContratos().some((row) => row.tipoContrato === 'plazo_fijo')).toBe(true);

    const horasExtraAprobadas = listNovedades({ tipo: 'horas_extra', estado: 'aprobada' });
    expect(horasExtraAprobadas.some((row) => row.cantidad >= 20)).toBe(true);
    expect(listNovedades({ periodo: '2026-10' })).toHaveLength(1);
    expect(listNovedades({ periodo: '2026-10' })[0].estado).toBe('pendiente');

    const licencia = listNovedades({ tipo: 'licencia_medica' })[0];
    expect(licencia.observacion).toBe('');
    expect(listNovedades({ tipo: 'ausencia' })[0].observacion).toContain('Atraso');

    const liquidaciones = listLiquidaciones();
    expect(liquidaciones).toHaveLength(3);
    expect(
      liquidaciones.some((row) => row.lineas.some((line) => line.concepto === 'Bono imponible'))
    ).toBe(true);
    expect(loadGenericEntities()).toHaveLength(0);
  });

  it('restaura los datos desde el botón de RR.HH. y confirma el reemplazo', async () => {
    localStorage.setItem('erp_rrhh:seedLoaded', 'skipped-existing-data');
    await bootRrhh();
    click('nav-rrhh');

    click('rrhh-seed-button');

    expect(globalThis.confirm).toHaveBeenCalledWith(expect.stringContaining('reemplazará'));
    const feedback = document.getElementById('rrhh-seed-feedback');
    expect(feedback.hidden).toBe(false);
    expect(feedback.textContent).toContain('Datos de prueba cargados');
    expect(localStorage.getItem('erp_rrhh:seedLoaded')).toBe('loaded');

    const { listLiquidaciones } = await import('../../src/rrhh/utils/liquidacion-service.js');
    expect(listLiquidaciones()).toHaveLength(3);
  });
});
