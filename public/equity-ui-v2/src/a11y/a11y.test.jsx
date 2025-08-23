import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../stores/ThemeContext';
import '../services/i18n';
import { Dashboard } from '../components/Dashboard';

const lazy = (loader) => React.lazy(loader);
const AnalyticsPage = lazy(() => import('../pages/analytics/AnalyticsPage'));
const CompliancePage = lazy(() => import('../pages/compliance/CompliancePage'));
const SettingsPage = lazy(() => import('../pages/settings/SettingsPage'));

function Wrapper({ children }) {
  const queryClient = new QueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <React.Suspense fallback={<div>Loading…</div>}>{children}</React.Suspense>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Accessibility (axe) - unit', () => {
  it('Dashboard has no obvious a11y violations', async () => {
    const { container } = render(
      <Wrapper>
        <Dashboard />
      </Wrapper>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('AnalyticsPage has no obvious a11y violations', async () => {
    const { container } = render(
      <Wrapper>
        <AnalyticsPage />
      </Wrapper>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('CompliancePage has no obvious a11y violations', async () => {
    const { container } = render(
      <Wrapper>
        <CompliancePage />
      </Wrapper>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('SettingsPage has no obvious a11y violations', async () => {
    const { container } = render(
      <Wrapper>
        <SettingsPage />
      </Wrapper>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
