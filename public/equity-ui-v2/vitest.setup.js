import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { expect } from 'vitest';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Do not override window.location to avoid jsdom SecurityError; rely on mocks instead

// Ensure tests default to English translations and initialize i18n
try {
  window.localStorage.setItem('equity_ui_lang', 'en');
} catch {
  // ignore
}
import i18n from './src/services/i18n';
i18n.changeLanguage('en');

// Mock axios to avoid network requests during tests
vi.mock('axios', () => {
  const mockGet = vi.fn(async (url) => {
    // Return minimal dataset shapes used by components
    if (String(url).includes('/kpi/h1'))
      return { data: { fairness: { pass: true }, equity: { anomalies_count: 0 } } };
    if (String(url).includes('/under-served')) return { data: { total: 0, groups: [] } };
    if (String(url).includes('/kpi/weekly'))
      return {
        data: {
          decision_mix: { counts: { POS: 0, BND: 0, NEG: 0 }, ratios: { POS: 0, BND: 0, NEG: 0 } },
        },
      };
    if (String(url).includes('/feedback/monthly')) return { data: { months: [] } };
    if (String(url).includes('/risk/digest'))
      return { data: { collector: {}, chain: {}, privacy: {} } };
    if (String(url).includes('/equity/anomalies')) return { data: [] };
    if (String(url).includes('/revocations')) return { data: [] };
    if (String(url).includes('/health')) return { data: { ok: true } };
    return { data: {} };
  });
  const create = () => ({
    get: mockGet,
    post: vi.fn(async () => ({ data: { ok: true } })),
    interceptors: { request: { use: () => {} }, response: { use: () => {} } },
  });
  return { default: { create, get: mockGet } };
});
