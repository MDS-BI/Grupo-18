import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('../../', import.meta.url));

describe('Selección de Trabajador representada extendida al centro (US6/FR-110)', () => {
  it('la pantalla de representado usa un formulario ancho y centrado sin tope estrecho', () => {
    const html = readFileSync(`${rootDir}index.html`, 'utf8');
    const formTag = html.match(/<form id="rep-form"[^>]*>/)?.[0] || '';
    expect(formTag).toContain('rrhh-representado-form');
    expect(formTag).not.toContain('max-width: 520px');

    const css = readFileSync(`${rootDir}src/styles.css`, 'utf8');
    expect(css).toMatch(/\.rrhh-representado-form\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/s);
  });
});
