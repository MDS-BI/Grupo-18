import { DEFAULT_CONFIG, getConfig } from '../../module-config.js';

export const DEFAULT_EMPRESA = {
  razonSocial: '',
  rut: '',
  direccion: '',
  giro: ''
};

/** Resolve the issuer data centrally, falling back to the module defaults. */
export function getEmpresa(config = getConfig()) {
  const configured = config?.empresa || {};
  const defaults = { ...DEFAULT_EMPRESA, ...(DEFAULT_CONFIG.empresa || {}) };
  return {
    razonSocial: configured.razonSocial ?? defaults.razonSocial,
    rut: configured.rut ?? defaults.rut,
    direccion: configured.direccion ?? defaults.direccion,
    giro: configured.giro ?? defaults.giro
  };
}

/** Whether enough issuer data exists to print a valid receipt. */
export function hasEmpresaData(empresa) {
  return Boolean(empresa && empresa.razonSocial && empresa.rut);
}

/** Non-empty company lines for the receipt header. */
export function empresaLines(empresa) {
  if (!empresa) return [];
  return [empresa.razonSocial, empresa.rut, empresa.direccion, empresa.giro].filter(Boolean);
}
