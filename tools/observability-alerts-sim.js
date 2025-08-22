/**
 * Simulate observability metrics and trigger alert rules.
 * Writes artifacts for rules and alert firing evidence.
 */
import fs from 'fs/promises';
import path from 'path';
import { getAdvancedObservabilitySystem, initializeObservability } from '../infrastructure/observability/advanced-observability-system.js';

function flattenMetricValues(metricsJson) {
  const flat = {};
  for (const m of metricsJson.metrics || []) {
    const name = m.name || m.help || 'unknown_metric';
    // derive a simple latest value where possible
    let latestVal = null;
    if (Array.isArray(m.values) && m.values.length > 0) {
      latestVal = m.values[m.values.length - 1].value;
    }
    // also mirror common aliases
    if (name.includes('service_health_status')) flat.service_health_status = latestVal ?? 1;
    if (name.includes('error_rate')) flat.error_rate = latestVal ?? 0;
    if (name.includes('chain_integrity_score')) flat.chain_integrity_score = latestVal ?? 100;
    if (name.includes('cpu_usage_percent')) flat.cpu_usage_percent = latestVal ?? 10;
    if (name.includes('memory_usage_percent')) flat.memory_usage_percent = latestVal ?? 10;
  }
  // add some synthetic rollups commonly used by dashboards
  flat.avg_response_time = flat.avg_response_time ?? 50;
  return flat;
}

async function writeArtifact(file, obj) {
  await fs.mkdir('artifacts', { recursive: true });
  await fs.writeFile(path.join('artifacts', file), JSON.stringify(obj, null, 2));
}

async function main() {
  await initializeObservability('merajutasa-service', {
    enableAllComponents: true,
    dashboards: { dashboardsEnabled: false },
    metrics: { collectDefaultMetrics: true }
  });

  const obs = getAdvancedObservabilitySystem();
  const metrics = obs.components.get('metrics');
  const alerting = obs.components.get('alerting');
  const logging = obs.components.get('logging');

  // create custom gauges used by rules
  metrics.createCustomMetric('avg_response_time', 'gauge', { help: 'Average response time ms' });
  metrics.createCustomMetric('cpu_usage_percent', 'gauge', { help: 'CPU usage percent' });
  metrics.createCustomMetric('memory_usage_percent', 'gauge', { help: 'Memory usage percent' });
  metrics.createCustomMetric('service_health_status', 'gauge', { help: 'Service health (1/0)' });
  metrics.createCustomMetric('error_rate', 'gauge', { help: 'Error rate %' });
  metrics.createCustomMetric('chain_integrity_score', 'gauge', { help: 'Chain integrity %' });

  // normal values
  metrics.recordCustomMetric('service_health_status', 'set', 1);
  metrics.recordCustomMetric('error_rate', 'set', 0.5);
  metrics.recordCustomMetric('avg_response_time', 'set', 120);
  metrics.recordCustomMetric('cpu_usage_percent', 'set', 35);
  metrics.recordCustomMetric('memory_usage_percent', 'set', 40);
  metrics.recordCustomMetric('chain_integrity_score', 'set', 99);

  // stream once to wire components
  metrics.startMetricStreaming(1000);

  // grab metrics JSON and flatten for alert engine
  const mjson1 = await metrics.getMetricsJSON();
  const flat1 = flattenMetricValues(mjson1);
  alerting.evaluateMetrics({ ...flat1, avg_response_time: 120 });

  // now simulate spikes to trigger multiple rules
  metrics.recordCustomMetric('error_rate', 'set', 15); // >10% triggers high_error_rate
  metrics.recordCustomMetric('avg_response_time', 'set', 6000); // >5000ms triggers slow_response_time
  metrics.recordCustomMetric('cpu_usage_percent', 'set', 90); // >80% high_cpu_usage
  metrics.recordCustomMetric('chain_integrity_score', 'set', 90); // <95 triggers chain_integrity_low

  const mjson2 = await metrics.getMetricsJSON();
  const flat2 = flattenMetricValues(mjson2);
  const triggered = alerting.evaluateMetrics({
    ...flat2,
    avg_response_time: 6000
  });

  // emit a security event using standardized schema
  logging.security('auth_failed_spike', 'high', 'Multiple authentication failures detected', {
    actor: { id: 'system', type: 'system' },
    auth: { method: 'password', mfa: false, success: false },
    labels: { test_vector: 'observability-alerts-sim' }
  });

  // artifacts: rules + triggered alerts snapshot
  const rules = Array.from(alerting.alertRules.values()).map(r => ({ id: r.id, name: r.name, severity: r.severity }));
  await writeArtifact('observability-alert-rules.json', { generated_at: new Date().toISOString(), rules });
  await writeArtifact('observability-alerts-fired.json', {
    generated_at: new Date().toISOString(),
    count: triggered.length,
    alerts: triggered.map(a => ({ id: a.id, rule: a.rule, severity: a.severity, name: a.name, timestamp: a.timestamp }))
  });

  // write a compact dashboards snapshot placeholder
  await writeArtifact('dashboards-snapshot.json', {
    system_overview: { widgets: ['system_health', 'response_time', 'error_rate', 'active_alerts'] },
    security: { widgets: ['security_events', 'authentication_stats', 'threat_analysis'] }
  });

  // stop stream timer to end process
  metrics.stopMetricStreaming();
}

main().catch(err => {
  console.error('observability-alerts-sim failed:', err);
  process.exitCode = 1;
});
