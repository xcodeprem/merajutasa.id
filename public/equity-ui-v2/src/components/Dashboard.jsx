// Main dashboard component
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { fetchDashboardData } from '../services/api';
import { KPIBadges } from './KPIBadges';
import { Card, DataCard } from './Card';
import { DecisionTrendsChart, KPIChart } from './Charts';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { useSyncDashboardToStore } from '../stores/sync';

export const Dashboard = () => {
  const { t } = useTranslation();

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000, // Refetch every 30 seconds for real-time data
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Always call at top-level; internal effect guards undefined
  useSyncDashboardToStore(dashboardData);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('error')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {error.message || 'Failed to load dashboard data'}
          </p>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </button>
        </div>
      </div>
    );
  }

  const { kpi, underServed, weekly, monthly, risk } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        {t('accessibility.skipToContent')}
      </a>

      {/* Main content */}
      <main id="main-content">
        {/* KPI Badges */}
        <KPIBadges kpiData={kpi} underServedData={underServed} />

        {/* Last updated info with refresh button */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t('label.updated')} {dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleString() : 'n/a'}
          </div>
          <button
            onClick={handleRefresh}
            className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            aria-label="Refresh data"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>

        {/* Charts and data grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Under-served data */}
          <DataCard
            title={t('heading.under')}
            data={underServed || { error: 'missing under-served' }}
          />

          {/* KPI Summary */}
          <DataCard title={t('heading.kpi')} data={kpi || { error: 'missing kpi' }} />
        </div>

        {/* Weekly trends with chart */}
        <div className="mb-6">
          <Card title={t('heading.weekly')} className="h-auto">
            {weekly ? (
              <div className="space-y-4">
                {/* Decision trends chart */}
                <DecisionTrendsChart weeklyData={weekly} />

                {/* Decision mix badges */}
                {weekly.decision_mix && (
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      POS: {weekly.decision_mix.counts.POS} (
                      {Math.round(weekly.decision_mix.ratios.POS * 100)}%)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                      BND: {weekly.decision_mix.counts.BND} (
                      {Math.round(weekly.decision_mix.ratios.BND * 100)}%)
                    </span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                      NEG: {weekly.decision_mix.counts.NEG} (
                      {Math.round(weekly.decision_mix.ratios.NEG * 100)}%)
                    </span>
                  </div>
                )}

                {/* Raw data */}
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    View raw data
                  </summary>
                  <pre className="mt-2 bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(weekly, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                {t('decision.mix.na')}
              </p>
            )}
          </Card>
        </div>

        {/* Monthly feedback and KPI chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Monthly feedback */}
          <Card title={t('heading.monthly')}>
            {monthly && Array.isArray(monthly.months) && monthly.months.length > 0 ? (
              <div className="space-y-4">
                {/* Latest month summary */}
                {(() => {
                  const latest = monthly.months[monthly.months.length - 1];
                  const cats = latest.categories || {};
                  const pii = latest.pii || {};
                  const fmt = (o) =>
                    Object.keys(o)
                      .sort()
                      .map((k) => `${k.toUpperCase()}: ${o[k]}`)
                      .join(' · ');

                  return (
                    <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                      <div className="mb-2">
                        <strong>{t('monthly.latest')}</strong>: {latest.month}
                      </div>
                      <div className="mb-2">
                        {t('monthly.total')}: <strong>{latest.total}</strong> ·{' '}
                        {t('monthly.avglen')}: {latest.avg_len}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        {t('monthly.categories')}: {fmt(cats) || '—'}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {t('monthly.pii')}: {fmt(pii) || '—'}
                      </div>
                    </div>
                  );
                })()}

                {/* Raw data */}
                <details>
                  <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                    View raw data
                  </summary>
                  <pre className="mt-2 bg-gray-50 dark:bg-gray-900 p-3 rounded text-sm overflow-auto max-h-64 whitespace-pre-wrap">
                    {JSON.stringify(monthly, null, 2)}
                  </pre>
                </details>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No monthly feedback data yet
              </p>
            )}
          </Card>

          {/* KPI Chart */}
          <Card title="KPI Visualization">
            <KPIChart kpiData={kpi} />
          </Card>
        </div>

        {/* Risk digest */}
        {risk && (
          <Card title={t('risk.title')}>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('risk.collector')}:</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    risk.collector?.status === 'healthy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {risk.collector?.status || 'n/a'}
                  {risk.collector?.success_rate_pct != null &&
                    ` (${risk.collector.success_rate_pct}% success)`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('risk.chain')}:</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    risk.chain?.status === 'healthy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {risk.chain?.status || 'n/a'}
                  {risk.chain?.mismatches != null && ` (mismatches: ${risk.chain.mismatches})`}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">{t('risk.privacy')}:</span>
                <span
                  className={`px-2 py-1 rounded text-sm ${
                    risk.privacy?.status === 'healthy'
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}
                >
                  {risk.privacy?.status || 'n/a'}
                  {risk.privacy?.pii_high_risk_hits != null &&
                    ` (high-risk: ${risk.privacy.pii_high_risk_hits})`}
                </span>
              </div>
            </div>
          </Card>
        )}

        {/* GitHub Pages note */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400 text-center">
          <p>
            Note: On GitHub Pages, data loads from{' '}
            <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">data/*.json</code>{' '}
            snapshots.
            <span className="ml-2">
              <a
                href="/equity-ui/snapshots.html"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
              >
                {t('snapshots.index')}
              </a>
            </span>
          </p>
        </div>
      </main>
    </div>
  );
};
