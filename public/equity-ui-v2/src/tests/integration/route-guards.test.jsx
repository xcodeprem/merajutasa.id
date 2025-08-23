import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../services/i18n';
import App from '../../App.jsx';

vi.mock('../../services/auth/tokenManager', async (orig) => {
  const mod = await orig();
  return {
    ...mod,
    getAccessToken: () => null,
  };
});

describe('Route guards', () => {
  it('redirects Analytics to Settings when unauthenticated', async () => {
    window.location.hash = '#/analytics';
    render(<App />);
    expect(await screen.findByText(/Settings|Pengaturan/)).toBeInTheDocument();
  });

  it('redirects Compliance to Settings when unauthenticated', async () => {
    window.location.hash = '#/compliance';
    render(<App />);
    expect(await screen.findByText(/Settings|Pengaturan/)).toBeInTheDocument();
  });
});
