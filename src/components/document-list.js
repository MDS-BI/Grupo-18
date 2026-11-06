/** Fill the document edit selector, keeping a placeholder as the first option. */
export function renderDocumentSelect(select, documents, placeholder = 'Selecciona un documento') {
  const previous = select.value;
  select.textContent = '';
  const empty = document.createElement('option');
  empty.value = '';
  empty.textContent = placeholder;
  select.appendChild(empty);
  for (const documentRecord of documents) {
    const option = document.createElement('option');
    option.value = documentRecord.id;
    const series = documentRecord.series ? `${documentRecord.series}-` : '';
    option.textContent = `${series}${documentRecord.folio}`;
    select.appendChild(option);
  }
  if (previous && documents.some((documentRecord) => documentRecord.id === previous)) {
    select.value = previous;
  }
  return select;
}
