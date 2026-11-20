/**
 * RRHH router entry point.
 *
 * The base shell owns a single `view-rrhh` section, so the "router" is the
 * workspace tab controller. Keeping this module as the public entry point lets
 * the host app import a single symbol while tabs stay lazily rendered.
 */

import { renderRrhhWorkspace } from './workspace.js';

export { RRHH_TABS, RrhhWorkspace, renderRrhhWorkspace } from './workspace.js';

export const RRHH_ROUTES = {
  resumen: 'Resumen',
  trabajadores: 'Trabajadores',
  contratos: 'Contratos',
  catalogos: 'Catálogos',
  novedades: 'Asistencia',
  periodos: 'Períodos',
  planilla: 'Planilla',
  liquidaciones: 'Liquidaciones',
  auditoria: 'Auditoría'
};

/** Mount the RRHH workspace and return its controller. */
export function renderRrhhRouter(options = {}) {
  return renderRrhhWorkspace(options);
}
