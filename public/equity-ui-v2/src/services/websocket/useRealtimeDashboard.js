import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSocket } from './socket';
import {
  adaptKPI,
  adaptWeeklyTrends,
  adaptUnderServed,
  adaptAnomalies,
  adaptRiskDigest,
} from '../api/feed-adapters';

const defaultState = {
  kpi: null,
  underServed: null,
  weekly: null,
  monthly: null,
  risk: null,
  anomalies: null,
  lastUpdated: null,
};

export function useRealtimeDashboard({ enabled = true, authToken, logger = console } = {}) {
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;

    const onEvent = (channel, payload) => {
      queryClient.setQueryData(['dashboardData'], (prev) => {
        const base = prev && typeof prev === 'object' ? prev : defaultState;
        let next = base;
        switch (channel) {
          case 'kpi':
            next = { ...base, kpi: adaptKPI(payload), lastUpdated: new Date().toISOString() };
            break;
          case 'weekly_trends':
            next = { ...base, weekly: adaptWeeklyTrends(payload), lastUpdated: new Date().toISOString() };
            break;
          case 'under_served':
            next = { ...base, underServed: adaptUnderServed(payload), lastUpdated: new Date().toISOString() };
            break;
          case 'equity_anomalies':
            next = { ...base, anomalies: adaptAnomalies(payload), lastUpdated: new Date().toISOString() };
            break;
          case 'risk_digest':
            next = { ...base, risk: adaptRiskDigest(payload), lastUpdated: new Date().toISOString() };
            break;
          default:
            next = base;
        }
        return next;
      });
    };

    socketRef.current = createSocket({ authToken, onEvent, logger });

    return () => {
      try {
        socketRef.current?.disconnect();
  } catch {
        // ignore cleanup errors
      }
      socketRef.current = null;
    };
  }, [enabled, authToken, queryClient, logger]);
}
