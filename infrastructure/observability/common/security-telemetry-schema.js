/**
 * Security Telemetry Schema v1
 * Standardizes security/ops events across logs/metrics/traces.
 */

import { v4 as uuidv4 } from 'uuid';

export function standardizeSecurityEvent(event = {}, context = {}) {
  const now = new Date().toISOString();
  const {
    event_name = 'security_event',
    severity = 'info',
    description = '',
    actor = {},
    resource = {},
    security = {},
    http = {},
    network = {},
    auth = {}
  } = event;

  const {
    serviceName = process.env.SERVICE_NAME || 'merajutasa-service',
    environment = process.env.NODE_ENV || 'development',
    traceId = context.traceId || null,
    spanId = context.spanId || null,
    correlationId = context.correlationId || uuidv4()
  } = context;

  return {
    schema_version: 'v1',
    event_id: uuidv4(),
    occurred_at: now,
    received_at: now,
    event_name,
    severity,
    description,
    service: serviceName,
    environment,
    // Actor and resource
    actor: {
      id: actor.id || actor.user_id || 'unknown',
      type: actor.type || 'user',
      role: actor.role || 'unknown',
      org_id: actor.org_id || null
    },
    resource: {
      id: resource.id || null,
      type: resource.type || null,
      name: resource.name || null
    },
    // Correlation
    correlation: {
      correlation_id: correlationId,
      trace_id: traceId,
      span_id: spanId
    },
    // Auth context
    auth: {
      method: auth.method || security.auth_method || null,
      mfa: auth.mfa ?? security.mfa ?? null,
      success: auth.success ?? null
    },
    // Network context
    network: {
      client_ip: network.ip || http.ip || null,
      user_agent: http.user_agent || null,
      geo: network.geo || null
    },
    // HTTP context
    http: {
      method: http.method || null,
      path: http.path || null,
      status_code: http.status_code || null
    },
    // Extra labels/kv
    labels: Object.assign({}, event.labels || {}),
    metadata: Object.assign({}, event.metadata || {})
  };
}

export default { standardizeSecurityEvent };
