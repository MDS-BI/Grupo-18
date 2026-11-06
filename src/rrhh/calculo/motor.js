/**
 * Pure payroll calculation engine (steps 1-14 of the plan).
 *
 * Every line is rounded to the peso and totals are obtained by adding the
 * already-rounded lines, so the printed amounts always reconcile.
 */

import {
  PARAMETROS_INICIALES,
  TRAMOS_IMPUESTO_INICIALES,
  resolverParametro,
  resolverTramoImpuesto
} from './parametros.js';
import { diasNoTrabajados, normalizarTipo } from '../utils/novedades-data.js';
import { etiquetaPeriodo, rangoPeriodo } from '../utils/periodos.js';

/** Round to the nearest peso (half up), avoiding negative zero. */
export function redondearPeso(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number) || 0;
}

function fechaDelPeriodo(periodo) {
  if (!periodo) return new Date().toISOString().slice(0, 10);
  if (typeof periodo === 'string') return rangoPeriodo(periodo).fechaFin;
  return periodo.fechaFin || periodo.fechaPago || periodo.fechaInicio || new Date().toISOString().slice(0, 10);
}

function etiquetaDe(periodo) {
  if (!periodo) return '';
  if (typeof periodo === 'string') return etiquetaPeriodo(periodo);
  return periodo.etiqueta || (periodo.id ? etiquetaPeriodo(periodo.id) : '');
}

function normalizarParametro(codigo, value, fecha) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'object') {
    return {
      codigo: value.codigo || codigo,
      descripcion: value.descripcion || `Parámetro ${codigo}`,
      valor: Number(value.valorAplicado ?? value.valor),
      vigenciaDesde: value.vigenciaDesde || value.fechaVigencia || fecha,
      fuente: value.fuente || ''
    };
  }
  return {
    codigo,
    descripcion: `Parámetro ${codigo}`,
    valor: Number(value),
    vigenciaDesde: fecha,
    fuente: ''
  };
}

/** Resolve a parameter record from an array/map of legal parameters. */
export function resolverParametroDeCalculo(codigo, fecha, parametros = PARAMETROS_INICIALES) {
  if (Array.isArray(parametros)) {
    return (
      resolverParametro(codigo, fecha, parametros) ||
      resolverParametro(codigo, fecha, PARAMETROS_INICIALES)
    );
  }
  if (parametros && parametros[codigo] !== undefined) {
    return normalizarParametro(codigo, parametros[codigo], fecha);
  }
  return resolverParametro(codigo, fecha, PARAMETROS_INICIALES);
}

function valor(codigo, fecha, parametros, fallback = 0) {
  const row = resolverParametroDeCalculo(codigo, fecha, parametros);
  const number = row ? Number(row.valor) : NaN;
  return Number.isFinite(number) ? number : fallback;
}

function snapshot(codigo, fecha, parametros, etiqueta, overrides = {}) {
  const row = resolverParametroDeCalculo(codigo, fecha, parametros);
  return {
    codigo,
    descripcion: overrides.descripcion || row?.descripcion || `Parámetro ${codigo}`,
    fechaVigencia: row?.vigenciaDesde || fecha,
    valorAplicado: overrides.valorAplicado ?? (row ? Number(row.valor) : 0),
    fuente: overrides.fuente ?? row?.fuente ?? '',
    congeladoEnPeriodo: etiqueta,
    congeladoEn: new Date().toISOString()
  };
}

function snapshotContrato(codigo, descripcion, valorAplicado, etiqueta, fuente) {
  return {
    codigo,
    descripcion,
    fechaVigencia: null,
    valorAplicado,
    fuente,
    congeladoEnPeriodo: etiqueta,
    congeladoEn: new Date().toISOString()
  };
}

/** Step 1: proportional salary over a 30-day commercial month. */
export function calcularSueldoProporcional(sueldoBase, diasTrabajados = 30) {
  const days = Math.max(0, Math.min(30, Number(diasTrabajados)));
  return redondearPeso((Number(sueldoBase) || 0) * (days / 30));
}

