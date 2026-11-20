import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { renderGraficoReporte } from '../../src/rrhh/components/grafico-reporte.js';

describe('Gráfico accesible de reportes (FR-111)', () => {
  it('muestra barras con la misma información que la tabla', () => {
    const dom = new JSDOM('<!DOCTYPE html><body><div id="root"></div></body>', {
      url: 'http://localhost/'
    });
    const root = dom.window.document.getElementById('root');
    renderGraficoReporte(root, {
      doc: dom.window.document,
      titulo: 'Liquidaciones por mes',
      datos: [
        { etiqueta: 'Septiembre', valor: 10 },
        { etiqueta: 'Octubre', valor: 20 }
      ]
    });
    expect(root.querySelectorAll('.rrhh-grafico-barra')).toHaveLength(2);
    expect(root.textContent).toContain('Septiembre: 10');
    expect(root.querySelector('[aria-label="Octubre: 20"]')).not.toBeNull();
  });
});
