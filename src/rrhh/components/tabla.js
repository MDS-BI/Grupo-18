/** Minimal accessible table builder shared by the US7/US8/US10 views. */

import { el } from './dom.js';

export function crearTabla(doc, { id, columnas = [], caption } = {}) {
  const wrapper = el(doc, 'div', 'rrhh-table-wrap');
  const table = el(doc, 'table', 'rrhh-table');
  if (id) table.id = id;
  if (caption) {
    const cap = el(doc, 'caption', 'sr-only', caption);
    table.appendChild(cap);
  }
  const thead = el(doc, 'thead');
  const row = el(doc, 'tr');
  for (const label of columnas) {
    const th = el(doc, 'th', null, label);
    th.scope = 'col';
    row.appendChild(th);
  }
  thead.appendChild(row);
  table.appendChild(thead);
  const tbody = el(doc, 'tbody');
  table.appendChild(tbody);
  wrapper.appendChild(table);
  return { element: wrapper, table, tbody };
}

/** Append a row; cells are strings, numbers or DOM nodes. */
export function agregarFila(doc, tbody, celdas = [], { dataset = {} } = {}) {
  const tr = el(doc, 'tr');
  for (const [key, value] of Object.entries(dataset)) tr.dataset[key] = value;
  for (const celda of celdas) {
    const td = el(doc, 'td');
    if (celda && typeof celda === 'object' && 'nodeType' in celda) td.appendChild(celda);
    else {
      td.textContent = celda === null || celda === undefined || celda === '' ? '—' : String(celda);
    }
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
  return tr;
}
