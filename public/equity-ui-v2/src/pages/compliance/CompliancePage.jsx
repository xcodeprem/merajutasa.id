import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, DataCard } from '../../components/Card';
import Disclaimers from '../../components/Disclaimers';
import { apiGateway } from '../../services/api';

function useAuditSignals() {
  // Reuse gateway endpoints as proxy for compliance signals
  const health = useQuery({ queryKey: ['gatewayHealth'], queryFn: () => apiGateway.getHealth() });
  const services = useQuery({ queryKey: ['gatewayServices'], queryFn: () => apiGateway.getServices() });
  const chainHead = useQuery({ queryKey: ['chainHead'], queryFn: () => apiGateway.getChainHead() });
  return { health, services, chainHead };
}

export default function CompliancePage() {
  const { health, services, chainHead } = useAuditSignals();
  const loading = health.isLoading || services.isLoading || chainHead.isLoading;

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Compliance</h2>

      <Card title="Audit Signals" loading={loading}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <DataCard title="Gateway Health" data={health.data} />
          <DataCard title="Services" data={services.data} />
          <DataCard title="Chain Head" data={chainHead.data} />
        </div>
      </Card>

      <Card title="Non-ranking Copy & Disclaimers">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          This application avoids ranking, scoring, or ordinal comparisons of people or groups. All
          visuals are descriptive aggregates for governance and fairness review.
        </p>
        <Disclaimers pageId="compliance" />
      </Card>
    </div>
  );
}
