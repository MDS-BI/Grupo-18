/**
 * Password visibility control for the demo login.
 *
 * The button lives next to the password field and keeps the input focused and
 * the caret position intact when the value is shown or hidden.
 */

const SHOWN_LABEL = 'Ocultar contraseña';
const HIDDEN_LABEL = 'Mostrar contraseña';

export function createPasswordToggle(doc, { inputId = 'login-password', buttonId = 'login-password-toggle' } = {}) {
  const documentRef = doc || (typeof document !== 'undefined' ? document : null);
  const input = documentRef?.getElementById(inputId);
  const button = documentRef?.getElementById(buttonId);
  if (!input || !button) return { hide() {}, isVisible: () => false, dispose() {} };

  input.type = 'password';
  button.type = 'button';
  button.id = buttonId;
  button.classList.add('rrhh-password-toggle');

  function syncLabel() {
    const visible = input.type === 'text';
    const label = visible ? SHOWN_LABEL : HIDDEN_LABEL;
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(visible));
    button.title = label;
    button.textContent = visible ? '🙈' : '👁';
  }

  function toggle() {
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const hadFocus = documentRef.activeElement === input;
    input.type = input.type === 'password' ? 'text' : 'password';
    syncLabel();
    if (hadFocus) {
      input.focus();
      try {
        input.setSelectionRange(selectionStart, selectionEnd);
      } catch {
        // Some input types do not expose selection; ignoring is safe here.
      }
    }
  }

  function hide() {
    if (input.type === 'password') return;
    const selectionStart = input.selectionStart;
    const selectionEnd = input.selectionEnd;
    const hadFocus = documentRef.activeElement === input;
    input.type = 'password';
    syncLabel();
    if (hadFocus) {
      input.focus();
      try {
        input.setSelectionRange(selectionStart, selectionEnd);
      } catch {
        // Ignore unsupported selection APIs.
      }
    }
  }

  function onPointerDown(event) {
    event.preventDefault();
  }

  button.addEventListener('mousedown', onPointerDown);
  button.addEventListener('click', toggle);
  syncLabel();

  return {
    hide,
    isVisible: () => input.type === 'text',
    dispose() {
      button.removeEventListener('mousedown', onPointerDown);
      button.removeEventListener('click', toggle);
    }
  };
}
