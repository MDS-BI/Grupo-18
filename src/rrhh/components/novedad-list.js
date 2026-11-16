/** Novedad list with approval, rejection and correction actions. */

import {
  ESTADO_NOVEDAD_LABELS,
  TIPO_NOVEDAD_LABELS,
  UNIDAD_POR_TIPO
} from '../utils/novedades-data.js';
import { puedeAprobarNovedades, puedeEditarNovedades } from '../utils/novedades-aprobacion.js';
import { badge, button, el, statusTone } from './dom.js';

function workerName(entityId, entities) {
  const entity = (entities || []).find(
    (row) => row.entity_id === entityId || row.id === entityId
  );
  return entity?.name || entityId || 'Trabajador sin identificar';
}

/**
 * Render the novedad list.
 *
 * @param {HTMLElement} container
 * @param {object} options
 * @param {Document} options.doc
 * @param {object} options.viewer
 * @param {Array} options.novedades
 * @param {Array} options.entities
 * @param {boolean} options.periodoAbierto
 * @param {Function} options.onApprove (id) => void
 * @param {Function} options.onReject (id, motivo) => void
 * @param {Function} options.onCorrect (novedad) => void
 * @param {Function} options.onAnnul (novedad) => void
 */
export function renderNovedadList(
  container,
  {
    doc,
    viewer,
    novedades = [],
    entities = [],
    periodoAbierto = true,
    onApprove = () => {},
    onReject = () => {},
    onCorrect = () => {},
    onAnnul = () => {}
  } = {}
) {
  container.textContent = '';
  if (novedades.length === 0) {
    const empty = el(doc, 'div', 'empty-state', 'No hay novedades para el período seleccionado.');
    empty.id = 'novedades-empty';
    container.appendChild(empty);
    return;
  }

  const canApprove = puedeAprobarNovedades(viewer);
  const canEdit = puedeEditarNovedades(viewer);
  const list = el(doc, 'div', 'rrhh-list');
  list.id = 'novedades-list';
  list.setAttribute('role', 'list');

  for (const novedad of novedades) {
    const item = el(doc, 'article', 'rrhh-list-item rrhh-novedad-item');
    item.setAttribute('role', 'listitem');
    item.dataset.novedadId = novedad.id;

    const header = el(doc, 'div', 'rrhh-list-item-header');
    const title = el(doc, 'div', 'rrhh-list-item-title');
    title.appendChild(el(doc, 'strong', null, workerName(novedad.trabajadorEntityId, entities)));
    title.appendChild(
      el(
        doc,
        'span',
        'panel-copy',
        `${TIPO_NOVEDAD_LABELS[novedad.tipo] || novedad.tipo} · ${novedad.cantidad} ${
          UNIDAD_POR_TIPO[novedad.tipo] || ''
        }`
      )
    );
    header.appendChild(title);
    header.appendChild(
      badge(doc, ESTADO_NOVEDAD_LABELS[novedad.estado] || novedad.estado || '', statusTone(novedad.estado))
    );
    item.appendChild(header);

    const meta = el(doc, 'p', 'rrhh-list-meta');
    meta.textContent = `Período ${novedad.periodo} · ${novedad.fechaInicio || '—'} a ${novedad.fechaFin || '—'}`;
    item.appendChild(meta);

    if (novedad.observacion) {
      const observation = el(doc, 'p', 'rrhh-list-observation', novedad.observacion);
      item.appendChild(observation);
    }
    if (novedad.justificacion) {
      item.appendChild(
        el(doc, 'p', 'rrhh-list-observation', `Justificación: ${novedad.justificacion}`)
      );
    }
    if (novedad.estado === 'rechazada' && novedad.motivoRechazo) {
      const reason = el(doc, 'p', 'rrhh-rejection-reason', `Motivo del rechazo: ${novedad.motivoRechazo}`);
      item.appendChild(reason);
    }
    if (novedad.estado === 'anulada') {
      const reason = el(
        doc,
        'p',
        'rrhh-list-meta',
        `Anulada${novedad.anuladoPor ? ` por ${novedad.anuladoPor}` : ''}${
          novedad.motivoAnulacion ? ` · ${novedad.motivoAnulacion}` : ''
        }`
      );
      item.appendChild(reason);
    }

    const actions = el(doc, 'div', 'rrhh-row-actions');
    const ownNovedad =
      String(viewer?.usuario || '').trim().toLowerCase() ===
      String(novedad.registradoPor || '').trim().toLowerCase();

    if (novedad.estado === 'pendiente' && canApprove && !ownNovedad) {
      const reasonInput = el(doc, 'input', 'rrhh-reject-reason');
      reasonInput.type = 'text';
      reasonInput.id = `motivo-rechazo-${novedad.id}`;
      reasonInput.placeholder = 'Motivo de rechazo';
      reasonInput.setAttribute('aria-label', `Motivo de rechazo de la novedad de ${workerName(novedad.trabajadorEntityId, entities)}`);
      reasonInput.disabled = !periodoAbierto;
      actions.appendChild(reasonInput);

      actions.appendChild(
        button(doc, {
          label: 'Aprobar',
          className: 'button button-primary button-small rrhh-approve',
          ariaLabel: `Aprobar la novedad de ${workerName(novedad.trabajadorEntityId, entities)}`,
          disabled: !periodoAbierto,
          onClick: () => onApprove(novedad.id)
        })
      );
      actions.appendChild(
        button(doc, {
          label: 'Rechazar',
          className: 'button button-danger button-small rrhh-reject',
          ariaLabel: `Rechazar la novedad de ${workerName(novedad.trabajadorEntityId, entities)}`,
          disabled: !periodoAbierto,
          onClick: () => onReject(novedad.id, reasonInput.value)
        })
      );
    } else if (novedad.estado === 'pendiente' && canApprove && ownNovedad) {
      actions.appendChild(
        el(doc, 'span', 'panel-copy', 'No puedes aprobar ni rechazar una novedad propia.')
      );
    }

    if (novedad.estado === 'pendiente' && canEdit) {
      actions.appendChild(
        button(doc, {
          label: 'Editar',
          className: 'button button-secondary button-small rrhh-edit',
          ariaLabel: `Editar la novedad pendiente de ${workerName(novedad.trabajadorEntityId, entities)}`,
          disabled: !periodoAbierto,
          onClick: () => onCorrect(novedad)
        })
      );
      actions.appendChild(
        button(doc, {
          label: 'Anular',
          className: 'button button-danger button-small rrhh-annul',
          ariaLabel: `Anular la novedad de ${workerName(novedad.trabajadorEntityId, entities)}`,
          disabled: !periodoAbierto,
          onClick: () => onAnnul(novedad)
        })
      );
    }

    if (actions.childNodes.length > 0) {
      if (!periodoAbierto) {
        actions.appendChild(el(doc, 'span', 'panel-copy', 'Período cerrado: solo lectura.'));
      }
      item.appendChild(actions);
    }

    list.appendChild(item);
  }

  container.appendChild(list);
}
