import { describe, it, expect } from 'vitest';
import { formatDate, formatFactor, formatMoney, formatPercent } from '../../src/utils/format.js';

describe('shared formatting helpers', () => {
  it('formats amounts as Chilean pesos', () => {
    expect(formatMoney(1200000)).toBe('$1.200.000');
    expect(formatMoney('1545000')).toBe('$1.545.000');
    expect(formatMoney(-2500)).toBe('-$2.500');
    expect(formatMoney(0)).toBe('$0');
    expect(formatMoney('no-es-numero')).toBe('—');
  });

  it('formats ISO dates for the Chilean UI', () => {
    expect(formatDate('2026-09-30')).toBe('30/09/2026');
    expect(formatDate(new Date('2026-01-05T00:00:00.000Z'))).toBe('05/01/2026');
    expect(formatDate('')).toBe('—');
    expect(formatDate('30-09-2026')).toBe('—');
  });

  it('formats percentages and factors with a decimal comma', () => {
    expect(formatPercent(0.105)).toBe('10,5%');
    expect(formatPercent(0.25)).toBe('25%');
    expect(formatFactor(1.5)).toBe('1,5');
    expect(formatPercent('x')).toBe('—');
  });
});
