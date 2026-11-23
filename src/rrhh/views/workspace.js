/**
 * RRHH / Planilla workspace.
 *
 * The base ERP shell owns a single `view-rrhh` section with a tablist. This
 * module renders the requested tab lazily and disposes the previous controller
 * so listeners and print handlers do not leak between navigations.
 */

import { renderResumenView } from './resumen-view.js';
import { renderTrabajadoresView } from './trabajadores-view.js';
import { renderContratosView } from './contratos-view.js';
import { renderCatalogosView } from './catalogos-view.js';
import { renderNovedadesView } from './novedades.js';
import { renderPeriodosView } from './periodos.js';
import { renderPlanillaView } from './planilla.js';
import { renderLiquidacionesView } from './liquidaciones.js';
import { renderAuditoriaView } from './auditoria.js';
import { renderVacacionesView } from './vacaciones.js';
import { renderCargasView } from './cargas.js';
import { renderReportesView } from './reportes.js';

export const RRHH_TABS = [
  'resumen',
  'trabajadores',
  'contratos',
  'catalogos',
  'novedades',
  'periodos',
  'planilla',
  'liquidaciones',
  'vacaciones',
  'cargas',
  'reportes',
  'auditoria'
];

const RENDERERS = {
  resumen: (panel, context) => {
    panel.innerHTML = renderResumenView({ viewer: context.viewer });
    return null;
  },
  trabajadores: renderTrabajadoresView,
  contratos: renderContratosView,
  catalogos: renderCatalogosView,
  novedades: renderNovedadesView,
  periodos: renderPeriodosView,
  planilla: renderPlanillaView,
  liquidaciones: renderLiquidacionesView,
  vacaciones: renderVacacionesView,
  cargas: renderCargasView,
  reportes: renderReportesView,
  auditoria: renderAuditoriaView
};

export class RrhhWorkspace {
  constructor({ doc, config, viewer, initialTab, onRoleRequired, onLiquidationView } = {}) {
    this.doc = doc || (typeof document !== 'undefined' ? document : null);
    this.config = config || {};
    this.viewer = viewer || { role: '' };
    this.onRoleRequired = onRoleRequired || (() => {});
    this.onLiquidationView = onLiquidationView || (() => {});
    this.controllers = new Map();
    this.activeTab = null;

    this.allTabs = [...(this.doc?.querySelectorAll?.('[data-rrhh-tab]') || [])];
    this.tabs = this.filterTabsByRole(this.allTabs);
    for (const t of this.allTabs) {
      const allowed = this.tabs.includes(t);
      t.hidden = !allowed;
    }
    this.panels = new Map();
    for (const tab of this.tabs) {
      const name = tab.dataset.rrhhTab;
      const panel = this.doc.getElementById(`rrhh-panel-${name}`);
      if (!panel) continue;
      if (!panel.id) panel.id = `rrhh-panel-${name}`;
      if (!tab.id) tab.id = `rrhh-tab-${name}`;
      tab.setAttribute('aria-controls', panel.id);
      panel.setAttribute('aria-labelledby', tab.id);
      this.panels.set(name, panel);
    }
    // hide panels not allowed
    for (const t of this.allTabs) {
      const name = t.dataset.rrhhTab;
      const panel = this.doc.getElementById(`rrhh-panel-${name}`);
      if (panel && !this.panels.has(name)) panel.hidden = true;
    }
    this.bind();
    const start =
      RRHH_TABS.includes(initialTab) && this.panels.has(initialTab)
        ? initialTab
        : this.defaultTab();
    if (start) this.show(start);
  }

  filterTabsByRole(tabs) {
    const role = this.viewer?.role || '';
    const allowed = [];
    if (role === 'trabajador') {
      return tabs.filter((tab) =>
        ['resumen', 'liquidaciones', 'vacaciones', 'cargas'].includes(tab.dataset.rrhhTab)
      );
    }
    for (const tab of tabs) {
      const name = tab.dataset.rrhhTab;
      if (!name) continue;
      if (name === 'resumen') {
        allowed.push(tab);
        continue;
      }
      if (name === 'auditoria') {
        if (role === 'administrador') allowed.push(tab);
        continue;
      }
      if (name === 'cargas') {
        // Third-party personal data: the jefatura has no access (US8).
        if (role === 'administrador' || role === 'analista') allowed.push(tab);
        continue;
      }
      if (name === 'vacaciones' || name === 'reportes') {
        if (['administrador', 'analista', 'jefatura'].includes(role)) allowed.push(tab);
        continue;
      }
      if (name === 'periodos' || name === 'planilla') {
        if (role === 'administrador' || role === 'analista') allowed.push(tab);
        continue;
      }
      if (name === 'liquidaciones') {
        if (role === 'administrador' || role === 'analista' || role === 'trabajador') {
          allowed.push(tab);
        }
        continue;
      }
      // trabajadores, contratos, catalogos, novedades: admin/analista/jefatura can see some; be permissive but views enforce
      if (role === 'administrador' || role === 'analista' || role === 'jefatura') allowed.push(tab);
    }
    return allowed;
  }

  defaultTab() {
    const selected = this.tabs.find((tab) => tab.getAttribute('aria-selected') === 'true');
    if (selected && this.panels.has(selected.dataset.rrhhTab)) {
      return selected.dataset.rrhhTab;
    }
    if (this.viewer?.role === 'trabajador' && this.panels.has('resumen')) return 'resumen';
    return this.panels.has('liquidaciones')
      ? 'liquidaciones'
      : RRHH_TABS.find((name) => this.panels.has(name));
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
    const payload = this.pendingPayload;
    this.pendingPayload = null;
    const controller = renderer(panel, {
      doc: this.doc,
      config: this.config,
      viewer: this.viewer,
      initialPeriodo: name === 'liquidaciones' ? payload?.periodo : undefined,
      payload,
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
