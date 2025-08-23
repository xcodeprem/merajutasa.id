import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EnterpriseDashboard } from './EnterpriseDashboard';

describe('EnterpriseDashboard', () => {
  it('renders headers and sections', () => {
    const client = new QueryClient();
    const { getByText } = render(
      <QueryClientProvider client={client}>
        <EnterpriseDashboard />
      </QueryClientProvider>
    );

    expect(getByText('Enterprise Dashboard')).toBeTruthy();
    expect(getByText('Quick Filters')).toBeTruthy();
    expect(getByText('KPI Summary')).toBeTruthy();
    expect(getByText('SLA Status')).toBeTruthy();
    expect(getByText('Risk Digest')).toBeTruthy();
  });
});
