/**
 * "Cargas familiares" block inside the worker form: lets the user register the
 * worker's dependants together with the file. Every row is validated before the
 * worker is stored, so an invalid dependant never leaves a half-saved worker.
 */

import {
  PARENTESCOS,
  PARENTESCO_LABELS,
  TIPOS_CARGA,
  TIPO_CARGA_LABELS,
  crearCarga,
  validarCarga
} from '../utils/cargas-service.js';
import { limpiarRut } from '../calculo/rut.js';
import { hoyISO } from '../utils/fechas.js';
import { FECHA_MINIMA } from '../utils/limites-fechas.js';
import { clearFieldErrors, setFieldErrors } from './feedback.js';
import { button, el, input, select } from './dom.js';

const CAMPOS = [
  { key: 'nombre', label: 'Nombre *', match: /nombre/i },
  { key: 'rut', label: 'RUT *', match: /RUT|reconocida|registrada/i },
  { key: 'parentesco', label: 'Parentesco *', match: /parentesco/i },
  { key: 'fechaNacimiento', label: 'Fecha de nacimiento *', match: /nacimiento/i },
  { key: 'tipo', label: 'Tipo de carga *', match: /tipo de carga/i },
  { key: 'resolucionNumero', label: 'N° de resolución *', match: /número de la resolución/i },
  { key: 'resolucionFecha', label: 'Fecha de resolución *', match: /fecha de la resolución/i }
];

export function renderCargasFicha(root, { doc } = {}) {
  const documentRef = doc || root.ownerDocument;
  const fieldset = el(documentRef, 'fieldset', 'rrhh-cargas-ficha');
  fieldset.id = 'trabajador-cargas';
  const legend = el(documentRef, 'legend', null, 'Cargas familiares (opcional)');
  fieldset.appendChild(legend);
  fieldset.appendChild(
    el(
      documentRef,
      'p',
      'field-help',
      'Agrega las cargas reconocidas del trabajador. Quedan vigentes desde la fecha de su resolución y generan la asignación familiar en la liquidación.'
    )
  );
  const lista = el(documentRef, 'div', 'rrhh-cargas-ficha-lista');
  fieldset.appendChild(lista);
  const agregar = button(documentRef, {
    id: 'trabajador-agregar-carga',
    label: 'Agregar carga familiar',
    className: 'button button-secondary button-small',
    onClick: () => agregarFila()
  });
  fieldset.appendChild(agregar);
  root.appendChild(fieldset);

  let secuencia = 0;
  const filas = [];

  function agregarFila() {
    secuencia += 1;
    const n = secuencia;
    const fila = el(documentRef, 'div', 'rrhh-carga-fila field-grid');
    fila.dataset.cargaFila = String(n);
    const controles = {
      nombre: input(documentRef, { id: `ficha-carga-${n}-nombre` }),
      rut: input(documentRef, { id: `ficha-carga-${n}-rut`, placeholder: '12.345.678-5' }),
      parentesco: select(documentRef, {
        id: `ficha-carga-${n}-parentesco`,
        options: [
          { value: '', label: 'Selecciona' },
          ...PARENTESCOS.map((value) => ({ value, label: PARENTESCO_LABELS[value] }))
        ]
      }),
      fechaNacimiento: input(documentRef, { id: `ficha-carga-${n}-nacimiento`, type: 'date' }),
      tipo: select(documentRef, {
        id: `ficha-carga-${n}-tipo`,
        value: 'simple',
        options: TIPOS_CARGA.map((value) => ({ value, label: TIPO_CARGA_LABELS[value] }))
      }),
      resolucionNumero: input(documentRef, { id: `ficha-carga-${n}-resolucion` }),
      resolucionFecha: input(documentRef, { id: `ficha-carga-${n}-resolucion-fecha`, type: 'date' })
    };
    for (const key of ['fechaNacimiento', 'resolucionFecha']) {
      controles[key].min = FECHA_MINIMA;
      controles[key].max = hoyISO();
    }
    for (const campo of CAMPOS) {
      const control = controles[campo.key];
      const wrapper = el(documentRef, 'div', 'field');
      const label = el(documentRef, 'label', null, campo.label);
      label.setAttribute('for', control.id);
      wrapper.appendChild(label);
      wrapper.appendChild(control);
      fila.appendChild(wrapper);
    }
    const estudianteLabel = el(documentRef, 'label', 'rrhh-checkbox');
    const estudiante = input(documentRef, { id: `ficha-carga-${n}-estudiante`, type: 'checkbox' });
    estudianteLabel.appendChild(estudiante);
    estudianteLabel.appendChild(documentRef.createTextNode(' Estudiante (hasta 24 años)'));
    fila.appendChild(estudianteLabel);
    const quitar = button(documentRef, {
      label: 'Quitar',
      className: 'button button-ghost button-small',
      ariaLabel: `Quitar la carga ${n}`,
      onClick: () => {
        fila.remove();
        filas.splice(
          filas.findIndex((row) => row.n === n),
          1
        );
      }
    });
    fila.appendChild(quitar);
    lista.appendChild(fila);
    filas.push({ n, fila, controles, estudiante });
    controles.nombre.focus?.();
  }

  function leer() {
    return filas.map(({ n, fila, controles, estudiante }) => ({
      n,
      fila,
      datos: {
        nombre: controles.nombre.value,
        rut: controles.rut.value,
        parentesco: controles.parentesco.value,
        fechaNacimiento: controles.fechaNacimiento.value,
        tipo: controles.tipo.value,
        estudiante: estudiante.checked,
        resolucionNumero: controles.resolucionNumero.value,
        resolucionFecha: controles.resolucionFecha.value,
        // Recognized from the date of its resolution.
        vigenteDesde: controles.resolucionFecha.value
      },
      controles
    }));
  }

  /** Validate every row; returns the list of messages (empty when all rows are valid). */
  function validar() {
    const mensajes = [];
    const vistos = new Set();
    for (const { n, fila, datos, controles } of leer()) {
      clearFieldErrors(fila);
      const { errors } = validarCarga(datos, { sinTrabajador: true });
      const rut = limpiarRut(datos.rut);
      if (rut && vistos.has(rut)) {
        errors.push('El RUT de la carga está repetido en este formulario.');
      }
      if (rut) vistos.add(rut);
      if (errors.length) {
        setFieldErrors(
          fila,
          errors,
          CAMPOS.map((campo) => ({
            key: campo.key,
            id: controles[campo.key].id,
            match: campo.match
          }))
        );
        mensajes.push(...errors.map((message) => `Carga ${n}: ${message}`));
      }
    }
    return mensajes;
  }

  /** Store every row for the given worker. Call only after `validar()` returned no messages. */
  function guardar(entityId, viewer) {
    const creadas = [];
    for (const { datos } of leer()) creadas.push(crearCarga({ ...datos, entityId }, viewer));
    return creadas;
  }

  function limpiar() {
    for (const { fila } of filas) fila.remove();
    filas.length = 0;
  }

  return {
    element: fieldset,
    agregarFila,
    validar,
    guardar,
    limpiar,
    get cantidad() {
      return filas.length;
    }
  };
}
