import { describe, it, expect } from 'vitest';
import { JSDOM } from 'jsdom';
import { createPasswordToggle } from '../../src/rrhh/components/password-toggle.js';

function setup() {
  const dom = new JSDOM(
    `<!DOCTYPE html><body>
      <input id="login-password" type="password" value="abc" />
      <button id="login-password-toggle" type="button"></button>
    </body>`,
    { url: 'http://localhost/' }
  );
  const toggle = createPasswordToggle(dom.window.document);
  return { dom, toggle, input: dom.window.document.getElementById('login-password'), button: dom.window.document.getElementById('login-password-toggle') };
}

describe('Control de visibilidad de contraseña (FR-113)', () => {
  it('muestra y oculta sin alterar el valor y actualiza la etiqueta accesible', () => {
    const { toggle, input, button } = setup();
    expect(input.type).toBe('password');
    expect(button.getAttribute('aria-label')).toBe('Mostrar contraseña');

    button.click();
    expect(input.type).toBe('text');
    expect(input.value).toBe('abc');
    expect(button.getAttribute('aria-label')).toBe('Ocultar contraseña');
    expect(button.getAttribute('aria-pressed')).toBe('true');

    button.click();
    expect(input.type).toBe('password');
    expect(input.value).toBe('abc');
    expect(button.getAttribute('aria-label')).toBe('Mostrar contraseña');
    toggle.dispose();
  });

  it('conserva foco y cursor al alternar y al forzar ocultamiento', () => {
    const { toggle, input, button, dom } = setup();
    input.focus();
    input.setSelectionRange(1, 2);
    button.dispatchEvent(new dom.window.MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    button.click();
    expect(dom.window.document.activeElement).toBe(input);
    expect(input.selectionStart).toBe(1);

    toggle.hide();
    expect(input.type).toBe('password');
    expect(input.value).toBe('abc');
    expect(dom.window.document.activeElement).toBe(input);
    toggle.dispose();
  });
});
