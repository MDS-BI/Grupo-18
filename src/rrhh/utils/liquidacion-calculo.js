import { totals } from './liquidacion-data.js';
import { saveLiquidacion } from './liquidacion-service.js';

/** Current legal parameters used when a liquidation is calculated for the first time. */
export const PARAMETROS_LEGALES = {
  AFP: {
    codigo: 'AFP',
    descripcion: 'Cotización obligatoria AFP',
    fechaVigencia: '2026-01-01',
    valor: 0.105,
    fuente: 'DL 3.500'
  },
  SALUD: {
    codigo: 'SALUD',
    descripcion: 'Cotización de salud',
    fechaVigencia: '2026-01-01',
    valor: 0.07,
    fuente: 'Ley 18.933'
  },
  GRATIFICACION: {
    codigo: 'GRATIFICACION_LEGAL',
    descripcion: 'Gratificación legal',
    fechaVigencia: '2026-01-01',
    valor: 0.25,
    fuente: 'Código del Trabajo, artículo 50'
  },
  IMPUESTO_UNICO: {
    codigo: 'IMPUESTO_UNICO',
    descripcion: 'Impuesto único de segunda categoría',
    fechaVigencia: '2026-01-01',
    valor: 0.025,
    fuente: 'Ley 21.210'
  },
  HORAS_EXTRA: {
    codigo: 'HORAS_EXTRA',
    descripcion: 'Recargo por horas extraordinarias',
    fechaVigencia: '2026-01-01',
    valor: 1.5,
    fuente: 'Código del Trabajo, artículo 32'
  }
};

/** Freeze a legal parameter into the immutable snapshot stored on the line. */
export function congelarParametro(parametro, periodo) {
  if (!parametro) return null;
  return {
    codigo: parametro.codigo,
    descripcion: parametro.descripcion,
    fechaVigencia: parametro.fechaVigencia,
    valorAplicado: parametro.valor ?? parametro.valorAplicado,
    fuente: parametro.fuente,
    congeladoEnPeriodo: periodo?.etiqueta || '',
    congeladoEn: new Date().toISOString()
  };
}

function buildCalculatedLine(line, index, periodo, parametros) {
  const id = line.id || `l${index + 1}`;
  if (line.manual) {
    return {
      id,
      concepto: line.concepto,
      tipo: line.tipo || 'descuento',
      monto: Number(line.monto) || 0,
      manual: true,
      motivo: line.motivo || '',
      formula: null,
      parametroLegal: null
    };
  }

  const parametro = line.parametroLegal || parametros[line.parametroCodigo] || null;
  const base = Number(line.base) || 0;
  const factor =
    line.factor ?? (line.parametroCodigo === 'HORAS_EXTRA' ? parametro?.valor : undefined);
  const tasa = line.tasa ?? (factor === undefined ? parametro?.valor : undefined) ?? 0;
  const monto = Number.isFinite(Number(line.monto))
    ? Number(line.monto)
    : Math.round(base * (factor ?? tasa));
  const parametroLegal = congelarParametro(parametro, periodo);
  const formula =
    line.formula ??
    (factor !== undefined
      ? '{base} × {factor} = {monto}'
      : parametroLegal
        ? '{base} × {tasa} = {monto}'
        : '{base}');

  return {
    id,
    concepto: line.concepto,
    tipo: line.tipo,
    base,
    tasa,
    ...(factor === undefined ? {} : { factor }),
    ...(line.horas === undefined ? {} : { horas: line.horas }),
    monto,
    formula,
    ...(parametroLegal ? { parametroLegal } : {})
  };
}

/**
 * Calculate a liquidation and persist the immutable parameter snapshots on
 * every line. The view can later render the snapshot without reading current
 * legal parameters.
 */
export function calcularLiquidacion({
  id = `liq-${Date.now()}`,
  numero,
  trabajador,
  periodo,
  fechaEmision,
  emisor,
  estado = 'calculada',
  lineas = [],
  parametros = PARAMETROS_LEGALES
}) {
  const calculadas = lineas.map((line, index) =>
    buildCalculatedLine(line, index, periodo, parametros)
  );
  const liquidacion = {
    id,
    numero: numero || `LQ-${periodo?.anio || ''}-${String(id).slice(-4)}`,
    estado,
    trabajador,
    periodo,
    fechaEmision,
    ...(emisor ? { emisor } : {}),
    lineas: calculadas
  };
  liquidacion.totales = totals(liquidacion);
  return saveLiquidacion(liquidacion);
}
