import {
  TIPO_LABELS,
  formatDate,
  formatMoney,
  lineExplanation,
  totals
} from '../utils/liquidacion-data.js';
import { canPrintLiquidacion, canViewLiquidacion, canViewLine } from '../seguridad/roles.js';
import { getEmpresa, hasEmpresaData, empresaLines } from '../utils/empresa.js';

const PRINTABLE_STATES = new Set(['calculada', 'aprobada', 'pagada']);
const TYPE_ORDER = ['haber', 'descuento', 'impuesto'];

function el(doc, tag, className, text) {
  const node = doc.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function appendField(doc, parent, label, value) {
  const row = el(doc, 'div', 'liq-detail-row');
  row.appendChild(el(doc, 'dt', null, label));
  row.appendChild(el(doc, 'dd', null, value || '—'));
  parent.appendChild(row);
  return row;
}

/**
 * Controller that owns the clean-print state.
 *
 * The class is toggled on the print root (body) instead of re-rendering the
 * liquidation, so cancelling the browser dialog restores the exact same DOM
 * and the current selection.
 */
export function createPrintController({ root, win, mediaQuery, onPrint } = {}) {
  const targetRoot = root || (typeof document !== 'undefined' ? document.body : null);
  const targetWin = win || (typeof window !== 'undefined' ? window : null);
  let active = false;

  const setActive = (value) => {
    active = Boolean(value);
    if (targetRoot && targetRoot.classList) {
      targetRoot.classList.toggle('print-clean', active);
    }
  };

  const beforePrint = () => setActive(true);
  const afterPrint = () => setActive(false);

  targetWin?.addEventListener?.('beforeprint', beforePrint);
  targetWin?.addEventListener?.('afterprint', afterPrint);

  let mq = mediaQuery;
  if (!mq && typeof targetWin?.matchMedia === 'function') {
    mq = targetWin.matchMedia('print');
  }
  const mediaListener = (event) => setActive(Boolean(event.matches));
  if (mq?.addEventListener) mq.addEventListener('change', mediaListener);

  return {
    beforePrint,
    afterPrint,
    print() {
      setActive(true);
      onPrint?.();
      if (typeof targetWin?.print === 'function') targetWin.print();
    },
    isActive() {
      return active;
    },
    dispose() {
      targetWin?.removeEventListener?.('beforeprint', beforePrint);
      targetWin?.removeEventListener?.('afterprint', afterPrint);
      if (mq?.removeEventListener) mq.removeEventListener('change', mediaListener);
      setActive(false);
    }
  };
}

function resolveEmpresa(liquidacion, options) {
  if (Object.prototype.hasOwnProperty.call(options, 'empresa')) {
    return options.empresa || {};
  }
  if (liquidacion.emisor) return liquidacion.emisor;
  try {
    return getEmpresa();
  } catch {
    return {};
  }
}

function renderAccessDenied(doc, root, liquidacion) {
  root.textContent = '';
  const denied = el(doc, 'div', 'rrhh-access-denied panel');
  denied.setAttribute('role', 'alert');
  denied.appendChild(el(doc, 'h3', null, 'Acceso denegado'));
  denied.appendChild(
    el(
      doc,
      'p',
      null,
      'Tu rol no tiene permiso para consultar esta liquidación. Los datos sensibles no se muestran.'
    )
  );
  if (liquidacion?.numero) {
    denied.appendChild(el(doc, 'p', 'panel-copy', `Liquidación: ${liquidacion.numero}`));
  }
  root.appendChild(denied);
  return {
    selectedId: null,
    dispose() {},
    printController: null
  };
}

class LiquidationView {
  constructor(root, liquidacion, options) {
    this.root = root;
    this.liquidacion = liquidacion;
    this.doc = options.doc || (typeof document !== 'undefined' ? document : null);
    this.win = options.win || (typeof window !== 'undefined' ? window : null);
    this.viewer = options.viewer || { role: 'analista_rrhh' };
    this.empresa = resolveEmpresa(liquidacion, options);
    this.selectedId = null;
    this.rows = [];
    this.printController = null;
    this.build();
  }

  build() {
    const doc = this.doc;
    const root = this.root;
    root.textContent = '';

    const container = el(doc, 'article', 'rrhh-liquidacion panel');
    container.setAttribute('aria-labelledby', 'liq-heading');

    container.appendChild(this.buildHeader());
    const warning = this.buildIssuerWarning();
    if (warning) container.appendChild(warning);
    container.appendChild(this.buildLines());
    container.appendChild(this.buildTotals());
    container.appendChild(this.buildExplanation());
    container.appendChild(this.buildActions());
    container.appendChild(this.buildSignature());

    root.appendChild(container);
  }

  buildHeader() {
    const doc = this.doc;
    const liq = this.liquidacion;
    const header = el(doc, 'header', 'liq-header');
    header.appendChild(el(doc, 'p', 'eyebrow', 'Comprobante de remuneración'));
    header.appendChild(
      el(doc, 'h2', 'liq-title', `Liquidación ${liq.numero || liq.id || ''}`.trim())
    );

    const meta = el(doc, 'div', 'liq-meta');
    const worker = el(doc, 'div', 'liq-meta-block');
    worker.appendChild(el(doc, 'h3', null, 'Trabajador'));
    worker.appendChild(
      el(doc, 'p', 'liq-worker-name', liq.trabajador?.nombre || 'Trabajador sin identificar')
    );
    if (liq.trabajador?.rut) worker.appendChild(el(doc, 'p', null, `RUT ${liq.trabajador.rut}`));
    if (liq.trabajador?.cargo) worker.appendChild(el(doc, 'p', null, liq.trabajador.cargo));
    if (liq.trabajador?.departamento) {
      worker.appendChild(el(doc, 'p', null, liq.trabajador.departamento));
    }
    meta.appendChild(worker);

    const period = el(doc, 'div', 'liq-meta-block');
    period.appendChild(el(doc, 'h3', null, 'Período'));
    period.appendChild(el(doc, 'p', null, liq.periodo?.etiqueta || 'Período sin definir'));
    if (liq.periodo?.fechaInicio && liq.periodo?.fechaFin) {
      period.appendChild(
        el(
          doc,
          'p',
          null,
          `${formatDate(liq.periodo.fechaInicio)} — ${formatDate(liq.periodo.fechaFin)}`
        )
      );
    }
    period.appendChild(
      el(doc, 'p', 'liq-state', `Estado: ${liq.estado || 'sin estado'}`)
    );
    meta.appendChild(period);

    const issuer = el(doc, 'div', 'liq-meta-block');
    issuer.appendChild(el(doc, 'h3', null, 'Emisor'));
    const lines = empresaLines(this.empresa);
    if (lines.length > 0) {
      for (const line of lines) issuer.appendChild(el(doc, 'p', null, line));
    } else {
      issuer.appendChild(el(doc, 'p', 'panel-copy', 'Emisor no configurado'));
    }
    meta.appendChild(issuer);

    header.appendChild(meta);
    header.appendChild(
      el(
        doc,
        'p',
        'liq-issue-date',
        `Fecha de emisión: ${formatDate(liq.fechaEmision)}`
      )
    );
    return header;
  }

  buildIssuerWarning() {
    if (hasEmpresaData(this.empresa)) return null;
    return el(
      this.doc,
      'p',
      'liq-warning',
      'Emisor no configurado: completa los datos de la empresa para emitir un comprobante válido.'
    );
  }

  buildLines() {
    const doc = this.doc;
    const section = el(doc, 'section', 'liq-section');
    section.appendChild(el(doc, 'h3', null, 'Detalle de la liquidación'));

    const visible = (this.liquidacion.lineas || []).filter((line) =>
      canViewLine(line, this.viewer)
    );

    for (const tipo of TYPE_ORDER) {
      const lines = visible.filter((line) => line.tipo === tipo);
      if (lines.length === 0) continue;
      const group = el(doc, 'div', 'liq-group');
      group.dataset.tipo = tipo;
      group.appendChild(el(doc, 'h4', null, TIPO_LABELS[tipo] || tipo));
      const list = el(doc, 'div', 'liq-lines');
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-label', `${TIPO_LABELS[tipo] || tipo} de la liquidación`);
      for (const line of lines) list.appendChild(this.buildRow(line, lines));
      group.appendChild(list);
      section.appendChild(group);
    }

    if (visible.length === 0) {
      section.appendChild(
        el(doc, 'p', 'liq-warning', 'No hay líneas autorizadas para mostrar en esta liquidación.')
      );
    }
    return section;
  }

  buildRow(line, groupLines) {
    const doc = this.doc;
    const row = el(doc, 'div', 'liq-line');
    row.dataset.lineId = line.id;
    row.setAttribute('role', 'option');
    row.setAttribute('aria-selected', 'false');
    row.tabIndex = this.rows.length === 0 ? 0 : -1;
    row.appendChild(el(doc, 'span', 'liq-line-concept', line.concepto || 'Concepto'));
    row.appendChild(el(doc, 'span', 'liq-line-type', TIPO_LABELS[line.tipo] || line.tipo || ''));
    row.appendChild(el(doc, 'span', 'liq-line-amount', formatMoney(line.monto)));

    row.addEventListener('click', () => this.select(line.id));
    row.addEventListener('keydown', (event) => this.onKeyDown(event, line.id, groupLines));

    this.rows.push({ id: line.id, node: row, groupLines });
    return row;
  }

  onKeyDown(event, lineId, groupLines) {
    const current = groupLines.findIndex((line) => line.id === lineId);
    if (current === -1) return;
    let next;
    if (event.key === 'ArrowDown') next = Math.min(current + 1, groupLines.length - 1);
    else if (event.key === 'ArrowUp') next = Math.max(current - 1, 0);
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = groupLines.length - 1;
    else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.select(lineId);
      return;
    } else {
      return;
    }
    event.preventDefault();
    const nextLine = groupLines[next];
    this.select(nextLine.id);
    const entry = this.rows.find((row) => row.id === nextLine.id);
    entry?.node?.focus?.();
  }

  select(lineId) {
    this.selectedId = lineId;
    for (const entry of this.rows) {
      const selected = entry.id === lineId;
      entry.node.setAttribute('aria-selected', selected ? 'true' : 'false');
      entry.node.tabIndex = selected ? 0 : -1;
    }
    this.renderExplanation();
  }

  buildTotals() {
    const doc = this.doc;
    const expected = this.liquidacion.totales || totals(this.liquidacion);
    const section = el(doc, 'section', 'liq-totals');
    section.setAttribute('aria-label', 'Totales de la liquidación');
    const rows = [
      ['haberes', 'Total haberes', expected.haberes],
      ['descuentos', 'Total descuentos', expected.descuentos],
      ['impuestos', 'Impuesto único', expected.impuestos],
      ['liquido', 'Líquido a pagar', expected.liquido]
    ];
    for (const [key, label, value] of rows) {
      const row = el(doc, 'div', `liq-total liq-total-${key}`);
      row.dataset.total = key;
      row.appendChild(el(doc, 'span', null, label));
      row.appendChild(el(doc, 'strong', null, formatMoney(value)));
      section.appendChild(row);
    }
    return section;
  }

  buildExplanation() {
    const doc = this.doc;
    const panel = el(doc, 'section', 'liq-explanation');
    panel.id = 'liq-explanation';
    panel.setAttribute('role', 'region');
    panel.setAttribute('aria-live', 'polite');
    panel.setAttribute('aria-labelledby', 'liq-explanation-heading');
    panel.appendChild(el(doc, 'h3', null, 'Vista Explicativa'));
    panel.querySelector('h3').id = 'liq-explanation-heading';
    const hint = el(
      doc,
      'p',
      'liq-explanation-hint',
      'Selecciona una línea de la liquidación para ver su base, tasa o factor, fórmula y parámetro legal.'
    );
    panel.appendChild(hint);
    this.explanationBody = el(doc, 'div', 'liq-explanation-body');
    this.explanationBody.hidden = true;
    panel.appendChild(this.explanationBody);
    return panel;
  }

  renderExplanation() {
    if (!this.explanationBody) return;
    const line = (this.liquidacion.lineas || []).find((item) => item.id === this.selectedId);
    const hint = this.explanationBody.parentElement?.querySelector('.liq-explanation-hint');
    if (!line) {
      this.explanationBody.hidden = true;
      if (hint) hint.hidden = false;
      return;
    }
    if (hint) hint.hidden = true;
    const doc = this.doc;
    const explanation = lineExplanation(line, this.liquidacion.periodo);
    this.explanationBody.textContent = '';
    this.explanationBody.hidden = false;

    const heading = el(doc, 'h4', 'liq-explanation-concept', explanation.concepto);
    this.explanationBody.appendChild(heading);

    const details = el(doc, 'dl', 'liq-details');
    appendField(doc, details, 'Base de cálculo', explanation.baseTexto);
    appendField(
      doc,
      details,
      explanation.factor !== null ? 'Factor aplicado' : 'Tasa aplicada',
      explanation.factor !== null ? explanation.factorTexto : explanation.tasaTexto
    );
    if (explanation.manual) {
      appendField(doc, details, 'Motivo registrado', explanation.motivo);
    } else {
      appendField(doc, details, 'Fórmula', explanation.formulaTexto || 'Sin fórmula registrada');
    }
    appendField(doc, details, 'Monto de la línea', explanation.montoTexto);
    if (explanation.parametro) {
      appendField(doc, details, 'Parámetro legal', explanation.parametroTexto);
      appendField(doc, details, 'Vigencia', explanation.vigenciaTexto);
      appendField(doc, details, 'Fuente', explanation.fuente);
      appendField(doc, details, 'Snapshot del período', explanation.congeladoEnPeriodo || 'No registrado');
    }
    this.explanationBody.appendChild(details);

    for (const warning of explanation.advertencias) {
      this.explanationBody.appendChild(el(doc, 'p', 'liq-explanation-warning', warning));
    }
  }

  buildActions() {
    const doc = this.doc;
    const actions = el(doc, 'div', 'liq-actions');
    if (
      PRINTABLE_STATES.has(this.liquidacion.estado) &&
      canPrintLiquidacion(this.liquidacion, this.viewer)
    ) {
      const button = el(doc, 'button', 'button button-primary', 'Imprimir / Guardar en PDF');
      button.type = 'button';
      button.id = 'liq-print';
      button.setAttribute('aria-label', 'Imprimir la liquidación o guardar en PDF');
      this.printController = createPrintController({
        root: doc.body,
        win: this.win
      });
      button.addEventListener('click', () => this.printController.print());
      actions.appendChild(button);
    }
    return actions;
  }

  buildSignature() {
    const doc = this.doc;
    const footer = el(doc, 'footer', 'liq-signature');
    footer.appendChild(el(doc, 'p', null, 'Documento generado por el módulo de RR.HH. y Planilla.'));
    footer.appendChild(
      el(
        doc,
        'p',
        'panel-copy',
        'Los montos impresos coinciden con las líneas y totales de la liquidación calculada.'
      )
    );
    return footer;
  }

  dispose() {
    this.printController?.dispose();
    this.printController = null;
  }
}

/**
 * Render the explanatory liquidation view.
 *
 * @returns {{selectedId: string|null, dispose: Function, printController: object|null}}
 */
export function renderLiquidacion(root, liquidacion, options = {}) {
  const doc = options.doc || (typeof document !== 'undefined' ? document : null);
  if (!root || !doc) return { selectedId: null, dispose() {}, printController: null };
  const viewer = options.viewer || { role: 'analista_rrhh' };
  if (!canViewLiquidacion(liquidacion, viewer)) {
    return renderAccessDenied(doc, root, liquidacion);
  }
  const view = new LiquidationView(root, liquidacion, { ...options, doc, viewer });
  return {
    get selectedId() {
      return view.selectedId;
    },
    printController: view.printController,
    dispose() {
      view.dispose();
    }
  };
}