/** Step 2: overtime hour value. */
export function calcularValorHoraExtra({
  sueldoBase,
  jornadaHorasSemanales = 42,
  recargo = 1.5
}) {
  const jornada = Number(jornadaHorasSemanales) || 42;
  return redondearPeso(((Number(sueldoBase) || 0) / 30) * (7 / jornada) * (Number(recargo) || 1.5));
}

/** Step 3: legal gratification, capped at 4.75 IMM / 12. */
export function calcularGratificacion({ base, ingresoMinimo, topeIMM = 4.75 }) {
  const cap = redondearPeso((Number(topeIMM) * Number(ingresoMinimo)) / 12);
  const percent = redondearPeso((Number(base) || 0) * 0.25);
  return { monto: Math.min(percent, cap), tope: cap, porcentaje: percent };
}

/** Step 10: single income tax from the UTM bracket. */
export function calcularImpuestoUnico({ baseTributable, utm, tramos = TRAMOS_IMPUESTO_INICIALES, fecha }) {
  if (!(Number(utm) > 0)) return { monto: 0, tramo: null, baseUTM: 0 };
  const baseUTM = Number(baseTributable) / Number(utm);
  const tramo = resolverTramoImpuesto(baseUTM, tramos, fecha);
  if (!tramo) return { monto: 0, tramo: null, baseUTM };
  const monto = Math.max(
    0,
    redondearPeso(Number(baseTributable) * Number(tramo.factor) - Number(tramo.rebajaUTM) * Number(utm))
  );
  return { monto, tramo, baseUTM };
}

function formulaValue(value) {
  return `$${Math.round(Number(value) || 0).toLocaleString('es-CL')}`;
}

function makeLine({
  id,
  concepto,
  tipo,
  monto,
  base,
  tasa,
  factor,
  horas,
  formula,
  parametroLegal,
  manual = false,
  motivo = '',
  excluirDeTotales = false,
  esSensible,
  clasificacion
}) {
  return {
    id,
    concepto,
    tipo,
    monto: redondearPeso(monto),
    ...(base === undefined ? {} : { base: redondearPeso(base) }),
    ...(tasa === undefined ? {} : { tasa }),
    ...(factor === undefined ? {} : { factor }),
    ...(horas === undefined ? {} : { horas }),
    ...(formula ? { formula } : {}),
    ...(manual ? { manual: true, motivo } : {}),
    ...(parametroLegal ? { parametroLegal } : {}),
    ...(excluirDeTotales ? { excluirDeTotales: true } : {}),
    ...(esSensible ? { esSensible: true, clasificacion } : {})
  };
}

/**
 * Calculate one worker's liquidation.
 *
 * @param {object} input
 * @param {object} input.trabajador Worker entity (id, entityId, nombre, rut...)
 * @param {object} input.contrato Active contract
 * @param {Array} input.novedades Approved novedades (others are ignored)
 * @param {object|Array} input.parametros Legal parameters valid for the period
 * @param {object|string} input.periodo Period record or YYYY-MM id
 */
