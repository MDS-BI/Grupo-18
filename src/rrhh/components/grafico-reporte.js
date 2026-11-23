/**
 * Accessible bar chart companion for management reports (FR-111).
 * It renders the same figures as the accompanying table.
 */

export function renderGraficoReporte(
  root,
  { doc, titulo = 'Gráfico del reporte', datos = [] } = {}
) {
  const documentRef = doc || root.ownerDocument;
  root.textContent = '';
  const section = documentRef.createElement('section');
  section.className = 'rrhh-grafico-reporte';
  const heading = documentRef.createElement('h4');
  heading.textContent = titulo;
  section.appendChild(heading);
  const description = documentRef.createElement('p');
  description.className = 'panel-copy';
  description.textContent = datos.map((fila) => `${fila.etiqueta}: ${fila.valor}`).join('; ');
  description.id = `grafico-${Math.random().toString(36).slice(2, 9)}`;
  section.appendChild(description);

  const max = Math.max(1, ...datos.map((fila) => Number(fila.valor) || 0));
  for (const fila of datos) {
    const row = documentRef.createElement('div');
    row.className = 'rrhh-grafico-fila';
    const label = documentRef.createElement('span');
    label.textContent = fila.etiqueta;
    const bar = documentRef.createElement('span');
    bar.className = 'rrhh-grafico-barra';
    bar.style.width = `${Math.round(((Number(fila.valor) || 0) / max) * 100)}%`;
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${fila.etiqueta}: ${fila.valor}`);
    const value = documentRef.createElement('strong');
    value.textContent = String(fila.valor);
    row.appendChild(label);
    row.appendChild(bar);
    row.appendChild(value);
    section.appendChild(row);
  }
  root.appendChild(section);
  return { dispose() {} };
}
