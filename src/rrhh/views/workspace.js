/**
 * RRHH / Planilla workspace.
 *
 * The base ERP shell owns a single `view-rrhh` section with a tablist. This
 * module renders the requested tab lazily and disposes the previous controller
 * so listeners and print handlers do not leak between navigations.
 */

import { renderNovedadesView } from './novedades.js';
import { renderPeriodosView } from './periodos.js';
import { renderPlanillaView } from './planilla.js';
import { renderLiquidacionesView } from './liquidaciones.js';
import { renderAuditoriaView } from './auditoria.js';

export const RRHH_TABS = ['novedades', 'periodos', 'planilla', 'liquidaciones', 'auditoria'];

const RENDERERS = {
  novedades: renderNovedadesView,
  periodos: renderPeriodosView,
  planilla: renderPlanillaView,
  liquidaciones: renderLiquidacionesView,
  auditoria: renderAuditoriaView
};

export class RrhhWorkspace {
  constructor({ doc, config, viewer, initialTab, onRoleRequired, onLiquidationView } = {}) {
    this.doc = doc || (typeof document !== 'undefined' ? document : null);
    this.config = config || {};
    this.viewer = viewer || { role: 'analista' };
    this.onRoleRequired = onRoleRequired || (() => {});
    this.onLiquidationView = onLiquidationView || (() => {});
    this.controllers = new Map();
    this.activeTab = null;

    this.tabs = [...(this.doc?.querySelectorAll?.('[data-rrhh-tab]') || [])];
    this.panels = new Map();
    for (const tab of this.tabs) {
      const name = tab.dataset.rrhhTab;
      const panel = this.doc.getElementById(`rrhh-panel-${name}`);
      if (panel) this.panels.set(name, panel);
    }
    this.bind();
    this.show(RRHH_TABS.includes(initialTab) ? initialTab : this.defaultTab());
  }

  defaultTab() {
    const selected = this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
    if (selected && this.panels.has(selected.dataset.rrhhTab)) {
      return selected.dataset.rrhhTab;
    }
    return this.panels.has('liquidaciones') ? 'liquidaciones' : RRHH_TABS.find((name) => this.panels.has(name));
  }

  bind() {
    for (const tab of this.tabs) {
      tab.addEventListener('click', () => this.show(tab.dataset.rrhhTab));
      tab.addEventListener('keydown', (event) => this.onTabKeyDown(event, tab));
    }
  }

  onTabKeyDown(event, tab) {
    const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const index = this.tabs.indexOf(tab);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % this.tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + this.tabs.length) % this.tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = this.tabs.length - 1;
    const target = this.tabs[next];
    target.focus?.();
    this.show(target.dataset.rrhhTab);
  }

  setSelected(name) {
    for (const tab of this.tabs) {
      const selected = tab.dataset.rrhhTab === name;
      tab.setAttribute('aria-selected', selected ? 'true' : 'false');
      tab.tabIndex = selected ? 0 : -1;
    }
    for (const [tabName, panel] of this.panels) {
      panel.hidden = tabName !== name;
    }
  }

  show(name) {
    if (!name || !this.panels.has(name)) return;
    if (this.activeTab === name) {
      this.renderTab(name);
      return;
    }
    this.disposeTab(this.activeTab);
    this.activeTab = name;
    this.setSelected(name);
    this.renderTab(name);
  }

  renderTab(name) {
    const panel = this.panels.get(name);
    const renderer = RENDERERS[name];
    if (!panel || !renderer) return;
    this.disposeTabController(name);
    panel.textContent = '';
    const controller = renderer(panel, {
      doc: this.doc,
      config: this.config,
      viewer: this.viewer,
      onRoleRequired: this.onRoleRequired,
      onLiquidationView: this.onLiquidationView,
      onNavigate: (tab, payload) => {
        const target = this.panels.has(tab) ? tab : name;
        this.pendingPayload = payload || null;
        this.show(target);
      }
    });
    this.controllers.set(name, controller || null);
  }

  disposeTabController(name) {
    const controller = this.controllers.get(name);
    if (controller?.dispose) controller.dispose();
    this.controllers.delete(name);
  }

  disposeTab(name) {
    if (!name) return;
    this.disposeTabController(name);
  }

  dispose() {
    for (const name of [...this.controllers.keys()]) this.disposeTabController(name);
    this.controllers.clear();
  }
}

/** Render the RRHH workspace into the existing shell markup. */
export function renderRrhhWorkspace(options = {}) {
  const workspace = new RrhhWorkspace(options);
  return {
    get activeTab() {
      return workspace.activeTab;
    },
    show(tab) {
      workspace.show(tab);
    },
    dispose() {
      workspace.dispose();
    }
  };
}
