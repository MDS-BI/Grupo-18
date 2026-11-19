import { loadModuleConfig, setActiveConfig, getConfig } from './module-config.js';
import { validateDemoCredentials } from './rrhh/seguridad/auth.js';
import {
  completeLoginSession,
  getViewer,
  logout,
  setSession,
  getSession
} from './rrhh/seguridad/session.js';
import { ensureSeedOnFirstBoot, restoreSeedData } from './rrhh/data/seed.js';
import { listTrabajadores } from './rrhh/utils/trabajadores-service.js';
import { renderRrhhWorkspace } from './rrhh/views/rrhh-router.js';

let modelConfig = null;
let rrhhView = null;
let liquidationView = null;

function qs(id) {
  return document.getElementById(id);
}

function showSection(name) {
  const map = { login: 'view-login', representado: 'view-representado', rrhh: 'view-rrhh' };
  for (const [k, id] of Object.entries(map)) {
    const el = qs(id);
    if (el) el.hidden = k !== name;
  }
}

function updateUserBadge() {
  const badge = qs('rrhh-user-badge');
  const btn = qs('rrhh-logout-btn');
  const viewer = getViewer();
  if (!viewer.role) {
    if (badge) badge.hidden = true;
    if (btn) btn.hidden = true;
    return;
  }
  const labelMap = {
    administrador: 'Administrador/a de RR.HH.',
    analista: 'Analista de remuneraciones',
    jefatura: 'Jefatura',
    trabajador: 'Trabajador'
  };
  let repText = '';
  if (viewer.trabajadorId && (viewer.role === 'jefatura' || viewer.role === 'trabajador')) {
    const trabajadores = listTrabajadores({ incluirBaja: true });
    const match = trabajadores.find((t) => (t.entityId || t.id) === viewer.trabajadorId);
    if (match) {
      const code = match.code ? ` (${match.code})` : '';
      repText = ` · ${match.name || 'Sin nombre'}${code}`;
    } else {
      repText = ` · ${viewer.trabajadorId}`;
    }
  } else if (viewer.trabajadorId) {
    repText = ` (rep: ${viewer.trabajadorId})`;
  }
  if (badge) {
    badge.hidden = false;
    badge.textContent = `${labelMap[viewer.role] || viewer.role}${repText}`;
  }
  if (btn) btn.hidden = false;
}

function needsRepresentado(viewer) {
  if (viewer.role === 'jefatura' || viewer.role === 'trabajador') {
    return !viewer.trabajadorId;
  }
  return false;
}

function populateRepresentadoSelect(role) {
  const select = qs('rep-select');
  if (!select) return;
  select.innerHTML = '';
  const trabajadores = listTrabajadores({ incluirBaja: true });
  const filtered =
    role === 'trabajador'
      ? trabajadores.filter((t) => t.estadoLaboral === 'Activo' || t.estadoLaboral === 'Desvinculado')
      : trabajadores.filter((t) => t.estadoLaboral === 'Activo');
  if (filtered.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'No hay trabajadores disponibles';
    select.appendChild(opt);
    return;
  }
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Seleccione...';
  select.appendChild(placeholder);
  for (const t of filtered) {
    const opt = document.createElement('option');
    opt.value = t.entityId || t.id;
    opt.textContent = `${t.name || 'Sin nombre'} (${t.code || ''})`;
    select.appendChild(opt);
  }
}

function showRepresentadoScreen() {
  const viewer = getViewer();
  populateRepresentadoSelect(viewer.role);
  const subtitle = qs('rep-subtitle');
  if (subtitle) {
    subtitle.textContent =
      viewer.role === 'jefatura'
        ? 'En Jefatura seleccione su propia ficha de jefe/a para cargar su equipo a cargo.'
        : 'En Trabajador seleccione su propia ficha personal para ver sus datos y liquidaciones.';
  }
  showSection('representado');
}

function renderRrhh(tab) {
  if (!modelConfig?.rrhh?.enabled) return;
  liquidationView?.dispose?.();
  liquidationView = null;
  rrhhView?.dispose?.();
  rrhhView = renderRrhhWorkspace({
    doc: document,
    config: modelConfig,
    viewer: getViewer(),
    initialTab: tab || 'resumen',
    onRoleRequired: () => {},
    onLiquidationView: (view) => {
      liquidationView = view;
    }
  });
}

function goAfterAuth() {
  const viewer = getViewer();
  updateUserBadge();
  if (needsRepresentado(viewer)) {
    showRepresentadoScreen();
    return;
  }
  showSection('rrhh');
  renderRrhh('resumen');
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const role = qs('login-role')?.value || '';
  const password = qs('login-password')?.value || '';
  const feedback = qs('login-feedback');
  try {
    if (!validateDemoCredentials(role, password)) {
      if (feedback) {
        feedback.hidden = false;
        feedback.textContent =
          'Credenciales inválidas. Use: administrador/admin123, analista/analista123, jefatura/jefatura123, trabajador/trabajador123';
      }
      return;
    }
    if (feedback) {
      feedback.hidden = true;
      feedback.textContent = '';
    }
    completeLoginSession(role);
    goAfterAuth();
  } catch (err) {
    console.error('Error en login:', err);
    if (feedback) {
      feedback.hidden = false;
      feedback.textContent = 'Ocurrió un error al iniciar sesión.';
    }
  }
}

