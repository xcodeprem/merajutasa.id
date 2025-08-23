import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// Lightly persist only auth and settings
const persistConfig = {
  name: 'equity-ui-v2',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({
    auth: state.auth,
    settings: state.settings,
  }),
};

export const useAppStore = create(
  persist(
    (set) => ({
      // Dashboard data modules
      kpi: null,
      weekly: null,
      underServed: null,
      anomalies: null,
      risk: null,
      lastUpdated: null,

      // Auth and settings
      auth: { token: null, apiKey: null },
      settings: { theme: 'system', locale: 'en', liveUpdates: true },

      // Actions
      setKpi: (kpi) => set({ kpi, lastUpdated: new Date().toISOString() }),
      setWeekly: (weekly) => set({ weekly, lastUpdated: new Date().toISOString() }),
      setUnderServed: (underServed) => set({ underServed, lastUpdated: new Date().toISOString() }),
      setAnomalies: (anomalies) => set({ anomalies, lastUpdated: new Date().toISOString() }),
      setRisk: (risk) => set({ risk, lastUpdated: new Date().toISOString() }),
      hydrateFromDashboard: (data) =>
        set((s) => ({
          kpi: data?.kpi ?? s.kpi,
          weekly: data?.weekly ?? s.weekly,
          underServed: data?.underServed ?? s.underServed,
          anomalies: data?.anomalies ?? s.anomalies,
          risk: data?.risk ?? s.risk,
          lastUpdated: new Date().toISOString(),
        })),

      setAuthToken: (token) => set((s) => ({ auth: { ...s.auth, token } })),
      setApiKey: (apiKey) => set((s) => ({ auth: { ...s.auth, apiKey } })),
      clearAuth: () => set({ auth: { token: null, apiKey: null } }),

      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    persistConfig
  )
);
