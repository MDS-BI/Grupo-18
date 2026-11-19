import { ROLE_MATRIX } from './roles.js';
import { clearAuth, getAuth, setAuth } from './auth.js';

export const SESSION_KEY = 'erp_rrhh:sesion';

export const DEFAULT_SESSION = {
  usuario: '',
  rol: '',
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

export function setRole(rol, extra = {}) {
  // For demo login flow: also set auth
  if (rol && typeof rol === 'string') {
    try {
      setAuth(rol);
    } catch {
      // ignore if auth module not ready
    }
  }
  return setSession({ ...extra, rol });
}

export function clearSession() {
  if (storageAvailable()) localStorage.removeItem(SESSION_KEY);
}

export function getViewer() {
  const auth = getAuth();
  const session = getSession();
  // Prefer auth role if present (demo login)
  const role = auth?.rol || session?.rol || '';
  if (!role) {
    return { role: '', usuario: '', trabajadorId: null, equipo: [] };
  }
  return {
    role,
    usuario: session.usuario || ROLE_MATRIX[role]?.label || role,
    trabajadorId: session.trabajadorId ?? null,
    equipo: session.equipo || []
  };
}

export function availableRoles() {
  return Object.entries(ROLE_MATRIX)
    .filter(([key]) => key !== 'analista_rrhh' && key !== 'gerencia' && key !== 'auditor')
    .map(([key, value]) => ({ value: key, label: value.label }));
}

export function completeLoginSession(role) {
  setAuth(role);
  const label = ROLE_MATRIX[role]?.label || role;
  setSession({
    rol: role,
    usuario: label,
    trabajadorId: null,
    equipo: [],
    actualizadoEn: new Date().toISOString()
  });
  return getViewer();
}

export function logout() {
  clearAuth();
  clearSession();
}