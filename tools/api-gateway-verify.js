import http from 'http';
import { createAPIGatewayOrchestrator } from '../infrastructure/api-gateway/api-gateway-orchestrator.js';

async function httpRequest(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path,
      method,
      headers: {
        'content-type': 'application/json',
        'x-api-key': 'dev-key',
        'x-roles': 'ingest:write,append:write,sign:write',
        ...headers,
        ...(data ? { 'content-length': data.length } : {}),
      },
    }, (res) => {
      let chunks = '';
      res.on('data', (d) => chunks += d);
      res.on('end', () => resolve({ status: res.statusCode, body: chunks ? JSON.parse(chunks) : {} }));
    });
    req.on('error', reject);
    if (data) {req.write(data);}
    req.end();
  });
}

async function run() {
  const logs = [];
  const log = (name, result) => logs.push({ name, result });

  // Start orchestrator with NO default services (so mesh remains healthy with 0 services)
  const orchestrator = createAPIGatewayOrchestrator({ services: {}, gatewayPort: 8080, enableHealthChecking: false });
  await orchestrator.start();

  // Register a test service on the gateway only (not in mesh) to exercise middlewares
  orchestrator.components.gateway.registerService('collector', { host: 'localhost', port: 9999, version: 'v1' });

  // Health endpoints
  log('gateway-health', await httpRequest('GET', '/health'));
  log('gateway-metrics', await httpRequest('GET', '/metrics'));
  log('gateway-services', await httpRequest('GET', '/services'));

  // Simulate schema validation failure for collector
  log('collector-schema-fail', await httpRequest('POST', '/api/v1/collector/ingest', { bad: 'payload' }));

  // Simulate authZ fail (missing role)
  log('collector-authz-fail', await httpRequest('POST', '/api/v1/collector/ingest', { event: { event_name: 'x', occurred_at: new Date().toISOString() } }, { 'x-roles': 'none' }));

  // Enable mTLS requirement and simulate missing client cert header
  orchestrator.components.gateway.config.mtls.enabled = true;
  log('mtls-sim-fail', await httpRequest('GET', '/api/v1/collector/health', null, { 'x-client-cert': '' }));

  // Record mesh health (should be healthy with 0 services)
  const meshHealth = await orchestrator.components.serviceMesh.healthCheck();

  // Write artifacts
  const fs = await import('fs');
  await fs.promises.mkdir('artifacts', { recursive: true });
  await fs.promises.writeFile('artifacts/api-gateway-verify-log.json', JSON.stringify({ ts: new Date().toISOString(), logs }, null, 2));
  await fs.promises.writeFile('artifacts/service-mesh-health.json', JSON.stringify(meshHealth, null, 2));
  console.log('Wrote artifacts/api-gateway-verify-log.json');
  console.log('Wrote artifacts/service-mesh-health.json');

  // Stop orchestrator
  await orchestrator.stop();
}

run().catch((e) => { console.error(e); process.exit(1); });
