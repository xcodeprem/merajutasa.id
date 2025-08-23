// Chart component using Chart.js for advanced visualization
import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement
);

export const DecisionTrendsChart = ({ weeklyData, className = '' }) => {
  if (!weeklyData?.weeks || weeklyData.weeks.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No trend data available
      </div>
    );
  }

  const weeks = weeklyData.weeks.filter(w => w.decisions && w.decisions.ratios);
  
  if (weeks.length === 0) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No decision trend data available
      </div>
    );
  }

  const data = {
    labels: weeks.map(w => w.week || 'Week'),
    datasets: [
      {
        label: 'POS',
        data: weeks.map(w => (w.decisions.ratios.POS || 0) * 100),
        borderColor: '#2b8a3e',
        backgroundColor: 'rgba(43, 138, 62, 0.1)',
        tension: 0.3,
      },
      {
        label: 'BND',
        data: weeks.map(w => (w.decisions.ratios.BND || 0) * 100),
        borderColor: '#f59f00',
        backgroundColor: 'rgba(245, 159, 0, 0.1)',
        tension: 0.3,
      },
      {
        label: 'NEG',
        data: weeks.map(w => (w.decisions.ratios.NEG || 0) * 100),
        borderColor: '#e03131',
        backgroundColor: 'rgba(224, 49, 49, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
    },
  };

  return (
    <div className={`h-64 ${className}`}>
      <Line data={data} options={options} />
    </div>
  );
};

export const KPIChart = ({ kpiData, className = '' }) => {
  if (!kpiData) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        No KPI data available
      </div>
    );
  }

  const equity = kpiData.equity || {};
  
  const data = {
    labels: ['Anomalies', 'Under-served', 'Total Units'],
    datasets: [
      {
        label: 'Count',
        data: [
          equity.anomalies_count || 0,
          equity.under_served_count || 0,
          equity.total_units || 0,
        ],
        backgroundColor: [
          'rgba(224, 49, 49, 0.8)',
          'rgba(245, 159, 0, 0.8)',
          'rgba(43, 138, 62, 0.8)',
        ],
        borderColor: [
          '#e03131',
          '#f59f00',
          '#2b8a3e',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className={`h-64 ${className}`}>
      <Bar data={data} options={options} />
    </div>
  );
};