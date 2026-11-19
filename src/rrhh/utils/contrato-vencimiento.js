import { diasHastaVencimiento } from './alertas-service.js';

export function isContratAtencion(contrato) {
  if (!contrato || contrato.estado !== 'Vigente') return false;
  const d = diasHastaVencimiento(contrato.fechaTermino);
  if (d === null) return false;
  return d <= 30;
}
