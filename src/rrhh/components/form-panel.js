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
  let baseline = '';

  function formSnapshot() {
    return [...content.querySelectorAll('form')]
      .map((form) =>
        [...form.querySelectorAll('input, select, textarea')]
          .filter((field) => !field.disabled && field.type !== 'hidden')
          .map((field) => {
            const key = field.name || field.id || field.type;
            const value =
              field.type === 'checkbox' || field.type === 'radio'
                ? field.checked
                  ? String(field.value || 'on')
                  : ''
                : String(field.value || '');
            return `${key}:${field.type}:${value.trim()}`;
          })
          .join('&')
      )
      .join('|');
  }

  function hasUnsavedChanges() {
    return dirty && formSnapshot() !== baseline;
  }

  function focusableElements() {
    return [
      ...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]')
    ].filter(
      (node) =>
        !node.disabled &&
        !node.hidden &&
        node.type !== 'hidden' &&
        node.getAttribute('tabindex') !== '-1' &&
        node.getAttribute('aria-hidden') !== 'true' &&
        !node.closest('[hidden]')
    );
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
    baseline = formSnapshot();
    lastFocused?.focus?.();
    onClose?.();
    return true;
  }

  function open() {
    lastFocused = documentRef.activeElement;
    baseline = formSnapshot();
    dirty = false;
    overlay.hidden = false;
    closeButton.focus?.();
  }

  function markSaved() {
    dirty = false;
    baseline = formSnapshot();
  }

  closeButton.addEventListener('click', () => close());
  overlay.addEventListener('mousedown', (event) => {
    if (event.target === overlay) close();
  });
  overlay.addEventListener('input', () => {
    if (formSnapshot() !== baseline) dirty = true;
  });
  overlay.addEventListener('change', () => {
    if (formSnapshot() !== baseline) dirty = true;
  });
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusables = focusableElements();
    if (focusables.length === 0) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!panel.contains(documentRef.activeElement)) {
      event.preventDefault();
      first.focus?.();
    } else if (event.shiftKey && documentRef.activeElement === first) {
      event.preventDefault();
      last.focus?.();
    } else if (!event.shiftKey && documentRef.activeElement === last) {
      event.preventDefault();
      first.focus?.();
    }
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
