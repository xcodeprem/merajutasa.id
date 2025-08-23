import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as socketModule from './socket';
import { useRealtimeDashboard } from './useRealtimeDashboard';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { render } from '@testing-library/react';

function Harness({ onReady }) {
  const qc = useQueryClient();
  onReady(qc);
  useRealtimeDashboard({ enabled: true, authToken: 'test' });
  return null;
}

describe('useRealtimeDashboard', () => {
  const disconnect = vi.fn();
  let emit;

  beforeEach(() => {
    vi.spyOn(socketModule, 'createSocket').mockImplementation(({ onEvent }) => {
      emit = (channel, payload) => onEvent?.(channel, payload);
      return { on: vi.fn(), disconnect };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('updates query cache on incoming events', async () => {
    const client = new QueryClient();
    let qc;
    render(
      <QueryClientProvider client={client}>
        <Harness onReady={(q) => { qc = q; }} />
      </QueryClientProvider>
    );

    // Seed cache
    qc.setQueryData(['dashboardData'], { kpi: null, weekly: null, underServed: null, anomalies: null, risk: null });

  // Simulate messages via captured onEvent
  emit('kpi', { equity: { rate: 0.9 }, fairness: {} });
  emit('weekly_trends', { weeks: [{ w: 1 }], decision_mix: null });
  emit('under_served', { total: 2, groups: [] });
  emit('equity_anomalies', [{ id: 1 }]);
  emit('risk_digest', { collector: {}, chain: {}, privacy: {} });

  const data = qc.getQueryData(['dashboardData']);
  expect(data.kpi).toBeTruthy();
  expect(data.kpi.equity.rate).toBe(0.9);
    expect(Array.isArray(data.weekly.weeks)).toBe(true);
    expect(data.underServed.total).toBe(2);
    expect(Array.isArray(data.anomalies)).toBe(true);
    expect(data.risk.collector).toBeDefined();
  });
});
