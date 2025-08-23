// Badge components for KPI display
import React from 'react';
import { useTranslation } from 'react-i18next';

export const KPIBadge = ({ label, value, type = 'default', className = '' }) => {
  const getStatusColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()} ${className}`}
      role="status"
      aria-label={`${label}: ${value}`}
    >
      {label}: {value}
    </span>
  );
};

export const KPIBadges = ({ kpiData, underServedData }) => {
  const { t } = useTranslation();

  const fairnessStatus = kpiData?.fairness?.pass ? 'PASS' : 'FAIL';
  const fairnessType = kpiData?.fairness?.pass ? 'success' : 'error';

  const underServedCount = underServedData?.total ?? 'n/a';
  const anomaliesCount = kpiData?.equity?.anomalies_count ?? 'n/a';

  return (
    <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="KPI Status Indicators">
      <KPIBadge label={t('badge.fairness')} value={fairnessStatus} type={fairnessType} />
      <KPIBadge
        label={t('badge.under')}
        value={underServedCount}
        type={underServedCount === 'n/a' ? 'warning' : 'default'}
      />
      <KPIBadge
        label={t('badge.anoms')}
        value={anomaliesCount}
        type={anomaliesCount > 0 ? 'warning' : 'success'}
      />
      <KPIBadge label={t('badge.revoc')} value="0" type="success" />
    </div>
  );
};
