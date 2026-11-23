/** Management reports view (US10): table + accessible bar chart per report. */

import {
  generarReporte,
  periodosCerrados,
  reportesDisponibles
} from '../utils/reportes-service.js';
import { listCatalogos } from '../utils/catalogos-service.js';
import { etiquetaPeriodo } from '../utils/periodos.js';
import { renderGraficoReporte } from '../components/grafico-reporte.js';
import { agregarFila, crearTabla } from '../components/tabla.js';
import {
  el,
  feedback,
  field,
  formatMoney,
  hideFeedback,
  select,
  showFeedback
} from '../components/dom.js';

function formatear(valor, formato) {
  if (valor === null || valor === undefined) return '—';
  if (formato === 'dinero') return formatMoney(valor);
  if (formato === 'porcentaje') {
    return `${Number(valor).toLocaleString('es-CL', { maximumFractionDigits: 1 })} %`;
  }
  return Number(valor).toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

export function renderReportesView(root, { doc, viewer } = {}) {
  const documentRef = doc || root.ownerDocument;
  const container = el(documentRef, 'section', 'rrhh-section rrhh-reportes-view');
  container.id = 'rrhh-reportes-view';
  container.setAttribute('aria-labelledby', 'rrhh-reportes-title');

  const header = el(documentRef, 'div', 'rrhh-section-header');
  const title = el(documentRef, 'h3', null, 'Reportes de gestión');
  title.id = 'rrhh-reportes-title';
  header.appendChild(title);
  header.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      'Cifras agregadas sobre períodos cerrados. Los grupos con menos de 5 personas se ocultan para no identificar a nadie.'
    )
  );
  container.appendChild(header);

  const disponibles = reportesDisponibles(viewer);
  if (disponibles.length === 0) {
    container.appendChild(
      el(documentRef, 'p', 'rrhh-notice', 'Tu rol no tiene acceso a los reportes.')
    );
    root.appendChild(container);
    return {
      dispose() {
        root.textContent = '';
      }
    };
  }

  const messages = feedback(documentRef, 'reportes-feedback');
  const periodos = periodosCerrados();
  const opcionesPeriodo = periodos.map((id) => ({ value: id, label: etiquetaPeriodo(id) }));

  const toolbar = el(documentRef, 'div', 'rrhh-toolbar');
  const tipoSelect = select(documentRef, {
    id: 'reporte-tipo',
    options: disponibles.map((row) => ({ value: row.tipo, label: row.titulo }))
  });
  const desdeSelect = select(documentRef, {
    id: 'reporte-desde',
    value: periodos[0] || '',
    options: opcionesPeriodo
  });
  const hastaSelect = select(documentRef, {
    id: 'reporte-hasta',
    value: periodos[periodos.length - 1] || '',
    options: opcionesPeriodo
  });
  toolbar.appendChild(
    field(documentRef, { id: 'reporte-tipo', label: 'Reporte', input: tipoSelect })
  );
  toolbar.appendChild(
    field(documentRef, { id: 'reporte-desde', label: 'Desde', input: desdeSelect })
  );
  toolbar.appendChild(
    field(documentRef, { id: 'reporte-hasta', label: 'Hasta', input: hastaSelect })
  );
  let deptoSelect = null;
  if (viewer?.role !== 'jefatura') {
    deptoSelect = select(documentRef, {
      id: 'reporte-departamento',
      options: [
        { value: '', label: 'Todos los departamentos' },
        ...listCatalogos({ tipo: 'departamento' }).map((row) => ({
          value: row.id,
          label: row.nombre
        }))
      ]
    });
    toolbar.appendChild(
      field(documentRef, { id: 'reporte-departamento', label: 'Departamento', input: deptoSelect })
    );
  }
  container.appendChild(toolbar);
  container.appendChild(messages);

  const resultado = el(documentRef, 'section', 'panel rrhh-reporte');
  resultado.id = 'reporte-resultado';
  resultado.setAttribute('aria-live', 'polite');
  container.appendChild(resultado);

  for (const control of [tipoSelect, desdeSelect, hastaSelect, deptoSelect].filter(Boolean)) {
    control.addEventListener('change', () => refresh());
  }

  function renderTabla(reporte) {
    const columnas = [
      'Período',
      reporte.tipo === 'brecha' ? 'Cargo' : 'Grupo',
      ...reporte.columnas.map((col) => col.label)
    ];
    const tabla = crearTabla(documentRef, {
      id: 'reporte-tabla',
      columnas,
      caption: reporte.titulo
    });
    for (const filaReporte of reporte.filas) {
      const valores = reporte.columnas.map((col) => {
        if (filaReporte.oculto && col.key !== 'otros') return null;
        if (col.key === 'otros' && filaReporte.otrosOculto) return 'Oculto (menos de 5)';
        return formatear(filaReporte[col.key], col.formato);
      });
      const tr = agregarFila(documentRef, tabla.tbody, [
        filaReporte.periodoEtiqueta,
        filaReporte.grupo,
        ...valores
      ]);
      if (filaReporte.total) tr.classList.add('rrhh-table-total');
      if (filaReporte.oculto) {
        tr.classList.add('rrhh-table-oculta');
        const nota = tr.children[2];
        if (nota) nota.textContent = filaReporte.mensaje;
      }
    }
    return tabla.element;
  }

  function refresh() {
    hideFeedback(messages);
    resultado.textContent = '';
    if (desdeSelect.value && hastaSelect.value && desdeSelect.value > hastaSelect.value) {
      showFeedback(messages, 'El período "Desde" debe ser anterior o igual a "Hasta".', 'error');
      return;
    }
    let reporte;
    try {
      reporte = generarReporte(tipoSelect.value, {
        viewer,
        desde: desdeSelect.value,
        hasta: hastaSelect.value,
        departamentoId: deptoSelect?.value || ''
      });
    } catch (error) {
      showFeedback(messages, error.message, 'error');
      return;
    }
    const heading = el(documentRef, 'h4', null, reporte.titulo);
    resultado.appendChild(heading);
    if (reporte.vacio) {
      const empty = el(documentRef, 'p', 'empty-state', reporte.mensaje);
      empty.id = 'reporte-vacio';
      resultado.appendChild(empty);
      return;
    }
    if (reporte.nota) resultado.appendChild(el(documentRef, 'p', 'panel-copy', reporte.nota));
    resultado.appendChild(renderTabla(reporte));
    const graficoHost = el(documentRef, 'div', 'rrhh-reporte-grafico');
    resultado.appendChild(graficoHost);
    if (reporte.grafico.length > 0) {
      const columna = reporte.columnas[0];
      renderGraficoReporte(graficoHost, {
        doc: documentRef,
        titulo: `Gráfico: ${reporte.titulo}`,
        datos: reporte.grafico.map((row) => ({
          etiqueta: row.etiqueta,
          valor: row.valor,
          texto: formatear(row.valor, reporte.tipo === 'brecha' ? 'porcentaje' : columna?.formato)
        }))
      });
    } else {
      graficoHost.appendChild(
        el(
          documentRef,
          'p',
          'rrhh-empty',
          'No hay cifras visibles para graficar: los grupos son demasiado pequeños.'
        )
      );
    }
  }

  refresh();
  root.appendChild(container);
  return {
    refresh,
    dispose() {
      root.textContent = '';
    }
  };
}
