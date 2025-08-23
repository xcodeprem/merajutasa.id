import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Card, DataCard } from '../../components/Card';
import Disclaimers from '../../components/Disclaimers';
import { apiGateway } from '../../services/api';

function useAuditSignals() {
  // Reuse gateway endpoints as proxy for compliance signals
  const health = useQuery({ queryKey: ['gatewayHealth'], queryFn: () => apiGateway.getHealth() });
  const services = useQuery({
    queryKey: ['gatewayServices'],
    queryFn: () => apiGateway.getServices(),
  });
  const chainHead = useQuery({ queryKey: ['chainHead'], queryFn: () => apiGateway.getChainHead() });
  return { health, services, chainHead };
}

export default function CompliancePage() {
  const { t } = useTranslation();
  const { health, services, chainHead } = useAuditSignals();
  const loading = health.isLoading || services.isLoading || chainHead.isLoading;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6" role="main">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {t('compliance.title')}
      </h2>

      <Card title={t('compliance.audit_signals')} loading={loading}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DataCard title={t('compliance.gateway_health')} data={health.data} />
          <DataCard title={t('compliance.services')} data={services.data} />
          <DataCard title={t('compliance.chain_head')} data={chainHead.data} />
        </div>
      </Card>

      <Card title={t('compliance.non_ranking')}>
        <p className="text-sm text-gray-700 dark:text-gray-200">
          {t('compliance.non_ranking_copy')}
        </p>
        <Disclaimers pageId="compliance" />
      </Card>
    </div>
  );
}
