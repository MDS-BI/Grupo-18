/** Wire the search input to a render callback. */
export function bindSearch(input, onSearch) {
  if (!input) return;
  input.addEventListener('input', () => onSearch(input.value));
  input.addEventListener('search', () => onSearch(input.value));
}
