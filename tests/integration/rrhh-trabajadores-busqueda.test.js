import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { crearCatalogo } from '../../src/rrhh/utils/catalogos-service.js';
import { crearTrabajador } from '../../src/rrhh/utils/trabajadores-service.js';
import { renderTrabajadoresView } from '../../src/rrhh/views/trabajadores-view.js';
import { calcularDigitoVerificador } from '../../src/rrhh/calculo/rut.js';

const analista = { role: 'analista', usuario: 'Analista RRHH' };
const TODOS = ['Ana Pérez', 'Camila Soto', 'Cristina Rojas'];

let dom;
let root;
let vista;
let cargoContador;
let camila;

function qs(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const node = qs(id);
  node.value = value;
  node.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
}

function setSelect(id, value) {
  const node = qs(id);
  node.value = value;
  node.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
}

function nombresVisibles() {
  return [...document.querySelectorAll('#rrhh-trabajadores-view tbody tr')].map(
    (row) => row.cells[1].textContent
  );
}

function seedTrabajadoresPaginados(total = 26) {
  for (let index = 1; index <= total; index += 1) {
    const sufijo = String(index).padStart(2, '0');
    const cuerpo = String(20000000 + index);
    crearTrabajador(
      {
        name: `Pagina ${sufijo}`,
        code: `TRAB-PAG-${sufijo}`,
        rut: `${cuerpo}${calcularDigitoVerificador(cuerpo)}`,
        email: `pagina${sufijo}@example.com`,
        fechaIngreso: '2024-01-15'
      },
      analista
    );
  }
  vista.refresh();
}

function botonPagina(label) {
  return [...document.querySelectorAll('#trabajadores-pagination button')].find(
    (button) => button.textContent === label
  );
}

function workerPayload(ids, overrides = {}) {
  return {
    name: 'Ana Pérez',
    code: 'TRAB-001',
    rut: '12.345.678-5',
    email: 'ana.perez@example.com',
    fechaIngreso: '2024-01-15',
    cargoId: ids.cargo.id,
    departamentoId: ids.departamento.id,
    centroCostoId: ids.centroCosto.id,
    ...overrides
  };
}

beforeEach(() => {
  dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
    url: 'http://localhost/'
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.localStorage = dom.window.localStorage;
  localStorage.clear();

  const departamento = crearCatalogo(
    { tipo: 'departamento', codigo: 'RRHH', nombre: 'Recursos Humanos' },
    analista
  );
  const centroCosto = crearCatalogo(
    { tipo: 'centro_costo', codigo: 'CC-100', nombre: 'Casa matriz' },
    analista
  );
  const cargo = crearCatalogo(
    { tipo: 'cargo', codigo: 'CAR-01', nombre: 'Analista de remuneraciones' },
    analista
  );
  cargoContador = crearCatalogo({ tipo: 'cargo', codigo: 'CAR-02', nombre: 'Contador' }, analista);
  const ids = { cargo, departamento, centroCosto };

  crearTrabajador(workerPayload(ids), analista);
  camila = crearTrabajador(
    workerPayload(ids, {
      name: 'Camila Soto',
      code: 'TRAB-002',
      rut: '7.654.321-6',
      email: 'camila@example.com',
      cargoId: cargoContador.id
    }),
    analista
  );
  crearTrabajador(
    workerPayload(ids, {
      name: 'Cristina Rojas',
      code: 'TRAB-003',
      rut: '9.876.543-3',
      email: 'cristina@example.com'
    }),
    analista
  );

  root = document.getElementById('root');
  vista = renderTrabajadoresView(root, { doc: document, viewer: analista });
});

afterEach(() => {
  vista?.dispose();
  dom.window.close();
});

