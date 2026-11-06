/**
 * Minimal role matrix for the RRHH module. A worker can only see their own
 * liquidation; RRHH analysts and auditors can see every liquidation.
 */
export const ROLE_MATRIX = {
  analista_rrhh: { viewAll: true, viewOwn: false, canPrint: true },
  auditor: { viewAll: true, viewOwn: false, canPrint: true },
  trabajador: { viewAll: false, viewOwn: true, canPrint: true }
};

export function canViewLiquidacion(liquidacion, viewer = { role: 'analista_rrhh' }) {
  const permissions = ROLE_MATRIX[viewer.role];
  if (!permissions) return false;
  if (permissions.viewAll) return true;
  return Boolean(
    permissions.viewOwn &&
      viewer.trabajadorId &&
      liquidacion?.trabajador?.id === viewer.trabajadorId
  );
}

export function canPrintLiquidacion(liquidacion, viewer = { role: 'analista_rrhh' }) {
  if (!canViewLiquidacion(liquidacion, viewer)) return false;
  return ROLE_MATRIX[viewer.role]?.canPrint !== false;
}
