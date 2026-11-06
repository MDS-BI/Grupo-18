/** Chilean RUT helpers: normalization, check digit and validation. */

export function limpiarRut(value) {
  return String(value || '').replace(/[.\-\s]/g, '').toUpperCase();
}

/** Compute the module-11 check digit for a RUT body. */
export function calcularDigitoVerificador(body) {
  const digits = String(body || '').replace(/\D/g, '');
  if (!digits) return '';
  let sum = 0;
  let multiplier = 2;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    sum += Number(digits[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return String(remainder);
}

/** Split a RUT into body and check digit, accepting dots and hyphens. */
export function separarRut(value) {
  const clean = limpiarRut(value);
  if (clean.length < 2) return { body: clean, dv: '' };
  return { body: clean.slice(0, -1), dv: clean.slice(-1) };
}

export function formatearRut(value) {
  const { body, dv } = separarRut(value);
  if (!body) return '';
  const grouped = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${grouped}-${dv}`;
}

/** Validate format, numeric body and check digit. */
export function validarRut(value) {
  const { body, dv } = separarRut(value);
  if (!/^\d{1,8}$/.test(body) || !dv) return false;
  if (Number(body) <= 0) return false;
  return calcularDigitoVerificador(body) === dv;
}

export function assertRutValido(value) {
  if (!validarRut(value)) {
    const error = new Error(`RUT inválido: ${value || '(vacío)'} no tiene un dígito verificador válido.`);
    error.code = 'RUT_INVALIDO';
    throw error;
  }
  return formatearRut(value);
}
