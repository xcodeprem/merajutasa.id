import { useEffect } from 'react';
import { useAppStore } from './useAppStore';
import {
  adaptKPI,
  adaptWeeklyTrends,
  adaptUnderServed,
  adaptAnomalies,
  adaptRiskDigest,
} from '../services/api/feed-adapters';

export function useSyncDashboardToStore(dashboardData) {
  const hydrate = useAppStore((s) => s.hydrateFromDashboard);
  useEffect(() => {
    if (!dashboardData) return;
    hydrate({
      kpi: dashboardData.kpi ? adaptKPI(dashboardData.kpi) : null,
      weekly: dashboardData.weekly ? adaptWeeklyTrends(dashboardData.weekly) : null,
      underServed: dashboardData.underServed ? adaptUnderServed(dashboardData.underServed) : null,
      anomalies: dashboardData.anomalies ? adaptAnomalies(dashboardData.anomalies) : null,
      risk: dashboardData.risk ? adaptRiskDigest(dashboardData.risk) : null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(dashboardData)]);
}

export function applyRealtimeToStore(channel, payload) {
  const setKpi = useAppStore.getState().setKpi;
  const setWeekly = useAppStore.getState().setWeekly;
  const setUnderServed = useAppStore.getState().setUnderServed;
  const setAnomalies = useAppStore.getState().setAnomalies;
  const setRisk = useAppStore.getState().setRisk;

  switch (channel) {
    case 'kpi':
      setKpi(adaptKPI(payload));
      break;
    case 'weekly_trends':
      setWeekly(adaptWeeklyTrends(payload));
      break;
    case 'under_served':
      setUnderServed(adaptUnderServed(payload));
      break;
    case 'equity_anomalies':
      setAnomalies(adaptAnomalies(payload));
      break;
    case 'risk_digest':
      setRisk(adaptRiskDigest(payload));
      break;
    default:
      break;
  }
}
