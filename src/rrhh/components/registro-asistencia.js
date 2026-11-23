/** Queryable attendance registry shown at the bottom of the Asistencia tab. */

import {
  asistenciaCsv,
  consultarAsistencia,
  puedeConsultarRegistro,
  registrarExportacionAsistencia,
  totalesAsistencia
} from '../utils/asistencia-registro.js';
import {
  ESTADO_NOVEDAD_LABELS,
  ESTADOS_NOVEDAD,
  TIPO_NOVEDAD_LABELS,
  TIPOS_NOVEDAD
} from '../utils/novedades-data.js';
import { hoyISO } from '../utils/fechas.js';
import { createPagination } from './pagination.js';
import { agregarFila, crearTabla } from './tabla.js';
import {
  badge,
  button,
  el,
  feedback,
  field,
  hideFeedback,
  input,
  select,
  showFeedback,
  statusTone
} from './dom.js';

function numero(value) {
  return Number(value || 0).toLocaleString('es-CL', { maximumFractionDigits: 2 });
}

function descargar(documentRef, nombre, contenido) {
  const view = documentRef.defaultView;
  if (!view?.Blob || !view.URL?.createObjectURL) return false;
  const blob = new view.Blob([contenido], { type: 'text/csv;charset=utf-8' });
  const url = view.URL.createObjectURL(blob);
  const link = documentRef.createElement('a');
  link.href = url;
  link.download = nombre;
  documentRef.body.appendChild(link);
  link.click();
  link.remove();
  view.URL.revokeObjectURL?.(url);
  return true;
}