function handleRepSubmit(event) {
  event.preventDefault();
  const selectEl = qs('rep-select');
  const val = selectEl?.value || '';
  const feedbackEl = qs('rep-feedback');
  if (!val) {
    if (feedbackEl) {
      feedbackEl.hidden = false;
      feedbackEl.textContent = 'Seleccione un trabajador.';
    }
    return;
  }
  if (feedbackEl) {
    feedbackEl.hidden = true;
    feedbackEl.textContent = '';
  }
  const session = getSession();
  const trabajadores = listTrabajadores({ incluirBaja: true });
  const equipo =
    session.rol === 'jefatura'
      ? trabajadores
          .filter((t) => t.jefeId && String(t.jefeId) === String(val))
          .map((t) => t.entityId || t.id)
      : [];
  setSession({ trabajadorId: val, equipo });
  goAfterAuth();
}

function handleSeedDataRestore() {
  const message =
    'Esto reemplazará los datos de RR.HH. de ejemplo por el dataset de prueba. ¿Continuar?';
  if (typeof confirm === 'function' && !confirm(message)) return;
  const summary = restoreSeedData();
  if (!summary) {
    const fb = qs('rrhh-seed-feedback');
    if (fb) {
      fb.hidden = false;
      fb.textContent = 'No se pudo cargar datos de prueba.';
    }
    return;
  }
  if (getViewer().role && !qs('view-rrhh').hidden) renderRrhh(rrhhView?.getActiveTab?.() || 'resumen');
  const fb = qs('rrhh-seed-feedback');
  if (fb) {
    fb.hidden = false;
    fb.textContent = `Cargados: ${summary.trabajadores} trabajadores, ${summary.contratos} contratos.`;
  }
}

function bindEvents() {
  const loginForm = qs('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  // Respaldo: si el submit no se dispara, el botón con type=submit igual dispara submit; si no, manejar click.
  const loginBtn = document.querySelector('#login-form button[type="submit"]');
  if (loginBtn && loginForm) {
    loginBtn.addEventListener('click', (e) => {
      // Si el formulario tiene validación HTML5, dejar que submit lo maneje; si no, forzar submit.
      if (typeof loginForm.requestSubmit === 'function') {
        try {
          loginForm.requestSubmit();
        } catch {
          // fallback
          e.preventDefault();
          handleLoginSubmit(e);
        }
      } else {
        // fallback para navegadores antiguos
        e.preventDefault();
        handleLoginSubmit(e);
      }
    });
  }
  qs('rep-form')?.addEventListener('submit', handleRepSubmit);
  qs('rrhh-logout-btn')?.addEventListener('click', () => {
    logout();
    liquidationView?.dispose?.();
    liquidationView = null;
    rrhhView?.dispose?.();
    rrhhView = null;
    updateUserBadge();
    showSection('login');
  });
  qs('rrhh-seed-button')?.addEventListener('click', handleSeedDataRestore);
}

function clearCorruptedStorage() {
  try {
    if (typeof localStorage !== 'undefined') {
      const keys = ['erp_rrhh:auth', 'erp_rrhh:sesion'];
      for (const k of keys) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) JSON.parse(raw);
        } catch {
          try {
            localStorage.removeItem(k);
          } catch {
            // ignore
          }
        }
      }
    }
    if (typeof sessionStorage !== 'undefined') {
      try {
        const raw = sessionStorage.getItem('erp_rrhh:auth');
        if (raw) JSON.parse(raw);
      } catch {
        try {
          sessionStorage.removeItem('erp_rrhh:auth');
        } catch {
          // ignore
        }
      }
    }
  } catch {
    // ignore
  }
}

function showConfigErrors(errors) {
  const banner = qs('config-errors');
  if (!banner) return;
  if (errors && errors.length > 0) {
    banner.hidden = false;
    banner.textContent = `Revisa la configuración: ${errors.join(' ')}`;
  } else {
    banner.hidden = true;
    banner.textContent = '';
  }
}

export async function boot(options = {}) {
  const result = await loadModuleConfig();
  return initApp(result, options);
}

export async function initApp(result, _options = {}) {
  clearCorruptedStorage();
  const normalized = result || (await loadModuleConfig());
  setActiveConfig(normalized.config || null);
  modelConfig = getConfig();
  ensureSeedOnFirstBoot();
  bindEvents();
  showConfigErrors(normalized.errors);
  updateUserBadge();
  const viewer = getViewer();
  if (!viewer.role) {
    showSection('login');
  } else if (needsRepresentado(viewer)) {
    showRepresentadoScreen();
  } else {
    showSection('rrhh');
    renderRrhh('resumen');
  }
  return modelConfig;
}
