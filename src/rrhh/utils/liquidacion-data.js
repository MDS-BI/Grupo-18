export const TIPOS_LINEA = ['haber', 'descuento', 'impuesto'];

export const TIPO_LABELS = {
  haber: 'Haberes',
  descuento: 'Descuentos',
  impuesto: 'Impuestos'
};

/** Format an integer amount as Chilean pesos, e.g. 1200000 -> "$1.200.000". */
export function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  const rounded = Math.round(number);
  const sign = rounded < 0 ? '-' : '';
  const digits = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${sign}$${digits}`;
}

/** Format an ISO date (YYYY-MM-DD) as dd/mm/yyyy for the Chilean UI. */
export function formatDate(value) {
  if (!value) return '—';
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : String(value);
  const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '—';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function trimDecimal(value) {
  return value.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
}

/** Format a rate expressed as a fraction, e.g. 0.105 -> "10,5%". */
export function formatPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return `${trimDecimal(number * 100)}%`;
}

/** Format a factor, e.g. 1.5 -> "1,5". */
export function formatFactor(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return '—';
  return trimDecimal(number);
}

/** Sum the liquidation lines by type and derive the net amount. */
export function totals(liquidacion) {
  const result = { haberes: 0, descuentos: 0, impuestos: 0, liquido: 0 };
  for (const line of liquidacion?.lineas || []) {
    if (line.excluirDeTotales) continue;
    const amount = Number(line.monto);
    if (!Number.isFinite(amount)) continue;
    if (line.tipo === 'haber') result.haberes += amount;
    else if (line.tipo === 'descuento') result.descuentos += amount;
    else if (line.tipo === 'impuesto') result.impuestos += amount;
  }
  result.liquido = result.haberes - result.descuentos - result.impuestos;
  return result;
}

function snapshot(code, description, validity, value, source) {
  return {
    codigo: code,
    descripcion: description,
    fechaVigencia: validity,
    valorAplicado: value,
    fuente: source,
    congeladoEnPeriodo: 'Septiembre 2026'
  };
}

/**
 * Demo read model used when the application has no stored liquidations yet.
 * It is a complete snapshot: the view never resolves current legal parameters.
 */
export function createDemoLiquidacion() {
  const liquidacion = {
    id: 'liq-demo-001',
    numero: 'LQ-2026-0001',
    estado: 'calculada',
    trabajador: {
      id: 'trab-001',
      nombre: 'María González Pérez',
      rut: '12.345.678-9',
      cargo: 'Analista de Remuneraciones',
      departamento: 'Recursos Humanos'
    },
    periodo: {
      anio: 2026,
      mes: 9,
      etiqueta: 'Septiembre 2026',
      fechaInicio: '2026-09-01',
      fechaFin: '2026-09-30',
      cerrado: false
    },
    fechaEmision: '2026-09-30',
    emisor: {
      razonSocial: 'Comercial Andes SpA',
      rut: '76.543.210-K',
      direccion: 'Av. Providencia 1234, Santiago',
      giro: 'Comercio al por menor'
    },
    lineas: [
      {
        id: 'l1',
        concepto: 'Sueldo base',
        tipo: 'haber',
        monto: 1200000,
        base: 1200000,
        tasa: 1,
        formula: '{base}',
        parametroLegal: snapshot(
          'SUELDO_BASE',
          'Sueldo base pactado',
          '2026-01-01',
          1200000,
          'Contrato de trabajo'
        )
      },
      {
        id: 'l2',
        concepto: 'Gratificación legal',
        tipo: 'haber',
        monto: 300000,
        base: 1200000,
        tasa: 0.25,
        formula: '{base} × {tasa} = {monto}',
        parametroLegal: snapshot(
          'GRATIFICACION_LEGAL',
          'Gratificación legal',
          '2026-01-01',
          0.25,
          'Código del Trabajo, artículo 50'
        )
      },
      {
        id: 'l3',
        concepto: 'Horas extra',
        tipo: 'haber',
        monto: 45000,
        base: 30000,
        tasa: 1.5,
        factor: 1.5,
        horas: 1,
        formula: '{base} × {factor} = {monto}',
        parametroLegal: snapshot(
          'HORAS_EXTRA',
          'Recargo por horas extraordinarias',
          '2026-01-01',
          1.5,
          'Código del Trabajo, artículo 32'
        )
      },
      {
        id: 'l4',
        concepto: 'Cotización AFP',
        tipo: 'descuento',
        monto: 126000,
        base: 1200000,
        tasa: 0.105,
        formula: '{base} × {tasa} = {monto}',
        parametroLegal: snapshot(
          'AFP',
          'Cotización obligatoria AFP',
          '2026-01-01',
          0.105,
          'DL 3.500'
        )
      },
      {
        id: 'l5',
        concepto: 'Cotización de salud',
        tipo: 'descuento',
        monto: 84000,
        base: 1200000,
        tasa: 0.07,
        formula: '{base} × {tasa} = {monto}',
        parametroLegal: snapshot('SALUD', 'Cotización de salud', '2026-01-01', 0.07, 'Ley 18.933')
      },
      {
        id: 'l6',
        concepto: 'Anticipo',
        tipo: 'descuento',
        monto: 32000,
        manual: true,
        motivo: 'Anticipo solicitado por la trabajadora el 12/09/2026',
        parametroLegal: null
      },
      {
        id: 'l7',
        concepto: 'Impuesto único',
        tipo: 'impuesto',
        monto: 32000,
        base: 1280000,
        tasa: 0.025,
        formula: '{base} × {tasa} = {monto}',
        parametroLegal: snapshot(
          'IMPUESTO_UNICO',
          'Impuesto único de segunda categoría',
          '2026-01-01',
          0.025,
          'Ley 21.210'
        )
      }
    ]
  };
  liquidacion.totales = totals(liquidacion);
  return liquidacion;
}

/** Validate the structural contract required to render a liquidation. */
export function validateLiquidacion(liquidacion) {
  const errors = [];
  if (!liquidacion || typeof liquidacion !== 'object' || Array.isArray(liquidacion)) {
    return { valid: false, errors: ['La liquidación debe ser un objeto.'] };
  }
  if (!liquidacion.id) errors.push('La liquidación requiere un identificador.');
  if (!liquidacion.trabajador?.nombre) errors.push('La liquidación requiere el nombre del trabajador.');
  if (!liquidacion.trabajador?.rut) errors.push('La liquidación requiere el RUT del trabajador.');
  if (!liquidacion.periodo?.etiqueta) errors.push('La liquidación requiere un período.');
  if (!liquidacion.fechaEmision) errors.push('La liquidación requiere una fecha de emisión.');
  if (!Array.isArray(liquidacion.lineas) || liquidacion.lineas.length === 0) {
    errors.push('La liquidación requiere al menos una línea.');
  } else {
    liquidacion.lineas.forEach((line, index) => {
      const where = `La línea ${index + 1}`;
      if (!line || typeof line !== 'object') {
        errors.push(`${where} debe ser un objeto.`);
        return;
      }
      if (!line.id) errors.push(`${where} requiere un identificador.`);
      if (!line.concepto) errors.push(`${where} requiere un concepto.`);
      if (!TIPOS_LINEA.includes(line.tipo)) {
        errors.push(`${where} debe ser de tipo haber, descuento o impuesto.`);
      }
      if (!Number.isFinite(Number(line.monto)) || Number(line.monto) < 0) {
        errors.push(`${where} requiere un monto no negativo.`);
      }
      if (line.manual && (!line.motivo || !String(line.motivo).trim())) {
        errors.push(`${where} es manual y requiere un motivo.`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}

/** Classify the legal parameter snapshot against the liquidation period. */
export function parameterStatus(parametro, periodo) {
  if (!parametro) return 'sin-parametro';
  if (!parametro.congeladoEnPeriodo) return 'sin-snapshot';
  if (periodo?.fechaFin && parametro.fechaVigencia && parametro.fechaVigencia > periodo.fechaFin) {
    return 'no-vigente';
  }
  return 'vigente';
}

function renderFormula(line) {
  if (!line.formula) return '';
  const replacements = {
    base: formatMoney(line.base),
    tasa: formatPercent(line.tasa),
    factor: formatFactor(line.factor ?? line.tasa),
    monto: formatMoney(line.monto),
    horas: String(line.horas ?? '')
  };
  return line.formula.replace(/\{(\w+)\}/g, (match, key) =>
    replacements[key] === undefined ? match : replacements[key]
  );
}

/**
 * Derive every value needed by the explanatory panel. The parameter is taken
 * only from the line snapshot; current legal parameters are never consulted.
 */
export function lineExplanation(line, periodo) {
  const manual = Boolean(line?.manual);
  const parametro = line?.parametroLegal ? { ...line.parametroLegal } : null;
  const estadoParametro = parameterStatus(parametro, periodo);
  const advertencias = [];

  if (!manual) {
    if (estadoParametro === 'sin-parametro') {
      advertencias.push(
        'Esta línea se muestra sin parámetro legal asociado; no se dispone de desglose normativo.'
      );
    }
    if (estadoParametro === 'sin-snapshot') {
      advertencias.push(
        'Esta línea no conserva el snapshot del período; los valores podrían no ser reproducibles.'
      );
    }
    if (estadoParametro === 'no-vigente') {
      advertencias.push(
        'El parámetro legal no estaba vigente al cierre del período; se muestran los valores congelados registrados.'
      );
    }
    if (!line?.formula) {
      advertencias.push('Esta línea no tiene fórmula registrada; se muestra solo el monto.');
    }
  }

  return {
    id: line?.id,
    concepto: line?.concepto || '',
    tipo: line?.tipo || '',
    manual,
    monto: Number(line?.monto) || 0,
    montoTexto: formatMoney(line?.monto),
    base: line?.base ?? null,
    baseTexto: line?.base === undefined || line?.base === null ? '—' : formatMoney(line.base),
    tasa: line?.tasa ?? null,
    tasaTexto: line?.tasa === undefined || line?.tasa === null ? '—' : formatPercent(line.tasa),
    factor: line?.factor ?? null,
    factorTexto:
      line?.factor === undefined || line?.factor === null ? '' : formatFactor(line.factor),
    formula: line?.formula || '',
    formulaTexto: manual ? '' : renderFormula(line),
    motivo: manual ? line?.motivo || '' : '',
    parametro,
    parametroTexto: parametro ? `${parametro.codigo} — ${parametro.descripcion}` : '',
    vigenciaTexto: parametro?.fechaVigencia
      ? `Vigente desde ${formatDate(parametro.fechaVigencia)}`
      : 'Sin fecha de vigencia',
    fuente: parametro?.fuente || 'Fuente no registrada',
    congeladoEnPeriodo: parametro?.congeladoEnPeriodo || '',
    estadoParametro,
    advertencias
  };
}
