/**
 * Direct-report helpers.
 *
 * The simulated session may carry an explicit `equipo` list or the worker id
 * of the user acting as jefatura. Both sources are combined here so every
 * module applies the same scope without importing the workers service.
 */

import { list } from '../storage-rrhh.js';

const TRABAJADORES_TABLE = 'trabajadores';

function profiles() {
  try {
    return list(TRABAJADORES_TABLE);
  } catch {
    return [];
  }
}

/**
 * Return the worker ids visible to a jefatura.
 *
 * `null` means the viewer has no team information at all, so callers should
 * keep their legacy behaviour. An empty array means the jefatura has a team
 * definition with no members.
 */
export function equipoDeJefatura(viewer) {
  if (viewer?.role !== 'jefatura') return null;
  const hasExplicitTeam = Array.isArray(viewer.equipo);
  const hasWorkerId = Boolean(viewer.trabajadorId);
  if (!hasExplicitTeam && !hasWorkerId) return null;

  const team = new Set();
  if (hasExplicitTeam) {
    for (const value of viewer.equipo) team.add(String(value));
  }
  if (hasWorkerId) {
    for (const profile of profiles()) {
      if (String(profile.jefeId || '') === String(viewer.trabajadorId)) {
        team.add(String(profile.entityId));
      }
    }
  }
  return [...team];
}

export function esJefaturaDe(viewer, entityId) {
  const team = equipoDeJefatura(viewer);
  if (!team) return false;
  return team.includes(String(entityId));
}

export function jefeDirectoDe(entityId) {
  const profile = profiles().find((row) => String(row.entityId) === String(entityId));
  return profile?.jefeId || '';
}
