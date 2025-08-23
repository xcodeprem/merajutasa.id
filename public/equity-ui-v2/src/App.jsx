import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './stores/ThemeContext';
import { Header } from './components/Header';
import ErrorBoundary from './components/ErrorBoundary';
import { Dashboard } from './components/Dashboard';
import './services/i18n'; // Initialize i18n
import { useTranslation } from 'react-i18next';
import './App.css';
import { useRealtimeDashboard } from './services/websocket/useRealtimeDashboard';
import { useAuth } from './services/auth/useAuth';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RealtimeRoot() {
  const { t } = useTranslation();
  useRealtimeDashboard({ enabled: true });
  const { isAuthenticated } = useAuth();
  const [hash, setHash] = React.useState(() => window.location.hash);
  React.useEffect(() => {
    const onHash = () => setHash(window.location.hash);
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const isAnalytics = hash === '#/analytics';
  const isCompliance = hash === '#/compliance';
  const isSettings = hash === '#/settings';
  const AnalyticsPage = React.useMemo(
    () => React.lazy(() => import('./pages/analytics/AnalyticsPage')),
    []
  );
  const CompliancePage = React.useMemo(
    () => React.lazy(() => import('./pages/compliance/CompliancePage')),
    []
  );
  const SettingsPage = React.useMemo(
    () => React.lazy(() => import('./pages/settings/SettingsPage')),
    []
  );

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Header />
        <ErrorBoundary>
          <React.Suspense
            fallback={<div className="p-6 text-center text-gray-500">{t('common.loading')}</div>}
          >
            {isSettings ? (
              <SettingsPage />
            ) : isCompliance ? (
              isAuthenticated ? (
                <CompliancePage />
              ) : (
                <SettingsPage />
              )
            ) : isAnalytics ? (
              isAuthenticated ? (
                <AnalyticsPage />
              ) : (
                <SettingsPage />
              )
            ) : (
              <Dashboard />
            )}
          </React.Suspense>
        </ErrorBoundary>
      </div>
    </ThemeProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RealtimeRoot />
    </QueryClientProvider>
  );
}

export default App;
