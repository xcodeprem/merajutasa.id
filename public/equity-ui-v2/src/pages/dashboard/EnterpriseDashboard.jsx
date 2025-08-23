import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardData } from '../../services/api';
import { useAppStore } from '../../stores/useAppStore';
import { QuickFilters } from './QuickFilters';
import { Card, DataCard } from '../../components/Card';
import { KPIChart, DecisionTrendsChart } from '../../components/Charts';

export function EnterpriseDashboard() {
  const { data: dashboardData } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: fetchDashboardData,
    refetchInterval: 30000,
    staleTime: 10000,
  });

  // Also read live store (WS updates)
  const kpiLive = useAppStore((s) => s.kpi);
  const weeklyLive = useAppStore((s) => s.weekly);
  const underServedLive = useAppStore((s) => s.underServed);
  const riskLive = useAppStore((s) => s.risk);
  const lastUpdated = useAppStore((s) => s.lastUpdated);

  const kpi = kpiLive || dashboardData?.kpi;
  const weekly = weeklyLive || dashboardData?.weekly;
  const underServed = underServedLive || dashboardData?.underServed;
  const risk = riskLive || dashboardData?.risk;
  const monthly = dashboardData?.monthly;

  const [filters, setFilters] = useState({ query: '', sort: 'desc', showAnomaliesOnly: false });

  const filteredUnderServed = useMemo(() => {
    if (!underServed?.groups) return [];
    let items = underServed.groups;
    if (filters.query) {
      const q = filters.query.toLowerCase();
      items = items.filter((g) => `${g.id || g.name || ''}`.toLowerCase().includes(q));
    }
    items = items.sort((a, b) =>
      filters.sort === 'asc' ? (a.value || 0) - (b.value || 0) : (b.value || 0) - (a.value || 0)
    );
    return items;
  }, [underServed, filters]);

  // KPI summary
  const kpiSummary = useMemo(
    () => ({
      decisionRate: kpi?.equity?.decision_rate ?? null,
      pos: kpi?.equity?.counts?.POS ?? null,
      bnd: kpi?.equity?.counts?.BND ?? null,
      neg: kpi?.equity?.counts?.NEG ?? null,
    }),
    [kpi]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Enterprise Dashboard
        </h1>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Live updated: {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'n/a'}
        </div>
      </div>

      {/* Quick filters */}
      <Card title="Quick Filters">
        <QuickFilters value={filters} onChange={setFilters} />
      </Card>

      {/* KPI + SLA + Risk */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="KPI Summary">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Decision Rate:</span>{' '}
              <strong>{kpiSummary.decisionRate ?? '—'}</strong>
            </div>
            <div>
              <span className="text-gray-500">POS:</span> <strong>{kpiSummary.pos ?? '—'}</strong>
            </div>
            <div>
              <span className="text-gray-500">BND:</span> <strong>{kpiSummary.bnd ?? '—'}</strong>
            </div>
            <div>
              <span className="text-gray-500">NEG:</span> <strong>{kpiSummary.neg ?? '—'}</strong>
            </div>
          </div>
          <div className="mt-4">
            <KPIChart kpiData={kpi} />
          </div>
        </Card>

        <Card title="SLA Status">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Collector</span>
              <span className="font-medium">{risk?.collector?.status ?? 'n/a'}</span>
            </div>
            <div className="flex justify-between">
              <span>Chain</span>
              <span className="font-medium">{risk?.chain?.status ?? 'n/a'}</span>
            </div>
            <div className="flex justify-between">
              <span>Privacy</span>
              <span className="font-medium">{risk?.privacy?.status ?? 'n/a'}</span>
            </div>
          </div>
        </Card>

        <Card title="Risk Digest">
          <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-48">
            {JSON.stringify(risk ?? {}, null, 2)}
          </pre>
        </Card>
      </div>

      {/* Live metrics and trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Decision Trends">
          {weekly ? (
            <DecisionTrendsChart weeklyData={weekly} />
          ) : (
            <div className="text-sm text-gray-500">No weekly data</div>
          )}
        </Card>
        <DataCard
          title="Under-served (filtered)"
          data={{ total: underServed?.total ?? 0, groups: filteredUnderServed }}
        />
      </div>

      {/* Monthly feedback (raw) */}
      <Card title="Monthly Feedback (raw)">
        <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto max-h-72">
          {JSON.stringify(monthly ?? {}, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
