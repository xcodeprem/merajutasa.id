import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './stores/ThemeContext';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import './services/i18n'; // Initialize i18n
import './App.css';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
          <Header />
          <Dashboard />
        </div>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
