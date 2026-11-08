/** Role/session switcher used to simulate the different RRHH profiles. */

import { availableRoles, getSession, setRole } from '../seguridad/session.js';
import { el } from './dom.js';

/**
 * Render (or bind) a role selector.
 *
 * When an existing `<select>` is provided it is reused so the shell keeps its
 * single source of truth; otherwise a new picker is appended to `root`.
 */
export function renderRolSwitcher(root, { doc, select, onChange } = {}) {
  const documentRef = doc || root?.ownerDocument || (typeof document !== 'undefined' ? document : null);
  if (!documentRef) return null;

  const node = select || el(documentRef, 'select', 'role-select');
  node.id = node.id || 'rrhh-role-select';
  node.setAttribute('aria-label', 'Rol simulado');

  const session = getSession();
  const current = session.rol;
  node.textContent = '';
  for (const role of availableRoles()) {
    const option = el(documentRef, 'option', null, role.label);
    option.value = role.value;
    if (role.value === current) option.selected = true;
    node.appendChild(option);
  }

  const handleChange = () => {
    const next = setRole(node.value);
    onChange?.(next);
  };
  node.addEventListener('change', handleChange);

  if (!select && root) root.appendChild(node);

  return {
    element: node,
    value() {
      return node.value;
    },
    dispose() {
      node.removeEventListener('change', handleChange);
    }
  };
}
