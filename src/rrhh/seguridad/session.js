import { DEFAULT_ROLE, ROLE_MATRIX } from './roles.js';

export const SESSION_KEY = 'erp_rrhh:sesion';

export const DEFAULT_SESSION = {
  usuario: 'Analista de Remuneraciones',
  rol: DEFAULT_ROLE,
  trabajadorId: null,
  equipo: [],
  actualizadoEn: null
};

function storageAvailable() {
  return typeof localStorage !== 'undefined';
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

/**
 * Read the simulated session. An unknown stored role is preserved so the
 * permission matrix can deny access instead of silently granting it.
 */
export function getSession() {
  if (!storageAvailable()) return clone(DEFAULT_SESSION);
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return clone(DEFAULT_SESSION);
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return clone(DEFAULT_SESSION);
    return {
      ...clone(DEFAULT_SESSION),
      ...parsed,
      equipo: Array.isArray(parsed.equipo) ? [...parsed.equipo] : []
    };
  } catch {
    return clone(DEFAULT_SESSION);
  }
}

/** Persist a session. The role must be a known role from the matrix. */
export function setSession(partial = {}) {
  const base = getSession();
  const next = {
    ...base,
    ...partial,
    equipo: Array.isArray(partial.equipo) ? [...partial.equipo] : base.equipo,
    actualizadoEn: new Date().toISOString()
  };
  if (storageAvailable()) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
  return clone(next);
}

/** Switch the simulated role, keeping the rest of the session. */
export function setRole(rol, extra = {}) {
  return setSession({ ...extra, rol });
}

export function clearSession() {
  if (storageAvailable()) localStorage.removeItem(SESSION_KEY);
}

/** Viewer shape consumed by the liquidation views and guards. */
export function getViewer() {
  const session = getSession();
  return {
    role: session.rol,
    usuario: session.usuario,
    trabajadorId: session.trabajadorId,
    equipo: session.equipo
  };
}

export function availableRoles() {
  return Object.entries(ROLE_MATRIX)
    .filter(([key]) => key !== 'analista_rrhh')
    .map(([key, value]) => ({ value: key, label: value.label }));
}
