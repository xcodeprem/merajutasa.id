import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from './useAppStore';

describe('useAppStore', () => {
  beforeEach(() => {
    // reset store between tests
    useAppStore.setState({
      kpi: null,
      weekly: null,
      underServed: null,
      anomalies: null,
      risk: null,
      lastUpdated: null,
      auth: { token: null, apiKey: null },
      settings: { theme: 'system', locale: 'en', liveUpdates: true },
    });
  });

  it('updates modules via actions', () => {
    useAppStore.getState().setKpi({ equity: { rate: 1 } });
    useAppStore.getState().setWeekly({ weeks: [1] });
    useAppStore.getState().setUnderServed({ total: 2, groups: [] });
    useAppStore.getState().setAnomalies([{ id: 1 }]);
    useAppStore.getState().setRisk({ collector: {} });
    const v = useAppStore.getState();
    expect(v.kpi.equity.rate).toBe(1);
    expect(v.weekly.weeks[0]).toBe(1);
    expect(v.underServed.total).toBe(2);
    expect(Array.isArray(v.anomalies)).toBe(true);
    expect(v.risk.collector).toBeDefined();
  });

  it('auth and settings persistence setters', () => {
    useAppStore.getState().setAuthToken('t');
    useAppStore.getState().setApiKey('k');
    useAppStore.getState().updateSettings({ theme: 'dark', locale: 'id' });
    const v = useAppStore.getState();
    expect(v.auth.token).toBe('t');
    expect(v.auth.apiKey).toBe('k');
    expect(v.settings.theme).toBe('dark');
    expect(v.settings.locale).toBe('id');
  });
});
