const AUTH_KEY = 'erp_rrhh:auth';

const DEMO_CREDENTIALS = {
  administrador: 'admin123',
  analista: 'analista123',
  jefatura: 'jefatura123',
  trabajador: 'trabajador123'
};

/** @param {string} role */
export function getDemoPassword(role) {
  return DEMO_CREDENTIALS[role] || null;
}

/**
 * @param {string} role
 * @param {string} password
 */
export function validateDemoCredentials(role, password) {
  const expected = DEMO_CREDENTIALS[role];
  if (!expected) return false;
  return String(password || '') === expected;
}

function storageAvailable() {
  return typeof sessionStorage !== 'undefined';
}

export function getAuth() {
  if (!storageAvailable()) return null;
  try {
    const raw = sessionStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    if (!parsed.rol || !DEMO_CREDENTIALS[parsed.rol]) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setAuth(role) {
  if (!storageAvailable()) return null;
  const payload = {
    rol: role,
    authenticatedAt: new Date().toISOString()
  };
  sessionStorage.setItem(AUTH_KEY, JSON.stringify(payload));
  return payload;
}

export function clearAuth() {
  if (storageAvailable()) sessionStorage.removeItem(AUTH_KEY);
}

export function isAuthenticated() {
  return Boolean(getAuth());
}
