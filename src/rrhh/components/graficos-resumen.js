/**
 * Dashboard figures for the Resumen tab, rendered as HTML strings.
 *
 * Single-series charts use one hue (the accent) and no legend box: the title
 * names the series. Every mark has a hover/focus tooltip, and every chart has
 * a table view so identity and value never depend on color alone.
 */

export function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatoNumero(valor, formato) {
  if (valor === null || valor === undefined || Number.isNaN(Number(valor))) return '—';
  if (formato === 'dinero') {
    return `$${Math.round(Number(valor)).toLocaleString('es-CL')}`;
  }
  if (formato === 'dias') {
    return `${Number(valor).toLocaleString('es-CL', { maximumFractionDigits: 2 })} días`;
  }
  return Number(valor).toLocaleString('es-CL', { maximumFractionDigits: 1 });
}

/** One headline number with an optional secondary line. */
export function kpiTile({ id, etiqueta, valor, detalle = '', tono = '' }) {
  return `
    <div class="rrhh-kpi${tono ? ` rrhh-kpi-${esc(tono)}` : ''}" id="${esc(id)}">
      <span class="rrhh-kpi-label">${esc(etiqueta)}</span>
      <strong class="rrhh-kpi-value">${esc(valor)}</strong>
      ${detalle ? `<span class="rrhh-kpi-detail">${esc(detalle)}</span>` : ''}
    </div>
  `;
}

function tablaDatos(id, titulo, datos, formato, encabezado) {
  const filas = datos
    .map(
      (row) =>
        `<tr><th scope="row">${esc(row.etiqueta)}</th><td>${esc(formatoNumero(row.valor, formato))}</td></tr>`
    )
    .join('');
  return `
    <details class="rrhh-chart-table">
      <summary>Ver datos en tabla</summary>
      <table class="rrhh-table" id="${esc(id)}-tabla">
        <caption class="sr-only">${esc(titulo)}</caption>
        <thead><tr><th scope="col">${esc(encabezado)}</th><th scope="col">Valor</th></tr></thead>
        <tbody>${filas}</tbody>
      </table>
    </details>
  `;
}

function vacio(mensaje) {
  return `<p class="rrhh-empty">${esc(mensaje)}</p>`;
}

/** Ranked horizontal bars: a name, a bar and a figure per row, largest first. */
export function barrasHorizontales({
  id,
  titulo,
  descripcion,
  datos = [],
  formato,
  encabezado = 'Categoría',
  vacioMensaje = 'Sin datos para mostrar.'
}) {
  const max = Math.max(1, ...datos.map((row) => Number(row.valor) || 0));
  const filas = datos
    .map((row) => {
      const texto = formatoNumero(row.valor, formato);
      const ancho = Math.max(2, Math.round(((Number(row.valor) || 0) / max) * 100));
      return `
        <li class="rrhh-hbar-row">
          <span class="rrhh-hbar-label">${esc(row.etiqueta)}</span>
          <span class="rrhh-hbar-track">
            <span class="rrhh-hbar" style="width:${ancho}%" tabindex="0" role="img"
              aria-label="${esc(`${row.etiqueta}: ${texto}`)}" data-tooltip="${esc(`${row.etiqueta}: ${texto}`)}"></span>
          </span>
          <span class="rrhh-hbar-value">${esc(texto)}</span>
        </li>`;
    })
    .join('');
  return `
    <section class="panel rrhh-chart" id="${esc(id)}" aria-labelledby="${esc(id)}-titulo">
      <h4 id="${esc(id)}-titulo">${esc(titulo)}</h4>
      ${descripcion ? `<p class="panel-copy">${esc(descripcion)}</p>` : ''}
      ${datos.length ? `<ul class="rrhh-hbar-list" role="list">${filas}</ul>${tablaDatos(id, titulo, datos, formato, encabezado)}` : vacio(vacioMensaje)}
    </section>
  `;
}

/**
 * Columns over time. Only the latest column carries a printed figure
 * (selective labelling); the rest are read through the tooltip or the table.
 */
export function columnas({
  id,
  titulo,
  descripcion,
  datos = [],
  formato,
  encabezado = 'Período',
  vacioMensaje = 'Sin datos para mostrar.'
}) {
  const max = Math.max(1, ...datos.map((row) => Number(row.valor) || 0));
  const cols = datos
    .map((row, index) => {
      const texto = formatoNumero(row.valor, formato);
      const alto = Math.max(2, Math.round(((Number(row.valor) || 0) / max) * 100));
      const ultimo = index === datos.length - 1;
      return `
        <li class="rrhh-col">
          <span class="rrhh-col-plot">
            <span class="rrhh-col-bar${ultimo ? ' rrhh-col-bar-current' : ''}" style="height:${alto}%" tabindex="0" role="img"
              aria-label="${esc(`${row.etiqueta}: ${texto}`)}" data-tooltip="${esc(`${row.etiqueta}: ${texto}`)}">${ultimo ? `<span class="rrhh-col-figure" aria-hidden="true">${esc(texto)}</span>` : ''}</span>
          </span>
          <span class="rrhh-col-label">${esc(row.etiqueta)}</span>
        </li>`;
    })
    .join('');
  return `
    <section class="panel rrhh-chart" id="${esc(id)}" aria-labelledby="${esc(id)}-titulo">
      <h4 id="${esc(id)}-titulo">${esc(titulo)}</h4>
      ${descripcion ? `<p class="panel-copy">${esc(descripcion)}</p>` : ''}
      ${datos.length ? `<ol class="rrhh-col-chart" role="list">${cols}</ol>${tablaDatos(id, titulo, datos, formato, encabezado)}` : vacio(vacioMensaje)}
    </section>
  `;
}

/** A single ratio against a limit (e.g. vacation balance against the 30-day cap). */
export function medidor({ id, titulo, valor, maximo, formato, nota = '' }) {
  const porcentaje = Math.max(0, Math.min(100, Math.round(((Number(valor) || 0) / maximo) * 100)));
  const texto = `${formatoNumero(valor, formato)} de ${formatoNumero(maximo, formato)}`;
  return `
    <div class="rrhh-meter" id="${esc(id)}">
      <div class="rrhh-meter-head"><span>${esc(titulo)}</span><strong>${esc(texto)}</strong></div>
      <div class="rrhh-meter-track" role="meter" aria-valuemin="0" aria-valuemax="${esc(maximo)}" aria-valuenow="${esc(valor)}" aria-label="${esc(`${titulo}: ${texto}`)}">
        <span class="rrhh-meter-fill" style="width:${porcentaje}%"></span>
      </div>
      ${nota ? `<p class="field-help">${esc(nota)}</p>` : ''}
    </div>
  `;
}
