import { insert, list } from '../storage-rrhh.js';

export const CONCEPTOS_TABLE = 'conceptos';

/**
 * Payroll concept catalogue. `esSensible` marks concepts whose mere presence
 * reveals protected information (for example union membership).
 */
export const CONCEPTOS_INICIALES = [
  { codigo: 'SUELDO_BASE', nombre: 'Sueldo base', tipo: 'haber_imponible', imponible: true, tributable: true, metodoCalculo: 'formula', esSensible: false, cuentaContable: '5101' },
  { codigo: 'HORAS_EXTRA', nombre: 'Horas extra', tipo: 'haber_imponible', imponible: true, tributable: true, metodoCalculo: 'novedad', esSensible: false, cuentaContable: '5102' },
  { codigo: 'GRATIFICACION', nombre: 'Gratificación legal', tipo: 'haber_imponible', imponible: true, tributable: true, metodoCalculo: 'formula', esSensible: false, cuentaContable: '5103' },
  { codigo: 'BONO', nombre: 'Bono imponible', tipo: 'haber_imponible', imponible: true, tributable: true, metodoCalculo: 'fijo', esSensible: false, cuentaContable: '5104' },
  { codigo: 'COLACION', nombre: 'Colación', tipo: 'haber_no_imponible', imponible: false, tributable: false, metodoCalculo: 'fijo', esSensible: false, cuentaContable: '5105' },
  { codigo: 'MOVILIZACION', nombre: 'Movilización', tipo: 'haber_no_imponible', imponible: false, tributable: false, metodoCalculo: 'fijo', esSensible: false, cuentaContable: '5106' },
  { codigo: 'ASIG_FAMILIAR', nombre: 'Asignación familiar', tipo: 'haber_no_imponible', imponible: false, tributable: false, metodoCalculo: 'fijo', esSensible: false, cuentaContable: '5107' },
  { codigo: 'COT_AFP', nombre: 'Cotización AFP', tipo: 'descuento_legal', imponible: false, tributable: false, metodoCalculo: 'porcentaje', esSensible: false, cuentaContable: '2101' },
  { codigo: 'COT_SALUD', nombre: 'Cotización de salud', tipo: 'descuento_legal', imponible: false, tributable: false, metodoCalculo: 'porcentaje', esSensible: false, cuentaContable: '2102' },
  { codigo: 'SEG_CESANTIA', nombre: 'Seguro de cesantía', tipo: 'descuento_legal', imponible: false, tributable: false, metodoCalculo: 'porcentaje', esSensible: false, cuentaContable: '2103' },
  { codigo: 'IMPUESTO_UNICO', nombre: 'Impuesto único', tipo: 'descuento_legal', imponible: false, tributable: false, metodoCalculo: 'formula', esSensible: false, cuentaContable: '2104' },
  { codigo: 'ANTICIPO', nombre: 'Anticipo de sueldo', tipo: 'descuento_voluntario', imponible: false, tributable: false, metodoCalculo: 'fijo', esSensible: false, cuentaContable: '2105' },
  { codigo: 'CUOTA_SINDICAL', nombre: 'Cuota sindical', tipo: 'descuento_voluntario', imponible: false, tributable: false, metodoCalculo: 'fijo', esSensible: true, clasificacion: 'cuotas_sindicales', cuentaContable: '2106' },
  { codigo: 'APORTE_EMP_AFC', nombre: 'Aporte empleador seguro de cesantía', tipo: 'aporte_empleador', imponible: false, tributable: false, metodoCalculo: 'porcentaje', esSensible: false, cuentaContable: '6101' },
  { codigo: 'APORTE_EMP_PREVISIONAL', nombre: 'Aporte previsional del empleador', tipo: 'aporte_empleador', imponible: false, tributable: false, metodoCalculo: 'porcentaje', esSensible: false, cuentaContable: '6102' },
  { codigo: 'APORTE_EMP_MUTUAL', nombre: 'Cotización mutual', tipo: 'aporte_empleador', imponible: false, tributable: false, metodoCalculo: 'porcentaje', esSensible: false, cuentaContable: '6103' }
];

let seeded = false;

export function inicializarConceptos({ force = false } = {}) {
  if (seeded && !force) return listConceptos();
  if (force || list(CONCEPTOS_TABLE).length === 0) {
    for (const row of CONCEPTOS_INICIALES) insert(CONCEPTOS_TABLE, row, { prefix: 'con' });
  }
  seeded = true;
  return listConceptos();
}

export function listConceptos() {
  const rows = list(CONCEPTOS_TABLE);
  return rows.length > 0 ? rows : CONCEPTOS_INICIALES.map((row) => ({ ...row }));
}

export function getConcepto(codigo) {
  return listConceptos().find((row) => row.codigo === codigo) || null;
}

export function esConceptoSensible(codigo) {
  return Boolean(getConcepto(codigo)?.esSensible);
}

export function resetConceptosSeed() {
  seeded = false;
}
