import { render, screen } from '@testing-library/react';
import React from 'react';
import App from './App';

// Simple smoke test to ensure app renders header text
it('renders dashboard title', async () => {
  render(<App />);
  const heading = await screen.findByRole('heading', { name: /dashboard/i });
  expect(heading).toBeInTheDocument();
});
