/**
 * Right-hand drawer used by RR.HH. screens with creation/edit forms.
 *
 * The form itself is supplied by the caller; this component only controls
 * visibility, labelling and the close/cancel affordance.
 */

export function createFormPanel(
  doc,
  { id = 'rrhh-form-drawer', title = 'Formulario', onClose } = {}
) {
  const documentRef = doc || (typeof document !== 'undefined' ? document : null);
  const overlay = documentRef.createElement('div');
  overlay.id = id;
  overlay.className = 'rrhh-drawer';
  overlay.hidden = true;

  const panel = documentRef.createElement('section');
  panel.className = 'rrhh-drawer-panel';
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-modal', 'true');
  panel.setAttribute('aria-label', title);

  const header = documentRef.createElement('div');
  header.className = 'rrhh-drawer-header';
  const heading = documentRef.createElement('h4');
  heading.textContent = title;
  heading.id = `${id}-title`;
  panel.setAttribute('aria-labelledby', heading.id);
  const closeButton = documentRef.createElement('button');
  closeButton.type = 'button';
  closeButton.className = 'button button-ghost button-small';
  closeButton.setAttribute('aria-label', `Cerrar ${title}`);
  closeButton.textContent = '✕';
  header.appendChild(heading);
  header.appendChild(closeButton);
  panel.appendChild(header);

  const content = documentRef.createElement('div');
  content.className = 'rrhh-drawer-content';
  panel.appendChild(content);
  overlay.appendChild(panel);

  let lastFocused = null;
  let dirty = false;

  function hasUnsavedChanges() {
    if (!dirty) return false;
    const forms = content.querySelectorAll('form');
    return [...forms].some((form) => {
      const values = new FormData(form);
      for (const [_key, value] of values.entries()) {
        if (String(value || '').trim() !== '') return true;
      }
      return false;
    });
  }

  function close({ force = false } = {}) {
    if (!force && hasUnsavedChanges()) {
      const win = documentRef.defaultView;
      if (
        win &&
        typeof win.confirm === 'function' &&
        !win.confirm('Descartar los cambios sin guardar?')
      ) {
        return false;
      }
    }
    overlay.hidden = true;
    dirty = false;
    lastFocused?.focus?.();
    onClose?.();
    return true;
  }

  function open() {
    lastFocused = documentRef.activeElement;
    overlay.hidden = false;
    closeButton.focus?.();
  }

  function markSaved() {
    dirty = false;
  }

  closeButton.addEventListener('click', () => close());
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener('input', () => {
    dirty = true;
  });
  overlay.addEventListener('change', () => {
    dirty = true;
  });
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });

  return {
    element: overlay,
    content,
    open,
    close,
    markSaved,
    setTitle(text) {
      heading.textContent = text;
    },
    dispose() {
      overlay.remove();
    }
  };
}
