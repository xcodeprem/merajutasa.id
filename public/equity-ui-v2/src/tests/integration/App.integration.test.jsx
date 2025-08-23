import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../services/i18n';
import App from '../../App.jsx';

// Basic integration smoke: verifies routing and lazy pages mount
describe('App integration', () => {
  it('renders Dashboard by default', async () => {
    window.location.hash = '';
    render(<App />);
    // Header exists
    expect(await screen.findByRole('banner')).toBeInTheDocument();
    // Dashboard KPI card title (localized)
    expect(await screen.findByText(/KPI Visualization|Visualisasi KPI/i)).toBeInTheDocument();
  });

  it('navigates to Analytics via hash', async () => {
    window.location.hash = '#/analytics';
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Analytics|Tren Keputusan|Decision Trends/i)).toBeInTheDocument();
    });
  });

  it('guards Compliance behind settings when no token', async () => {
    window.localStorage.removeItem('equity_access_token');
    window.location.hash = '#/compliance';
    render(<App />);
    // Should render Settings page title
    expect(await screen.findByText(/Settings|Pengaturan/)).toBeInTheDocument();
  });
});
