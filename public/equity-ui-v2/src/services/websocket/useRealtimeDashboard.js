import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createSocket } from './socket';
import { applyRealtimeToStore } from '../../stores/sync';

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
      // Update global store (normalized via adapters inside applyRealtimeToStore)
      applyRealtimeToStore(channel, payload);

      // Also update React Query cached dashboard data for existing consumers
      queryClient.setQueryData(['dashboardData'], (prev) => {
        const base = prev && typeof prev === 'object' ? prev : defaultState;
        const ts = new Date().toISOString();
        switch (channel) {
          case 'kpi':
            return { ...base, kpi: payload, lastUpdated: ts };
          case 'weekly_trends':
            return { ...base, weekly: payload, lastUpdated: ts };
          case 'under_served':
            return { ...base, underServed: payload, lastUpdated: ts };
          case 'equity_anomalies':
            return { ...base, anomalies: payload, lastUpdated: ts };
          case 'risk_digest':
            return { ...base, risk: payload, lastUpdated: ts };
          default:
            return { ...base, lastUpdated: ts };
        }
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
