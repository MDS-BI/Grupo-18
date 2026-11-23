import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

describe('Selección de Trabajador representada extendida al centro (US6/FR-110)', () => {
  it('la pantalla de representado usa un formulario ancho y centrado sin tope estrecho', () => {
    const html = readFileSync(`${rootDir}index.html`, 'utf8');
    const dom = new JSDOM(html);
    const form = dom.window.document.getElementById('rep-form');
    expect(form).not.toBeNull();
    expect(form.tagName).toBe('FORM');
    expect(form.classList.contains('rrhh-representado-form')).toBe(true);
    expect(form.style.maxWidth).toBe('');
    dom.window.close();

    const css = readFileSync(`${rootDir}src/styles.css`, 'utf8');
    const rule = css.match(/(?:^|\})\s*\.rrhh-representado-form\s*\{([^}]*)\}/m);
    expect(rule).not.toBeNull();
    const declarations = rule[1]
      .split(';')
      .map((declaration) => declaration.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    expect(declarations).toContain('width: 100%');
    expect(declarations).toContain('max-width: none');
  });
});
