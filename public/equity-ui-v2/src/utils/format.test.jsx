import { formatPercent } from './format.js';

describe('Format Utils', () => {
  test('formatPercent formats decimal to percentage', () => {
    expect(formatPercent(0.72)).toBe('72%');
    expect(formatPercent(0.8534)).toBe('85%');
    expect(formatPercent(1.0)).toBe('100%');
  });

  test('formatPercent handles null and undefined', () => {
    expect(formatPercent(null)).toBe('0%');
    expect(formatPercent(undefined)).toBe('0%');
    expect(formatPercent()).toBe('0%');
  });

  test('formatPercent handles edge cases', () => {
    expect(formatPercent(0)).toBe('0%');
    expect(formatPercent(0.005)).toBe('1%');
    expect(formatPercent(1.994)).toBe('199%');
  });
});