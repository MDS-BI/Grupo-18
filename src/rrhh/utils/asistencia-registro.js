/**
 * Attendance registry (Asistencia): the full, queryable history of novedades
 * across every period, with filters, totals and CSV export.
 *
 * Scope follows the same rules as the Asistencia tab: the jefatura only sees
 * its team; medical leaves never carry a diagnosis (only type and days).
 */

import { loadEntities } from '../../storage.js';
import { registrarAuditoria } from '../seguridad/auditoria.js';
import { listNovedades } from './novedades-service.js';
import { equipoDeJefatura } from './jefatura.js';
import { ESTADO_NOVEDAD_LABELS, TIPO_NOVEDAD_LABELS, UNIDAD_POR_TIPO } from './novedades-data.js';
import { rangosSeSuperponen } from './fechas.js';

const ROLES_CON_ACCESO = ['administrador', 'analista', 'jefatura'];

function normalizar(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}

function etiquetaUnidad(unidad) {
  return unidad === 'dias' ? 'días' : unidad || '';
}

export function puedeConsultarRegistro(viewer) {
  return ROLES_CON_ACCESO.includes(viewer?.role);
}

function nombres() {
  const map = new Map();
  try {
    for (const entity of loadEntities()) {
      map.set(String(entity.entity_id || entity.id), {
        name: entity.name || '',
        rut: entity.taxId || ''
      });
    }
  } catch {
    // Storage unavailable: names fall back to the id.
  }
  return map;
}

/**
 * Query the attendance history.
 * @param {object} filtros texto (name or RUT), tipo, estado, desde, hasta (YYYY-MM-DD)
 */
export function consultarAsistencia({
  viewer,
  texto = '',
  tipo = '',
  estado = '',
  desde = '',
  hasta = ''
} = {}) {
  if (!puedeConsultarRegistro(viewer)) {
    const error = new Error('Tu rol no puede consultar el registro de asistencia.');
    error.code = 'PERMISO_DENEGADO';
    throw error;
  }
  const team =
    viewer.role === 'jefatura' ? new Set((equipoDeJefatura(viewer) || []).map(String)) : null;
  const personas = nombres();
  const query = normalizar(texto);
  const queryRut = query.replace(/[^0-9k]/g, '');
  const rangoDesde = desde || '0000-01-01';
  const rangoHasta = hasta || '9999-12-31';

  return listNovedades({ incluirBaja: false })
    .filter((row) => !team || team.has(String(row.trabajadorEntityId)))
    .filter((row) => !tipo || row.tipo === tipo)
    .filter((row) => !estado || row.estado === estado)
    .filter((row) =>
      rangosSeSuperponen(
        row.fechaInicio || '',
        row.fechaFin || row.fechaInicio || '',
        rangoDesde,
        rangoHasta
      )
    )
    .map((row) => {
      const persona = personas.get(String(row.trabajadorEntityId)) || {
        name: row.trabajadorEntityId,
        rut: ''
      };
      return {
        id: row.id,
        trabajadorEntityId: row.trabajadorEntityId,
        trabajador: persona.name,
        rut: persona.rut,
        periodo: row.periodo,
        tipo: row.tipo,
        tipoEtiqueta: TIPO_NOVEDAD_LABELS[row.tipo] || row.tipo,
        cantidad: Number(row.cantidad) || 0,
        unidad: UNIDAD_POR_TIPO[row.tipo] || row.unidad || '',
        unidadEtiqueta: etiquetaUnidad(UNIDAD_POR_TIPO[row.tipo] || row.unidad),
        fechaInicio: row.fechaInicio,
        fechaFin: row.fechaFin,
        estado: row.estado,
        estadoEtiqueta: ESTADO_NOVEDAD_LABELS[row.estado] || row.estado,
        registradoPor: row.registradoPor || '',
        motivoRechazo: row.motivoRechazo || ''
      };
    })
    .filter((row) => {
      if (!query) return true;
      const rut = normalizar(row.rut).replace(/[^0-9k]/g, '');
      return (
        normalizar(row.trabajador).includes(query) ||
        (queryRut.length >= 3 && rut.includes(queryRut))
      );
    })
    .sort(
      (a, b) =>
        String(b.fechaInicio).localeCompare(String(a.fechaInicio)) ||
        a.trabajador.localeCompare(b.trabajador)
    );
}

/** Totals of the filtered rows; only approved records count toward hours/days. */
export function totalesAsistencia(rows = []) {
  const aprobadas = rows.filter((row) => row.estado === 'aprobada');
  const sumar = (tipo) =>
    aprobadas.filter((row) => row.tipo === tipo).reduce((total, row) => total + row.cantidad, 0);
  return {
    registros: rows.length,
    trabajadores: new Set(rows.map((row) => String(row.trabajadorEntityId))).size,
    pendientes: rows.filter((row) => row.estado === 'pendiente').length,
    horasExtra: sumar('horas_extra'),
    diasLicencia: sumar('licencia_medica'),
    diasAusencia: sumar('ausencia')
  };
}

function celdaCsv(value) {
  const text = String(value ?? '');
  return /[;"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** CSV with UTF-8 BOM and `;` separator so it opens correctly in Excel. */
export function asistenciaCsv(rows = []) {
  const encabezados = [
    'trabajador',
    'rut',
    'periodo',
    'tipo',
    'cantidad',
    'unidad',
    'fecha_inicio',
    'fecha_fin',
    'estado',
    'registrado_por',
    'motivo_rechazo'
  ];
  const lineas = rows.map((row) =>
    [
      row.trabajador,
      row.rut,
      row.periodo,
      row.tipoEtiqueta,
      row.cantidad,
      row.unidadEtiqueta,
      row.fechaInicio,
      row.fechaFin,
      row.estadoEtiqueta,
      row.registradoPor,
      row.motivoRechazo
    ]
      .map(celdaCsv)
      .join(';')
  );
  return `\uFEFF${[encabezados.join(';'), ...lineas].join('\r\n')}\r\n`;
}

export function registrarExportacionAsistencia(viewer, cantidad) {
  registrarAuditoria({
    accion: 'exportar',
    tabla: 'novedades',
    registroId: 'registro-asistencia',
    motivo: `Exportación del registro de asistencia (${cantidad} fila(s))`,
    actor: viewer?.usuario || viewer?.role,
    rol: viewer?.role
  });
}
