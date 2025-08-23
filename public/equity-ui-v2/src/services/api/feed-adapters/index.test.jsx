import { describe, it, expect } from 'vitest';
import { adaptKPI, adaptWeeklyTrends, adaptUnderServed, adaptAnomalies, adaptRiskDigest } from './index';

describe('feed adapters', () => {
  it('adaptKPI returns equity and fairness objects', () => {
    expect(adaptKPI(null)).toEqual({ equity: {}, fairness: {} });
    expect(adaptKPI({ equity: { a: 1 }, fairness: { b: 2 } })).toEqual({ equity: { a: 1 }, fairness: { b: 2 } });
  });

  it('adaptWeeklyTrends normalizes weeks array and decision mix', () => {
    expect(adaptWeeklyTrends(null)).toEqual({ weeks: [], decision_mix: null });
    const input = { weeks: [{ w: 1 }], decision_mix: { counts: { POS: 1, NEG: 0, BND: 0 }, ratios: { POS: 1, NEG: 0, BND: 0 } } };
    expect(adaptWeeklyTrends(input)).toEqual(input);
  });

  it('adaptUnderServed ensures numeric total and groups array', () => {
    expect(adaptUnderServed(null)).toEqual({ total: 0, groups: [] });
    expect(adaptUnderServed({ total: 5, groups: [{ id: 'g1' }] })).toEqual({ total: 5, groups: [{ id: 'g1' }] });
  });

  it('adaptAnomalies returns array', () => {
    expect(adaptAnomalies(null)).toEqual([]);
    expect(adaptAnomalies([{ id: 1 }])).toEqual([{ id: 1 }]);
  });

  it('adaptRiskDigest returns keys with objects', () => {
    expect(adaptRiskDigest(null)).toEqual({ collector: {}, chain: {}, privacy: {} });
    const input = { collector: { status: 'healthy' }, chain: { status: 'healthy' }, privacy: { status: 'healthy' } };
    expect(adaptRiskDigest(input)).toEqual(input);
  });
});
