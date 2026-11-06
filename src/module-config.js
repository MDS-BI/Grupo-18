/**
 * Module adaptation profile.
 *
 * Custom ERP modules tailor the base module by editing ONLY this file:
 * set `userConfig` to a ModuleConfig object (see
 * specs/001-erp-base-module/data-model.md) and leave the rest of the code
 * untouched.
 *
 * Example (Recursos Humanos):
 * export const userConfig = {
 *   moduleName: 'Recursos Humanos',
 *   labels: {
 *     entity: 'Trabajador',
 *     entities: 'Trabajadores',
 *     document: 'Liquidación de Sueldo',
 *     documents: 'Liquidaciones de Sueldo'
 *   },
 *   customFields: [
 *     { target: 'entity', key: 'rut', label: 'RUT', type: 'text', required: true }
 *   ],
 *   statusLifecycle: null,
 *   theme: { accentColor: '#2563eb' }
 * };
 */
export const userConfig = null;

export const FIELD_TYPES = ['text', 'number', 'date', 'select'];

export const BASE_FIELDS = {
  entity: [
    'id',
    'entity_id',
    'name',
    'code',
    'taxId',
    'email',
    'phone',
    'address',
    'category',
    'description',
    'targetDate',
    'creditLimit',
    'paymentTerms',
    'createdAt',
    'updatedAt'
  ],
  document: [
    'id',
    'entity_id',
    'series',
    'folio',
    'startDate',
    'endDate',
    'quantity',
    'subtotal',
    'discount',
    'taxAmount',
    'totalAmount',
    'currency',
    'paymentTerms',
    'notes',
    'status',
    'createdAt',
    'updatedAt'
  ]
};

export const DEFAULT_CONFIG = {
  moduleName: 'Módulo Base ERP',
  labels: {
    entity: 'Entidad',
    entities: 'Entidades',
    document: 'Documento',
    documents: 'Documentos'
  },
  customFields: [],
  statusLifecycle: null,
  theme: { accentColor: '#2563eb' },
  rrhh: {
    enabled: false,
    label: 'RRHH / Planilla',
    roleSelector: true
  },
  empresa: {
    razonSocial: '',
    rut: '',
    direccion: '',
    giro: ''
  }
};

const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const LABEL_KEYS = ['entity', 'entities', 'document', 'documents'];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function defaultConfig() {
  return clone(DEFAULT_CONFIG);
}

let activeConfig = null;

/**
 * Normalize and validate a module configuration, reporting every problem
 * instead of failing silently. Invalid values fall back to safe defaults.
 */