describe('Buscador de Trabajadores por criterio', () => {
  it('empieza en Nombre y reduce los resultados con cada carácter', () => {
    expect([...qs('trabajadores-criterio').options].map((option) => option.value)).toEqual([
      'nombre',
      'rut',
      'codigo',
      'cargo'
    ]);
    expect(qs('trabajadores-buscar').placeholder).toBe('Nombre…');
    expect(qs('trabajadores-cargo').hidden).toBe(true);
    expect(nombresVisibles()).toEqual(TODOS);

    setText('trabajadores-buscar', 'c');
    expect(nombresVisibles()).toEqual(['Camila Soto', 'Cristina Rojas']);
    setText('trabajadores-buscar', 'ca');
    expect(nombresVisibles()).toEqual(['Camila Soto']);
  });

  it('cambia el control activo y limpia la consulta anterior', () => {
    setText('trabajadores-buscar', 'camila');
    setSelect('trabajadores-criterio', 'rut');

    expect(qs('trabajadores-buscar').hidden).toBe(false);
    expect(qs('trabajadores-cargo').hidden).toBe(true);
    expect(qs('trabajadores-buscar').placeholder).toContain('RUT');
    expect(qs('trabajadores-buscar').value).toBe('');
    expect(nombresVisibles()).toEqual(TODOS);

    setText('trabajadores-buscar', '7');
    expect(nombresVisibles()).toEqual(['Camila Soto']);

    setSelect('trabajadores-criterio', 'codigo');
    expect(qs('trabajadores-buscar').placeholder).toBe('Código…');
    expect(qs('trabajadores-buscar').value).toBe('');
    setText('trabajadores-buscar', 'trab003');
    expect(nombresVisibles()).toEqual(['Cristina Rojas']);
  });

  it('filtra al instante con el desplegable de cargos y lo reinicia al salir', () => {
    setSelect('trabajadores-criterio', 'cargo');

    expect(qs('trabajadores-buscar').hidden).toBe(true);
    expect(qs('trabajadores-cargo').hidden).toBe(false);
    expect([...qs('trabajadores-cargo').options].map((option) => option.textContent)).toEqual([
      'Todos los cargos',
      'Analista de remuneraciones',
      'Contador'
    ]);
    expect(nombresVisibles()).toEqual(TODOS);

    setSelect('trabajadores-cargo', cargoContador.id);
    expect(nombresVisibles()).toEqual(['Camila Soto']);

    setSelect('trabajadores-criterio', 'nombre');
    expect(qs('trabajadores-cargo').value).toBe('');
    expect(nombresVisibles()).toEqual(TODOS);
  });

  it('aplica el alcance de jefatura a todos los criterios', () => {
    vista.dispose();
    root.textContent = '';
    vista = renderTrabajadoresView(root, {
      doc: document,
      viewer: { role: 'jefatura', usuario: 'Jefatura A', equipo: [camila.entityId] }
    });

    expect(nombresVisibles()).toEqual(['Camila Soto']);
    setText('trabajadores-buscar', 'c');
    expect(nombresVisibles()).toEqual(['Camila Soto']);

    setSelect('trabajadores-criterio', 'rut');
    setText('trabajadores-buscar', '1');
    expect(nombresVisibles()).toEqual([]);
  });

  it('paginates workers at 25 rows, preserves the search and resets on a new query', () => {
    seedTrabajadoresPaginados();
    const pagination = qs('trabajadores-pagination');
    expect(pagination.tagName).toBe('NAV');
    expect(pagination.getAttribute('aria-label')).toBe('Paginación de resultados');

    const estado = () => pagination.querySelector('.rrhh-pagination-status').textContent;
    expect(estado()).toBe('Página 1 de 2 · 29 registro(s)');
    expect(nombresVisibles()).toHaveLength(25);
    expect(nombresVisibles().length).toBeLessThanOrEqual(25);

    botonPagina('Siguiente').click();
    expect(estado()).toBe('Página 2 de 2 · 29 registro(s)');
    expect(nombresVisibles()).toHaveLength(4);

    setText('trabajadores-buscar', 'Pagina');
    expect(qs('trabajadores-buscar').value).toBe('Pagina');
    expect(estado()).toBe('Página 1 de 2 · 26 registro(s)');
    expect(nombresVisibles()).toHaveLength(25);

    botonPagina('Siguiente').click();
    expect(qs('trabajadores-buscar').value).toBe('Pagina');
    expect(estado()).toBe('Página 2 de 2 · 26 registro(s)');
    expect(nombresVisibles()).toHaveLength(1);
    expect(nombresVisibles()[0]).toMatch(/^Pagina /);

    setText('trabajadores-buscar', 'Pagina 01');
    expect(estado()).toBe('Página 1 de 1 · 1 registro(s)');
    expect(nombresVisibles()).toEqual(['Pagina 01']);
  });
});