export function calcularLiquidacionTrabajador({
  trabajador = {},
  contrato = {},
  novedades = [],
  parametros = PARAMETROS_INICIALES,
  periodo,
  diasTrabajados,
  bonosImponibles = 0,
  descuentosVoluntarios = []
} = {}) {
  const fecha = fechaDelPeriodo(periodo);
  const etiqueta = etiquetaDe(periodo);
  const sueldoBase = Number(contrato.sueldoBase ?? trabajador.sueldoBase ?? 0);
  const jornada = Number(
    contrato.jornadaHorasSemanales ?? valor('JORNADA_MAX', fecha, parametros, 42)
  );
  const tipoContrato = contrato.tipoContrato || 'indefinido';
  const modalidad = contrato.modalidadGratificacion || 'art50';
  const ingresoMinimo = valor('IMM', fecha, parametros, 553553);
  const utm = valor('UTM', fecha, parametros, 71649);
  const uf = valor('UF', fecha, parametros, 39500);
  const topeGratif = valor('TOPE_GRATIF_ANUAL_IMM', fecha, parametros, 4.75);
  const recargo = 1 + valor('RECARGO_HORA_EXTRA', fecha, parametros, 50) / 100;

  const aprobadas = (novedades || []).filter(
    (novedad) => !novedad.estado || novedad.estado === 'aprobada'
  );
  const horasExtra = aprobadas
    .filter((novedad) => normalizarTipo(novedad.tipo) === 'horas_extra')
    .reduce((total, novedad) => total + (Number(novedad.cantidad) || 0), 0);
  const descansos = diasNoTrabajados(aprobadas);
  const days = diasTrabajados === undefined ? Math.max(0, 30 - descansos) : Number(diasTrabajados);

  const sueldo = calcularSueldoProporcional(sueldoBase, days);
  const valorHora = calcularValorHoraExtra({
    sueldoBase,
    jornadaHorasSemanales: jornada,
    recargo
  });
  const montoHorasExtra = redondearPeso(horasExtra * valorHora);

  const baseGratificacion = sueldo + montoHorasExtra + (Number(bonosImponibles) || 0);
  const gratificacion =
    modalidad === 'sin'
      ? { monto: 0, tope: 0, porcentaje: 0 }
      : calcularGratificacion({
          base: baseGratificacion,
          ingresoMinimo,
          topeIMM: topeGratif
        });

  const colacion = redondearPeso(contrato.asignacionColacion || 0);
  const movilizacion = redondearPeso(contrato.asignacionMovilizacion || 0);
  const imponible = redondearPeso(
    sueldo + montoHorasExtra + gratificacion.monto + (Number(bonosImponibles) || 0)
  );
  const noImponible = colacion + movilizacion;
  const totalHaberes = imponible + noImponible;

  const topeAfpSalud = valor('TOPE_IMPONIBLE_AFP_SALUD', fecha, parametros, 90) * uf;
  const topeAfc = valor('TOPE_IMPONIBLE_AFC', fecha, parametros, 135.2) * uf;
  const baseAfpSalud = Math.min(imponible, topeAfpSalud);
  const baseAfc = Math.min(imponible, topeAfc);

  const tasaAfpTrabajador = valor('TASA_AFP_TRABAJADOR', fecha, parametros, 10);
  const comisionAfp = valor('COMISION_AFP', fecha, parametros, 1.27);
  const tasaAfp = (tasaAfpTrabajador + comisionAfp) / 100;
  const tasaSalud = valor('TASA_SALUD_LEGAL', fecha, parametros, 7) / 100;
  const esIndefinido = tipoContrato === 'indefinido';
  const tasaAfcTrabajador =
    valor(esIndefinido ? 'TASA_AFC_TRAB_INDEF' : 'TASA_AFC_TRAB_PLAZO', fecha, parametros, esIndefinido ? 0.6 : 0) /
    100;

  const afp = redondearPeso(baseAfpSalud * tasaAfp);
  const salud = redondearPeso(baseAfpSalud * tasaSalud);
  const afc = redondearPeso(baseAfc * tasaAfcTrabajador);

  const tributable = Math.max(0, imponible - afp - salud - afc);
  const tramos = parametros && !Array.isArray(parametros) && parametros.tramos
    ? parametros.tramos
    : TRAMOS_IMPUESTO_INICIALES;
  const impuesto = calcularImpuestoUnico({
    baseTributable: tributable,
    utm,
    tramos,
    fecha
  });

  const topeVoluntarios = redondearPeso(
    totalHaberes * (valor('TOPE_DESC_VOLUNTARIOS', fecha, parametros, 15) / 100)
  );
  const voluntariosSolicitados = (descuentosVoluntarios || []).reduce(
    (total, item) => total + (Number(item.monto) || 0),
    0
  );
  const descuentosVoluntariosTotal = Math.min(voluntariosSolicitados, topeVoluntarios);
  const advertencias = [];
  if (voluntariosSolicitados > topeVoluntarios) {
    advertencias.push(
      `Los descuentos voluntarios se limitaron al 15% de los haberes (${formulaValue(topeVoluntarios)}).`
    );
  }

  const lineas = [];
  let lineIndex = 0;
  const nextId = () => `liq-line-${++lineIndex}`;

  lineas.push(
    makeLine({
      id: nextId(),
      concepto: 'Sueldo base',
      tipo: 'haber',
      monto: sueldo,
      base: sueldo,
      tasa: 1,
      formula: '{base}',
      parametroLegal: snapshotContrato(
        'SUELDO_BASE',
        'Sueldo base pactado',
        sueldoBase,
        etiqueta,
        'Contrato de trabajo'
      )
    })
  );

  if (horasExtra > 0) {
    lineas.push(
      makeLine({
        id: nextId(),
        concepto: 'Horas extra',
        tipo: 'haber',
        monto: montoHorasExtra,
        base: valorHora,
        factor: recargo,
        horas: horasExtra,
        formula: '{horas} h × {base} × {factor} = {monto}',
        parametroLegal: snapshot('RECARGO_HORA_EXTRA', fecha, parametros, etiqueta, {
          descripcion: 'Recargo por horas extraordinarias',
          valorAplicado: recargo
        })
      })
    );
  }

  if (gratificacion.monto > 0) {
    lineas.push(
      makeLine({
        id: nextId(),
        concepto: 'Gratificación legal',
        tipo: 'haber',
        monto: gratificacion.monto,
        base: baseGratificacion,
        tasa: 0.25,
        formula: 'mín({base} × {tasa}; tope 4,75 IMM / 12) = {monto}',
        parametroLegal: snapshot('TOPE_GRATIF_ANUAL_IMM', fecha, parametros, etiqueta, {
          descripcion: 'Gratificación legal (art. 50)'
        })
      })
    );
  }

  if (colacion > 0) {
    lineas.push(
      makeLine({
        id: nextId(),
        concepto: 'Colación',
        tipo: 'haber',
        monto: colacion,
        base: colacion,
        tasa: 1,
        formula: '{base}',
        parametroLegal: snapshotContrato(
          'ASIGNACION_COLACION',
          'Asignación de colación (no imponible)',
          colacion,
          etiqueta,
          'Contrato de trabajo'
        )
      })
    );
  }

  if (movilizacion > 0) {
    lineas.push(
      makeLine({
        id: nextId(),
        concepto: 'Movilización',
        tipo: 'haber',
        monto: movilizacion,
        base: movilizacion,
        tasa: 1,
        formula: '{base}',
        parametroLegal: snapshotContrato(
          'ASIGNACION_MOVILIZACION',
          'Asignación de movilización (no imponible)',
          movilizacion,
          etiqueta,
          'Contrato de trabajo'
        )
      })
    );
  }

  lineas.push(
    makeLine({
      id: nextId(),
      concepto: 'Cotización AFP',
      tipo: 'descuento',
      monto: afp,
      base: baseAfpSalud,
      tasa: tasaAfp,
      formula: '{base} × {tasa} = {monto}',
      parametroLegal: snapshot('TASA_AFP_TRABAJADOR', fecha, parametros, etiqueta, {
        codigo: 'AFP',
        descripcion: `Cotización AFP (${tasaAfpTrabajador}% + comisión ${comisionAfp}%)`,
        valorAplicado: tasaAfp
      })
    })
  );

  lineas.push(
    makeLine({
      id: nextId(),
      concepto: 'Cotización de salud',
      tipo: 'descuento',
      monto: salud,
      base: baseAfpSalud,
      tasa: tasaSalud,
      formula: '{base} × {tasa} = {monto}',
      parametroLegal: snapshot('TASA_SALUD_LEGAL', fecha, parametros, etiqueta, {
        codigo: 'SALUD',
        descripcion: 'Cotización legal de salud',
        valorAplicado: tasaSalud
      })
    })
  );

  if (afc > 0) {
    lineas.push(
      makeLine({
        id: nextId(),
        concepto: 'Seguro de cesantía',
        tipo: 'descuento',
        monto: afc,
        base: baseAfc,
        tasa: tasaAfcTrabajador,
        formula: '{base} × {tasa} = {monto}',
        parametroLegal: snapshot(
          esIndefinido ? 'TASA_AFC_TRAB_INDEF' : 'TASA_AFC_TRAB_PLAZO',
          fecha,
          parametros,
          etiqueta,
          { codigo: 'AFC', descripcion: 'Seguro de cesantía del trabajador' }
        )
      })
    );
  }

  if (descuentosVoluntariosTotal > 0) {
    lineas.push(
      makeLine({
        id: nextId(),
        concepto: 'Descuentos voluntarios',
        tipo: 'descuento',
        monto: descuentosVoluntariosTotal,
        manual: true,
        motivo: 'Descuentos voluntarios autorizados (anticipos o cuotas)',
        formula: null
      })
    );
  }

  lineas.push(
    makeLine({
      id: nextId(),
      concepto: 'Impuesto único',
      tipo: 'impuesto',
      monto: impuesto.monto,
      base: tributable,
      tasa: impuesto.tramo?.factor ?? 0,
      formula: '{base} × {tasa} = {monto}',
      parametroLegal: snapshot('UTM', fecha, parametros, etiqueta, {
        codigo: 'IMPUESTO_UNICO',
        descripcion: 'Impuesto único de segunda categoría',
        valorAplicado: impuesto.tramo?.factor ?? 0
      })
    })
  );

  const descuentos = redondearPeso(afp + salud + afc + descuentosVoluntariosTotal);
  const impuestos = impuesto.monto;
  const liquido = redondearPeso(totalHaberes - descuentos - impuestos);

  const tasaAfcEmpleador =
    valor(esIndefinido ? 'TASA_AFC_EMP_INDEF' : 'TASA_AFC_EMP_PLAZO', fecha, parametros, esIndefinido ? 2.4 : 3) /
    100;
  const aportes = [
    {
      codigo: 'APORTE_EMP_AFC',
      concepto: 'Aporte empleador seguro de cesantía',
      base: baseAfc,
      tasa: tasaAfcEmpleador,
      monto: redondearPeso(baseAfc * tasaAfcEmpleador)
    },
    {
      codigo: 'APORTE_EMP_PREVISIONAL',
      concepto: 'Aporte previsional del empleador',
      base: imponible,
      tasa: valor('APORTE_EMP_PREVISIONAL', fecha, parametros, 0) / 100,
      monto: redondearPeso(imponible * (valor('APORTE_EMP_PREVISIONAL', fecha, parametros, 0) / 100))
    },
    {
      codigo: 'APORTE_EMP_MUTUAL',
      concepto: 'Cotización mutual de seguridad',
      base: imponible,
      tasa: valor('MUTUAL', fecha, parametros, 0.93) / 100,
      monto: redondearPeso(imponible * (valor('MUTUAL', fecha, parametros, 0.93) / 100))
    }
  ];
  const totalAportes = aportes.reduce((total, row) => total + row.monto, 0);

  return {
    trabajador,
    contratoId: contrato.id || null,
    periodoId: typeof periodo === 'string' ? periodo : periodo?.id || null,
    periodo: typeof periodo === 'string' ? { id: periodo, etiqueta } : periodo || null,
    fechaEmision: fecha,
    tipoContrato,
    lineas,
    totales: {
      haberes: totalHaberes,
      descuentos,
      impuestos,
      liquido
    },
    bases: {
      sueldoBase,
      sueldoProporcional: sueldo,
      diasTrabajados: days,
      diasNoTrabajados: descansos,
      horasExtra,
      valorHoraExtra: valorHora,
      imponible,
      noImponible,
      tributable,
      baseAfpSalud,
      baseAfc,
      baseUTM: impuesto.baseUTM
    },
    descuentos: { afp, salud, afc, voluntarios: descuentosVoluntariosTotal },
    impuesto: impuesto.monto,
    tramoImpuesto: impuesto.tramo,
    aportesEmpleador: aportes,
    totalAportesEmpleador: totalAportes,
    costoEmpleador: redondearPeso(totalHaberes + totalAportes),
    novedadesAplicadas: aprobadas.map((novedad) => novedad.id).filter(Boolean),
    advertencias
  };
}

/** Convenience wrapper used by integration tests and the service layer. */
export function calcularPlanillaTrabajador(input) {
  return calcularLiquidacionTrabajador(input);
}
