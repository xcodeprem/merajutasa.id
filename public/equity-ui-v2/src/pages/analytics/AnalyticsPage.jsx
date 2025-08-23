import React, { Suspense, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWeeklyTrends, fetchEquityAnomalies } from '../../services/api';
import { adaptWeeklyTrends, adaptAnomalies } from '../../services/api/feed-adapters';
import { Card } from '../../components/Card';
import { useSnapshotSimulation } from './useSnapshotSimulation';

const TrendsChart = React.lazy(() => import('../../components/charts/TrendsChart').then(m => ({ default: m.TrendsChart })));
const AnomaliesChart = React.lazy(() => import('../../components/charts/AnomaliesChart').then(m => ({ default: m.AnomaliesChart })));

export default function AnalyticsPage() {
  const { data: weeklyRaw, isLoading: loadingWeekly } = useQuery({
    queryKey: ['weeklyTrends'],
    queryFn: fetchWeeklyTrends,
    staleTime: 5 * 60 * 1000,
  });
  const { data: anomaliesRaw, isLoading: loadingAnoms } = useQuery({
    queryKey: ['equityAnomalies'],
    queryFn: fetchEquityAnomalies,
    staleTime: 2 * 60 * 1000,
  });

  const weekly = useMemo(() => adaptWeeklyTrends(weeklyRaw), [weeklyRaw]);
  const anomalies = useMemo(() => adaptAnomalies(anomaliesRaw), [anomaliesRaw]);

  const sim = useSnapshotSimulation({
    frames: weekly?.weeks || [],
    intervalMs: 1000,
    getId: (f) => f?.week || 'Week',
  });

  const [trendDrill, setTrendDrill] = useState(null);
  const [anomDrill, setAnomDrill] = useState(null);

  const isReady = !loadingWeekly && !loadingAnoms;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Analytics</h2>

      {/* Snapshot simulation controls */}
      <Card title="Snapshot Simulation">
        <div className="flex items-center gap-2">
          <button
            onClick={sim.toggle}
            className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
          >
            {sim.playing ? 'Pause' : 'Play'}
          </button>
          <button onClick={() => sim.step(-1)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">
            Prev
          </button>
          <button onClick={() => sim.step(1)} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">
            Next
          </button>
          <button onClick={sim.reset} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">
            Reset
          </button>
          <span className="ml-3 text-sm text-gray-600 dark:text-gray-300">
            Current: {sim.currentFrame?.week || '-'}
          </span>
        </div>
      </Card>

      {/* Trends */}
      <Card title="Decision Trends">
        {!isReady ? (
          <div className="p-6 text-center text-gray-500">Loading trends…</div>
        ) : (
          <Suspense fallback={<div className="p-6 text-center text-gray-500">Preparing chart…</div>}>
            <TrendsChart weekly={weekly} onDrilldown={setTrendDrill} />
          </Suspense>
        )}
        {trendDrill && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Drilldown: {trendDrill.series} @ {trendDrill.label}
          </div>
        )}
      </Card>

      {/* Anomalies */}
      <Card title="Anomalies Overview">
        {!isReady ? (
          <div className="p-6 text-center text-gray-500">Loading anomalies…</div>
        ) : (
          <Suspense fallback={<div className="p-6 text-center text-gray-500">Preparing chart…</div>}>
            <AnomaliesChart anomalies={anomalies} onDrilldown={setAnomDrill} />
          </Suspense>
        )}
        {anomDrill && (
          <div className="mt-3 text-sm text-gray-600 dark:text-gray-300">
            Drilldown: {anomDrill.category} ({anomDrill.count})
          </div>
        )}
      </Card>
    </div>
  );
}
