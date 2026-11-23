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
import { createPasswordToggle } from './rrhh/components/password-toggle.js';

let modelConfig = null;
let rrhhView = null;
let liquidationView = null;
let passwordToggle = null;

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

function updateSeedControl() {
  const button = qs('rrhh-seed-button');
  const feedback = qs('rrhh-seed-feedback');
  const allowed = getViewer().role === 'administrador';
  if (button) button.hidden = !allowed;
  if (!allowed && feedback) {
    feedback.hidden = true;
    feedback.textContent = '';
  }
}

function showRoleRequired() {
  const banner = qs('rrhh-role-feedback');
  if (!banner) return;
  banner.hidden = false;
  banner.dataset.tone = 'error';
  banner.textContent = 'Tu rol no tiene permiso para realizar esta acción.';
}

function clearRoleFeedback() {
  const banner = qs('rrhh-role-feedback');
  if (!banner) return;
  banner.hidden = true;
  banner.textContent = '';
  delete banner.dataset.tone;
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
      ? trabajadores.filter(
          (t) => t.estadoLaboral === 'Activo' || t.estadoLaboral === 'Desvinculado'
        )
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
    onRoleRequired: showRoleRequired,
    onLiquidationView: (view) => {
      liquidationView = view;
    }
  });
}

function goAfterAuth(tab = 'resumen') {
  const viewer = getViewer();
  updateUserBadge();
  updateSeedControl();
  clearRoleFeedback();
  if (needsRepresentado(viewer)) {
    showRepresentadoScreen();
    return;
  }
  showSection('rrhh');
  renderRrhh(tab);
}

function handleLoginSubmit(event) {
  event.preventDefault();
  const role = qs('login-role')?.value || '';
  const password = qs('login-password')?.value || '';
  const feedback = qs('login-feedback');
  try {
    if (!validateDemoCredentials(role, password)) {
      passwordToggle?.hide();
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
  if (getViewer().role !== 'administrador') return;
  const message =
    'Esto reemplazará los datos de RR.HH. de ejemplo por el dataset de prueba, incluidos catálogos, contratos, liquidaciones y períodos, y reiniciará la bitácora de auditoría. ¿Continuar?';
  if (typeof confirm === 'function' && !confirm(message)) return;
  const activeTab = rrhhView?.activeTab || 'resumen';
  const fb = qs('rrhh-seed-feedback');
  try {
    const summary = restoreSeedData();
    if (!summary) throw new Error('Carga de datos de prueba deshabilitada.');
    goAfterAuth(activeTab);
    if (fb) {
      fb.hidden = false;
      fb.textContent = `Cargados: ${summary.trabajadores} trabajadores, ${summary.contratos} contratos.`;
    }
  } catch (error) {
    console.error('Error al cargar datos de prueba:', error);
    if (fb) {
      fb.hidden = false;
      fb.textContent =
        error.message === 'Carga de datos de prueba deshabilitada.'
          ? 'La carga de datos de prueba está deshabilitada en este entorno.'
          : 'No se pudo cargar datos de prueba.';
    }
  }
}

function bindEvents() {
  passwordToggle = createPasswordToggle(document);
  const loginForm = qs('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLoginSubmit);
  }
  qs('rep-form')?.addEventListener('submit', handleRepSubmit);
  qs('rrhh-logout-btn')?.addEventListener('click', () => {
    passwordToggle?.hide();
    logout();
    liquidationView?.dispose?.();
    liquidationView = null;
    rrhhView?.dispose?.();
    rrhhView = null;
    updateUserBadge();
    updateSeedControl();
    clearRoleFeedback();
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
  updateSeedControl();
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
