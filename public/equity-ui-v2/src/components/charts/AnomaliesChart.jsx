import React, { useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export function AnomaliesChart({ anomalies, onDrilldown, className = '' }) {
  const grouped = useMemo(() => {
    const arr = Array.isArray(anomalies) ? anomalies : [];
    const map = arr.reduce((acc, a) => {
      const k = a?.category || 'unknown';
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {});
    const labels = Object.keys(map);
    const values = labels.map((l) => map[l]);
    return { labels, values };
  }, [anomalies]);

  if (!grouped.labels || grouped.labels.length === 0) {
    return <div className={`p-4 text-center text-gray-500 ${className}`}>No anomalies</div>;
  }

  const data = {
    labels: grouped.labels,
    datasets: [
      {
        label: 'Anomalies',
        data: grouped.values,
        backgroundColor: 'rgba(220, 38, 38, 0.7)',
        borderColor: '#b91c1c',
      },
    ],
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    onClick: (evt, elements) => {
      if (!onDrilldown || !elements?.length) return;
      const { index } = elements[0];
      onDrilldown({ category: data.labels[index], count: data.datasets[0].data[index], index });
    },
  };

  return (
    <div className={`h-72 ${className}`}>
      <Bar data={data} options={options} />
    </div>
  );
}