export function renderRegistroAsistencia(root, { doc, viewer, onExport } = {}) {
  const documentRef = doc || root.ownerDocument;
  if (!puedeConsultarRegistro(viewer)) return { refresh() {}, dispose() {} };

  const section = el(documentRef, 'section', 'panel rrhh-registro-asistencia');
  section.id = 'registro-asistencia';
  section.setAttribute('aria-labelledby', 'registro-asistencia-titulo');
  const title = el(documentRef, 'h4', null, 'Registro de asistencia');
  title.id = 'registro-asistencia-titulo';
  section.appendChild(title);
  section.appendChild(
    el(
      documentRef,
      'p',
      'panel-copy',
      viewer.role === 'jefatura'
        ? 'Historial completo de horas extra, licencias y ausencias de tu equipo, de todos los períodos.'
        : 'Historial completo de horas extra, licencias y ausencias de todos los períodos. Las licencias solo registran tipo y días, sin diagnóstico.'
    )
  );

  const filtros = el(documentRef, 'div', 'rrhh-toolbar rrhh-registro-filtros');
  const texto = input(documentRef, {
    id: 'registro-texto',
    type: 'search',
    placeholder: 'Nombre o RUT'
  });
  const tipo = select(documentRef, {
    id: 'registro-tipo',
    options: [
      { value: '', label: 'Todos los tipos' },
      ...TIPOS_NOVEDAD.map((value) => ({ value, label: TIPO_NOVEDAD_LABELS[value] }))
    ]
  });
  const estado = select(documentRef, {
    id: 'registro-estado',
    options: [
      { value: '', label: 'Todos los estados' },
      ...ESTADOS_NOVEDAD.map((value) => ({ value, label: ESTADO_NOVEDAD_LABELS[value] }))
    ]
  });
  const desde = input(documentRef, { id: 'registro-desde', type: 'date' });
  desde.max = hoyISO();
  const hasta = input(documentRef, { id: 'registro-hasta', type: 'date' });
  filtros.appendChild(field(documentRef, { id: texto.id, label: 'Trabajador', input: texto }));
  filtros.appendChild(field(documentRef, { id: tipo.id, label: 'Tipo', input: tipo }));
  filtros.appendChild(field(documentRef, { id: estado.id, label: 'Estado', input: estado }));
  filtros.appendChild(field(documentRef, { id: desde.id, label: 'Desde', input: desde }));
  filtros.appendChild(field(documentRef, { id: hasta.id, label: 'Hasta', input: hasta }));
  const limpiar = button(documentRef, {
    id: 'registro-limpiar',
    label: 'Limpiar filtros',
    className: 'button button-ghost button-small',
    onClick: () => {
      for (const control of [texto, tipo, estado, desde, hasta]) control.value = '';
      pagination.reset();
      refresh();
    }
  });
  const exportar = button(documentRef, {
    id: 'registro-exportar',
    label: 'Exportar CSV',
    className: 'button button-secondary button-small',
    onClick: () => exportarCsv()
  });
  filtros.appendChild(limpiar);
  filtros.appendChild(exportar);
  section.appendChild(filtros);

  const messages = feedback(documentRef, 'registro-feedback');
  section.appendChild(messages);

  const totales = el(documentRef, 'div', 'rrhh-kpi-row rrhh-registro-totales');
  totales.id = 'registro-totales';
  section.appendChild(totales);

  const tabla = crearTabla(documentRef, {
    id: 'registro-tabla',
    caption: 'Registro de asistencia',
    columnas: ['Trabajador', 'RUT', 'Período', 'Tipo', 'Cantidad', 'Desde', 'Hasta', 'Estado']
  });
  section.appendChild(tabla.element);
  const empty = el(
    documentRef,
    'p',
    'rrhh-empty',
    'No hay registros que coincidan con los filtros.'
  );
  empty.id = 'registro-vacio';
  section.appendChild(empty);
  const pagination = createPagination(documentRef, {
    id: 'registro-pagination',
    onChange: () => renderRows()
  });
  section.appendChild(pagination.element);
  root.appendChild(section);

  let rows = [];

  function consultar() {
    if (desde.value && hasta.value && desde.value > hasta.value) {
      showFeedback(messages, 'La fecha "Desde" debe ser anterior o igual a "Hasta".', 'error');
      return null;
    }
    hideFeedback(messages);
    return consultarAsistencia({
      viewer,
      texto: texto.value,
      tipo: tipo.value,
      estado: estado.value,
      desde: desde.value,
      hasta: hasta.value
    });
  }

  function renderTotales() {
    const t = totalesAsistencia(rows);
    totales.textContent = '';
    const items = [
      ['Registros', numero(t.registros), `${t.trabajadores} trabajador(es)`],
      ['Pendientes', numero(t.pendientes), 'Por aprobar o rechazar'],
      ['Horas extra aprobadas', numero(t.horasExtra), 'horas'],
      ['Licencias aprobadas', numero(t.diasLicencia), 'días'],
      ['Ausencias aprobadas', numero(t.diasAusencia), 'días']
    ];
    for (const [label, value, detail] of items) {
      const tile = el(documentRef, 'div', 'rrhh-kpi');
      tile.appendChild(el(documentRef, 'span', 'rrhh-kpi-label', label));
      tile.appendChild(el(documentRef, 'strong', 'rrhh-kpi-value', value));
      tile.appendChild(el(documentRef, 'span', 'rrhh-kpi-detail', detail));
      totales.appendChild(tile);
    }
  }

  function renderRows() {
    tabla.tbody.textContent = '';
    empty.hidden = rows.length > 0;
    pagination.render(rows.length);
    for (const row of pagination.slice(rows)) {
      agregarFila(
        documentRef,
        tabla.tbody,
        [
          row.trabajador,
          row.rut,
          row.periodo,
          row.tipoEtiqueta,
          `${numero(row.cantidad)} ${row.unidadEtiqueta}`,
          row.fechaInicio,
          row.fechaFin,
          badge(documentRef, row.estadoEtiqueta, statusTone(row.estado))
        ],
        { dataset: { novedadId: row.id } }
      );
    }
  }

  function refresh() {
    const result = consultar();
    if (result === null) return;
    rows = result;
    renderTotales();
    renderRows();
  }

  function exportarCsv() {
    const result = consultar();
    if (result === null) return;
    rows = result;
    const contenido = asistenciaCsv(rows);
    registrarExportacionAsistencia(viewer, rows.length);
    const nombre = `registro_asistencia_${hoyISO()}.csv`;
    onExport?.(nombre, contenido);
    descargar(documentRef, nombre, contenido);
    showFeedback(messages, `Se exportaron ${rows.length} registro(s) a ${nombre}.`, 'ok');
  }

  for (const control of [tipo, estado, desde, hasta]) {
    control.addEventListener('change', () => {
      pagination.reset();
      refresh();
    });
  }
  texto.addEventListener('input', () => {
    pagination.reset();
    refresh();
  });

  refresh();
  return {
    refresh,
    dispose() {
      section.remove();
    }
  };
}
