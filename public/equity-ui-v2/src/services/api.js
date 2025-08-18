// API service for connecting to live infrastructure APIs
import axios from 'axios';

const isOnPages = () => {
  return typeof window !== 'undefined' && /github\.io/.test(location.host);
};

// API endpoint mapping for different environments
const API_ENDPOINTS = {
  '/kpi/h1': isOnPages() ? 'data/h1-kpi-summary.json' : '/kpi/h1',
  '/kpi/weekly': isOnPages() ? 'data/weekly-trends.json' : '/kpi/weekly', 
  '/under-served': isOnPages() ? 'data/under-served.json' : '/under-served',
  '/equity/anomalies': isOnPages() ? 'data/equity-anomalies.json' : '/equity/anomalies',
  '/revocations': isOnPages() ? 'data/revocations.json' : '/revocations',
  '/feedback/monthly': isOnPages() ? 'data/feedback-monthly-rollup.json' : '/feedback/monthly',
  '/risk/digest': isOnPages() ? 'data/risk-digest.json' : '/risk/digest',
  '/health': '/health'
};

// Create axios instance with base configuration
const api = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API functions
export const healthCheck = async () => {
  if (isOnPages()) {
    return { ok: true }; // Skip health check on GitHub Pages
  }
  const response = await api.get(API_ENDPOINTS['/health']);
  return response.data;
};

export const fetchKPIData = async () => {
  const response = await api.get(API_ENDPOINTS['/kpi/h1']);
  return response.data;
};

export const fetchUnderServedData = async () => {
  const response = await api.get(API_ENDPOINTS['/under-served']);
  return response.data;
};

export const fetchWeeklyTrends = async () => {
  const response = await api.get(API_ENDPOINTS['/kpi/weekly']);
  return response.data;
};

export const fetchMonthlyFeedback = async () => {
  const response = await api.get(API_ENDPOINTS['/feedback/monthly']);
  return response.data;
};

export const fetchRiskDigest = async () => {
  const response = await api.get(API_ENDPOINTS['/risk/digest']);
  return response.data;
};

export const fetchEquityAnomalies = async () => {
  const response = await api.get(API_ENDPOINTS['/equity/anomalies']);
  return response.data;
};

export const fetchRevocations = async () => {
  const response = await api.get(API_ENDPOINTS['/revocations']);
  return response.data;
};

// Combined data fetcher for dashboard
export const fetchDashboardData = async () => {
  try {
    // Check health first (skip on Pages)
    if (!isOnPages()) {
      await healthCheck();
    }

    const [kpi, underServed, weekly, monthly, risk] = await Promise.allSettled([
      fetchKPIData(),
      fetchUnderServedData(),
      fetchWeeklyTrends(),
      fetchMonthlyFeedback(),
      fetchRiskDigest(),
    ]);

    return {
      kpi: kpi.status === 'fulfilled' ? kpi.value : null,
      underServed: underServed.status === 'fulfilled' ? underServed.value : null,
      weekly: weekly.status === 'fulfilled' ? weekly.value : null,
      monthly: monthly.status === 'fulfilled' ? monthly.value : null,
      risk: risk.status === 'fulfilled' ? risk.value : null,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error('[API] Dashboard data fetch error:', error);
    throw error;
  }
};