export function normalizeConfig(input) {
  const config = defaultConfig();
  const errors = [];

  if (input === null || input === undefined) {
    return { config, errors };
  }

  if (typeof input !== 'object' || Array.isArray(input)) {
    errors.push('La configuración debe ser un objeto ModuleConfig.');
    return { config, errors };
  }

  if (input.moduleName !== undefined) {
    if (typeof input.moduleName !== 'string' || !input.moduleName.trim()) {
      errors.push('moduleName es obligatorio y debe ser un texto no vacío.');
    } else {
      config.moduleName = input.moduleName.trim();
    }
  }

  if (input.labels !== undefined) {
    if (input.labels === null || typeof input.labels !== 'object' || Array.isArray(input.labels)) {
      errors.push('labels debe ser un objeto de mapeos de términos.');
    } else {
      for (const key of LABEL_KEYS) {
        const value = input.labels[key];
        if (value === undefined) continue;
        if (typeof value !== 'string' || !value.trim()) {
          errors.push(`labels.${key} debe ser un texto no vacío.`);
        } else {
          config.labels[key] = value.trim();
        }
      }
    }
  }

  if (input.customFields !== undefined) {
    if (!Array.isArray(input.customFields)) {
      errors.push('customFields debe ser un arreglo de definiciones.');
    } else {
      const seen = new Set();
      config.customFields = [];
      input.customFields.forEach((field, index) => {
        const where = `customFields[${index}]`;
        if (!field || typeof field !== 'object' || Array.isArray(field)) {
          errors.push(`${where} debe ser un objeto.`);
          return;
        }
        const target = field.target;
        if (target !== 'entity' && target !== 'document') {
          errors.push(`${where}.target debe ser "entity" o "document".`);
          return;
        }
        if (typeof field.key !== 'string' || !field.key.trim()) {
          errors.push(`${where}.key debe ser un texto no vacío.`);
          return;
        }
        const key = field.key.trim();
        if (typeof field.label !== 'string' || !field.label.trim()) {
          errors.push(`${where}.label debe ser un texto no vacío.`);
          return;
        }
        if (!FIELD_TYPES.includes(field.type)) {
          errors.push(`${where}.type debe ser uno de: ${FIELD_TYPES.join(', ')}.`);
          return;
        }
        if (BASE_FIELDS[target].includes(key)) {
          errors.push(`La clave "${key}" choca con un campo base de ${target}.`);
          return;
        }
        const signature = `${target}:${key}`;
        if (seen.has(signature)) {
          errors.push(`La clave "${key}" está declarada más de una vez para ${target}.`);
          return;
        }
        seen.add(signature);

        const normalized = {
          target,
          key,
          label: field.label.trim(),
          type: field.type,
          required: Boolean(field.required)
        };
        if (field.type === 'select') {
          if (!Array.isArray(field.options) || field.options.length === 0) {
            errors.push(`El campo "${key}" de tipo select requiere options.`);
            return;
          }
          normalized.options = field.options
            .filter((option) => typeof option === 'string' && option.trim())
            .map((option) => option.trim());
          if (normalized.options.length === 0) {
            errors.push(`El campo "${key}" de tipo select requiere options.`);
            return;
          }
        }
        config.customFields.push(normalized);
      });
    }
  }

  if (input.statusLifecycle !== undefined) {
    if (input.statusLifecycle === null) {
      config.statusLifecycle = null;
    } else if (typeof input.statusLifecycle !== 'object' || Array.isArray(input.statusLifecycle)) {
      errors.push('statusLifecycle debe ser un objeto o null.');
    } else {
      const statuses = input.statusLifecycle.statuses;
      const transitions = input.statusLifecycle.transitions || {};
      if (
        !Array.isArray(statuses) ||
        statuses.length === 0 ||
        statuses.some((s) => typeof s !== 'string' || !s.trim())
      ) {
        errors.push('statusLifecycle.statuses debe ser un arreglo no vacío de textos.');
      } else if (typeof transitions !== 'object' || Array.isArray(transitions)) {
        errors.push('statusLifecycle.transitions debe ser un objeto.');
      } else {
        const cleanStatuses = statuses.map((s) => s.trim());
        const cleanTransitions = {};
        let lifecycleValid = true;
        for (const [from, tos] of Object.entries(transitions)) {
          if (!cleanStatuses.includes(from)) {
            errors.push(`statusLifecycle.transitions referencia el estado desconocido "${from}".`);
            lifecycleValid = false;
            continue;
          }
          if (!Array.isArray(tos)) {
            errors.push(`statusLifecycle.transitions.${from} debe ser un arreglo de estados.`);
            lifecycleValid = false;
            continue;
          }
          const cleanTargets = [];
          for (const to of tos) {
            if (!cleanStatuses.includes(to)) {
              errors.push(`statusLifecycle.transitions referencia el estado desconocido "${to}".`);
              lifecycleValid = false;
            } else if (!cleanTargets.includes(to)) {
              cleanTargets.push(to);
            }
          }
          cleanTransitions[from] = cleanTargets;
        }
        if (lifecycleValid) {
          for (const status of cleanStatuses) {
            if (!cleanTransitions[status]) cleanTransitions[status] = [];
          }
          config.statusLifecycle = { statuses: cleanStatuses, transitions: cleanTransitions };
        }
      }
    }
  }

  if (input.theme !== undefined) {
    if (input.theme === null) {
      // No theme block: keep the built-in accent.
    } else if (typeof input.theme !== 'object' || Array.isArray(input.theme)) {
      errors.push('theme debe ser un objeto.');
    } else if (input.theme.accentColor !== undefined) {
      if (
        typeof input.theme.accentColor !== 'string' ||
        !HEX_COLOR.test(input.theme.accentColor.trim())
      ) {
        errors.push('theme.accentColor debe ser un color hex válido (p. ej. #2563eb).');
      } else {
        config.theme.accentColor = input.theme.accentColor.trim();
      }
    }
  }

  if (input.rrhh !== undefined) {
    if (typeof input.rrhh === 'boolean') {
      config.rrhh.enabled = input.rrhh;
    } else if (input.rrhh === null) {
      config.rrhh.enabled = false;
    } else if (typeof input.rrhh !== 'object' || Array.isArray(input.rrhh)) {
      errors.push('rrhh debe ser un objeto o un booleano.');
    } else {
      if (input.rrhh.enabled !== undefined) {
        if (typeof input.rrhh.enabled !== 'boolean') {
          errors.push('rrhh.enabled debe ser un booleano.');
        } else {
          config.rrhh.enabled = input.rrhh.enabled;
        }
      }
      if (input.rrhh.label !== undefined) {
        if (typeof input.rrhh.label !== 'string' || !input.rrhh.label.trim()) {
          errors.push('rrhh.label debe ser un texto no vacío.');
        } else {
          config.rrhh.label = input.rrhh.label.trim();
        }
      }
      if (input.rrhh.roleSelector !== undefined) {
        config.rrhh.roleSelector = Boolean(input.rrhh.roleSelector);
      }
    }
  }

  if (input.empresa !== undefined) {
    if (input.empresa === null) {
      // Keep empty issuer defaults.
    } else if (typeof input.empresa !== 'object' || Array.isArray(input.empresa)) {
      errors.push('empresa debe ser un objeto.');
    } else {
      for (const key of ['razonSocial', 'rut', 'direccion', 'giro']) {
        const value = input.empresa[key];
        if (value === undefined) continue;
        if (typeof value !== 'string') {
          errors.push(`empresa.${key} debe ser un texto.`);
        } else {
          config.empresa[key] = value.trim();
        }
      }
    }
  }

  return { config, errors };
}

/** Load the module profile from the userConfig slot and normalize it. */
export async function loadModuleConfig() {
  return normalizeConfig(userConfig);
}

/** Make a normalized configuration the active one for the whole app. */
export function setActiveConfig(config) {
  activeConfig = config ? config : null;
}

/** Return the active configuration, falling back to built-in defaults. */
export function getConfig() {
  return activeConfig || defaultConfig();
}

/** Resolve a term from the active configuration, falling back to defaults. */
export function labelFor(key) {
  const config = getConfig();
  const labels = config && config.labels ? config.labels : {};
  return labels[key] || DEFAULT_CONFIG.labels[key] || key;
}
