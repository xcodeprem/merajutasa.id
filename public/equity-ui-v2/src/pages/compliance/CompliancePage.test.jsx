import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import '../../services/i18n';

vi.mock('../../services/api', () => ({
  apiGateway: {
    getHealth: () => Promise.resolve({ ok: true }),
    getServices: () => Promise.resolve([{ name: 'signer' }]),
    getChainHead: () => Promise.resolve({ seq: 1 }),
  },
}));

import CompliancePage from './CompliancePage';

function renderWithQuery(ui) {
  const qc = new QueryClient();
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

describe('CompliancePage', () => {
  it('renders audit signals and disclaimers', async () => {
    renderWithQuery(<CompliancePage />);
    await screen.findByText(/Audit Signals/i);
    // Disclaimers section exists
    await screen.findByTestId('disclaimers');
  });
});
