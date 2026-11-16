/** Employer-cost summary for Accounting, Finance and Management Control. */

function round(value) {
  return Math.round(Number(value) || 0) || 0;
}

export function centroCostoDe(liquidacion) {
  return (
    liquidacion?.trabajador?.centroCosto ||
    liquidacion?.centroCosto ||
    liquidacion?.trabajador?.departamentoCentroCosto ||
    'SIN_CENTRO'
  );
}

export function haberesDe(liquidacion) {
  if (liquidacion?.totales?.haberes !== undefined) return round(liquidacion.totales.haberes);
  return (liquidacion?.lineas || [])
    .filter((line) => line.tipo === 'haber' && !line.excluirDeTotales)
    .reduce((total, line) => total + round(line.monto), 0);
}

export function aportesDe(liquidacion) {
  if (Array.isArray(liquidacion?.aportesEmpleador)) {
    return liquidacion.aportesEmpleador.reduce((total, row) => total + round(row.monto), 0);
  }
  if (liquidacion?.totalAportesEmpleador !== undefined) {
    return round(liquidacion.totalAportesEmpleador);
  }
  return 0;
}

export function costoEmpleadorDe(liquidacion) {
  if (liquidacion?.costoEmpleador !== undefined) return round(liquidacion.costoEmpleador);
  return haberesDe(liquidacion) + aportesDe(liquidacion);
}

/**
 * Aggregate employer cost. Only totals and cost-center groups are exposed:
 * this contract is safe to consume from modules that must not see salaries.
 */
export function resumenCostoEmpleador(liquidaciones = []) {
  const groups = new Map();
  let totalCosto = 0;
  let totalHaberes = 0;
  let totalAportes = 0;

  for (const liquidacion of liquidaciones) {
    if (liquidacion?.estado === 'anulada') continue;
    const centroCosto = centroCostoDe(liquidacion);
    const haberes = haberesDe(liquidacion);
    const aportes = aportesDe(liquidacion);
    const costo = costoEmpleadorDe(liquidacion);
    totalCosto += costo;
    totalHaberes += haberes;
    totalAportes += aportes;

    const current = groups.get(centroCosto) || {
      centroCosto,
      trabajadores: 0,
      haberes: 0,
      aportes: 0,
      costo: 0
    };
    current.trabajadores += 1;
    current.haberes += haberes;
    current.aportes += aportes;
    current.costo += costo;
    groups.set(centroCosto, current);
  }

  return {
    cantidadLiquidaciones: liquidaciones.filter((row) => row?.estado !== 'anulada').length,
    totalCosto: round(totalCosto),
    totalHaberes: round(totalHaberes),
    totalAportes: round(totalAportes),
    porCentroCosto: [...groups.values()]
      .map((group) => ({
        ...group,
        haberes: round(group.haberes),
        aportes: round(group.aportes),
        costo: round(group.costo)
      }))
      .sort((a, b) => a.centroCosto.localeCompare(b.centroCosto))
  };
}
