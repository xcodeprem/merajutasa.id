import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../services/i18n';

// Mock API to return simple data
vi.mock('../../services/api', () => ({
  fetchWeeklyTrends: () => Promise.resolve({ weeks: [] }),
  fetchEquityAnomalies: () => Promise.resolve([]),
}));

// Mock charts (lazy-loaded) to simple divs
vi.mock('../../components/charts/TrendsChart', () => ({
  __esModule: true,
  default: () => <div>TrendsMock</div>,
  TrendsChart: () => <div>TrendsMock</div>,
}));
vi.mock('../../components/charts/AnomaliesChart', () => ({
  __esModule: true,
  default: () => <div>AnomaliesMock</div>,
  AnomaliesChart: () => <div>AnomaliesMock</div>,
}));

import AnalyticsPage from './AnalyticsPage';

function renderWithQuery(ui) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('AnalyticsPage', () => {
  it('renders snapshot controls and charts', async () => {
    renderWithQuery(<AnalyticsPage />);
    // Snapshot controls (title localized)
    expect(screen.getByText(/Snapshot Simulation|Simulasi Snapshot/i)).toBeInTheDocument();
    // Play/Pause button localized
    expect(screen.getByRole('button', { name: /Play|Pause|Putar|Jeda/i })).toBeInTheDocument();

    // Lazy charts appear after suspense
    await waitFor(() => expect(screen.getByText('TrendsMock')).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText('AnomaliesMock')).toBeInTheDocument());
  });
});
