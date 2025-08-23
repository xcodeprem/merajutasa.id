import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export function TrendsChart({ weekly, onDrilldown, className = '' }) {
  const { labels, datasets } = useMemo(() => {
    const weeks = weekly?.weeks?.filter((w) => w.decisions?.ratios) || [];
    const labels = weeks.map((w) => w.week || 'Week');
    const make = (key, color) => ({
      label: key,
      data: weeks.map((w) => (w.decisions.ratios[key] || 0) * 100),
      borderColor: color,
      backgroundColor: color,
      tension: 0.3,
      pointRadius: 3,
    });
    return {
      labels,
      datasets: [
        make('POS', '#16a34a'),
        make('BND', '#f59e0b'),
        make('NEG', '#dc2626'),
      ],
    };
  }, [weekly]);

  if (!labels || labels.length === 0) {
    return <div className={`p-4 text-center text-gray-500 ${className}`}>No trend data</div>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { callback: (v) => v + '%' } },
    },
    onClick: (evt, elements) => {
      if (!onDrilldown || !elements?.length) return;
      const { index, datasetIndex } = elements[0];
      onDrilldown({ label: labels[index], series: datasets[datasetIndex].label, index });
    },
  };

  return (
    <div className={`h-72 ${className}`}>
      <Line data={{ labels, datasets }} options={options} />
    </div>
  );
}
