/**
 * Role matrix for the RRHH module.
 *
 * The MVP is frontend-only, so access control is simulated through the role
 * selector in the workspace shell. The matrix is still enforced by the views
 * and by the data-access guards, never only by hiding markup.
 */

export const ROLES = {
  administrador: 'Administrador',
  analista: 'Analista',
  jefatura: 'Jefatura',
  gerencia: 'Gerencia',
  auditor: 'Auditor',
  trabajador: 'Trabajador'
};

const BASE_MATRIX = {
  administrador: {
    label: ROLES.administrador,
    viewAll: true,
    viewOwn: false,
    canPrint: true,
    canViewLiquidaciones: true,
    canViewSueldos: true,
    canViewDatosBancarios: true,
    canViewCuotasSindicales: true,
    canRegisterNovedades: true,
    canEditNovedades: true,
    canApproveNovedades: true,
    canClosePeriodos: true,
    canCalculate: true,
    canApproveLiquidaciones: true,
    canPayLiquidaciones: true,
    canAnularLiquidaciones: true,
    canManageRoles: true,
    canViewAuditoria: true
  },
  analista: {
    label: ROLES.analista,
    viewAll: true,
    viewOwn: false,
    canPrint: true,
    canViewLiquidaciones: true,
    canViewSueldos: true,
    canViewDatosBancarios: false,
    canViewCuotasSindicales: false,
    canRegisterNovedades: true,
    canEditNovedades: true,
    canApproveNovedades: false,
    canClosePeriodos: false,
    canCalculate: true,
    canApproveLiquidaciones: false,
    canPayLiquidaciones: false,
    canAnularLiquidaciones: false,
    canManageRoles: false,
    canViewAuditoria: false
  },
  jefatura: {
    label: ROLES.jefatura,
    viewAll: false,
    viewOwn: false,
    canPrint: false,
    canViewLiquidaciones: false,
    canViewSueldos: false,
    canViewDatosBancarios: false,
    canViewCuotasSindicales: false,
    canRegisterNovedades: true,
    canEditNovedades: true,
    canApproveNovedades: true,
    canViewTeamNovedades: true,
    canClosePeriodos: true,
    canCalculate: false,
    canApproveLiquidaciones: false,
    canPayLiquidaciones: false,
    canAnularLiquidaciones: false,
    canManageRoles: false,
    canViewAuditoria: false
  },
  gerencia: {
    label: ROLES.gerencia,
    viewAll: false,
    viewOwn: false,
    canPrint: false,
    canViewLiquidaciones: false,
    canViewSueldos: false,
    canViewDatosBancarios: false,
    canViewCuotasSindicales: false,
    canRegisterNovedades: false,
    canEditNovedades: false,
    canApproveNovedades: false,
    canClosePeriodos: false,
    canCalculate: false,
    canViewAggregates: true,
    canApproveLiquidaciones: true,
    canPayLiquidaciones: true,
    canAnularLiquidaciones: false,
    canManageRoles: false,
    canViewAuditoria: false
  },
  auditor: {
    label: ROLES.auditor,
    viewAll: true,
    viewOwn: false,
    canPrint: true,
    canViewLiquidaciones: true,
    canViewSueldos: true,
    canViewDatosBancarios: false,
    canViewCuotasSindicales: true,
    canRegisterNovedades: false,
    canEditNovedades: false,
    canApproveNovedades: false,
    canClosePeriodos: false,
    canCalculate: false,
    canApproveLiquidaciones: false,
    canPayLiquidaciones: false,
    canAnularLiquidaciones: false,
    canManageRoles: false,
    canViewAuditoria: true
  },
  trabajador: {
    label: ROLES.trabajador,
    viewAll: false,
    viewOwn: true,
    canPrint: true,
    canViewLiquidaciones: true,
    canViewSueldos: true,
    canViewDatosBancarios: true,
    canViewCuotasSindicales: true,
    canRegisterNovedades: false,
    canEditNovedades: false,
    canApproveNovedades: false,
    canClosePeriodos: false,
    canCalculate: false,
    canApproveLiquidaciones: false,
    canPayLiquidaciones: false,
    canAnularLiquidaciones: false,
    canManageRoles: false,
    canViewAuditoria: false
  }
};

// Historical alias used by the liquidation view.
BASE_MATRIX.analista_rrhh = { ...BASE_MATRIX.analista };

export const ROLE_MATRIX = BASE_MATRIX;

export const DEFAULT_ROLE = 'analista';

export const SENSITIVE_DATA = {
  sueldos: 'sueldos',
  liquidaciones: 'liquidaciones',
  cuentas_bancarias: 'cuentas_bancarias',
  cuotas_sindicales: 'cuotas_sindicales'
};

function permissionsFor(role) {
  return ROLE_MATRIX[role] || null;
}

/** Whether a role may see every liquidation or only its own. */
export function canViewLiquidacion(liquidacion, viewer = { role: 'analista_rrhh' }) {
  const permissions = permissionsFor(viewer.role);
  if (!permissions || permissions.canViewLiquidaciones === false) return false;
  if (permissions.viewAll) return true;
  return Boolean(
    permissions.viewOwn &&
      viewer.trabajadorId &&
      liquidacion?.trabajador?.id === viewer.trabajadorId
  );
}

export function canPrintLiquidacion(liquidacion, viewer = { role: 'analista_rrhh' }) {
  if (!canViewLiquidacion(liquidacion, viewer)) return false;
  return permissionsFor(viewer.role)?.canPrint !== false;
}

/** Central permission lookup used by views, services and guards. */
export function can(role, permission) {
  return Boolean(permissionsFor(role)?.[permission]);
}

/**
 * Whether a role can read a sensitive data family. Unknown roles are always
 * denied: an unassigned role must never default to broad access.
 */
export function canAccessSensitive(role, dataType) {
  const permissions = permissionsFor(role);
  if (!permissions) return false;
  if (dataType === SENSITIVE_DATA.sueldos) return Boolean(permissions.canViewSueldos);
  if (dataType === SENSITIVE_DATA.liquidaciones) return Boolean(permissions.canViewLiquidaciones);
  if (dataType === SENSITIVE_DATA.cuentas_bancarias) return Boolean(permissions.canViewDatosBancarios);
  if (dataType === SENSITIVE_DATA.cuotas_sindicales) return Boolean(permissions.canViewCuotasSindicales);
  return false;
}

/** Whether a line carries a concept the role is not allowed to see. */
export function canViewLine(line, viewer = { role: 'analista_rrhh' }) {
  if (!line?.esSensible) return true;
  return canAccessSensitive(viewer.role, line.clasificacion || SENSITIVE_DATA.cuotas_sindicales);
}
