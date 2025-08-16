#!/usr/bin/env node
/**
 * event-meta-schemas.js
 * Central registry of per-event meta sub-schemas (minimal, non-breaking).
 * Provides a helper to compile validators with Ajv and reuse across tools/services.
 */
import Ajv2020 from 'ajv/dist/2020.js';

// Minimal schemas: focus on presence and basic types for ≥10 canonical events
export const META_SCHEMAS = {
  pub_landing_impression: {
    $id: 'meta.pub_landing_impression',
    type: 'object',
    properties: { path: { type: 'string', minLength: 1 }, referrer: { type: 'string' } },
    required: ['path'],
    additionalProperties: true
  },
  pub_hero_view: {
    $id: 'meta.pub_hero_view',
    type: 'object',
    properties: { path: { type: 'string' }, hero_variant: { type: 'string' } },
    required: ['path'],
    additionalProperties: true
  },
  pub_hero_card_cta_click: {
    $id: 'meta.pub_hero_card_cta_click',
    type: 'object',
    properties: { 
      card_id: { type: 'string', pattern: '^C[1-7]$' }, 
      cta_id: { type: 'string' }, 
      classification: { type: 'string', enum: ['Healthy', 'Monitoring', 'Imbalance'] },
      position_index: { type: 'integer', minimum: 0, maximum: 6 },
      path: { type: 'string' } 
    },
    required: ['card_id'],
    additionalProperties: false
  },
  sys_fairness_snapshot_written: {
    $id: 'meta.sys_fairness_snapshot_written',
    type: 'object',
    properties: {
      snapshot_ts: { type: 'string' },
      entry_count: { type: 'number', minimum: 0 }
    },
    required: ['snapshot_ts', 'entry_count'],
    additionalProperties: true
  },
  sys_fairness_under_served_enter: {
    $id: 'meta.sys_fairness_under_served_enter',
    type: 'object',
    properties: { unit_id: { type: 'string' }, score: { type: 'number' }, reason: { type: 'string' } },
    required: ['unit_id'],
    additionalProperties: true
  },
  sys_fairness_under_served_exit: {
    $id: 'meta.sys_fairness_under_served_exit',
    type: 'object',
    properties: { unit_id: { type: 'string' }, from_state: { type: 'string' }, to_state: { type: 'string' } },
    required: ['unit_id'],
    additionalProperties: true
  },
  sys_equity_anomaly_detected: {
    $id: 'meta.sys_equity_anomaly_detected',
    type: 'object',
    properties: { anomaly_type: { type: 'string' }, delta: { type: 'number' }, window: { type: 'string' } },
    required: ['anomaly_type', 'delta'],
    additionalProperties: true
  },
  sys_kpi_weekly_rollup: {
    $id: 'meta.sys_kpi_weekly_rollup',
    type: 'object',
    properties: { week_start: { type: 'string' }, generated_ts: { type: 'string' } },
    required: ['week_start'],
    additionalProperties: true
  },
  sys_privacy_scan_completed: {
    $id: 'meta.sys_privacy_scan_completed',
    type: 'object',
    properties: { scanned_count: { type: 'number', minimum: 0 }, pii_detected_count: { type: 'number', minimum: 0 } },
    required: ['scanned_count', 'pii_detected_count'],
    additionalProperties: true
  },
  sys_governance_spec_hash_verified: {
    $id: 'meta.sys_governance_spec_hash_verified',
    type: 'object',
    properties: { spec_hash: { type: 'string', pattern: '^[a-f0-9]{64}$' }, diff_count: { type: 'number', minimum: 0 } },
    required: ['spec_hash'],
    additionalProperties: true
  },
  pub_equity_under_served_click: {
    $id: 'meta.pub_equity_under_served_click',
    type: 'object',
    properties: { 
      unit_id: { type: 'string' }, 
      entry_reason: { type: 'string', enum: ['severe', 'consecutive'] }, 
      ratio: { type: 'number', minimum: 0, maximum: 1 } 
    },
    required: ['unit_id'],
    additionalProperties: true
  },
  pub_feedback_submit: {
    $id: 'meta.pub_feedback_submit',
    type: 'object',
    properties: { 
      category: { type: 'string' }, 
      contains_pii: { type: 'boolean' }, 
      length: { type: 'number', minimum: 0 } 
    },
    required: ['category'],
    additionalProperties: true
  },
  pub_hash_verify_click: {
    $id: 'meta.pub_hash_verify_click',
    type: 'object',
    properties: { 
      result: { type: 'string', enum: ['pass', 'fail', 'error'] }, 
      attempt_latency_ms: { type: 'number', minimum: 0 } 
    },
    required: ['result'],
    additionalProperties: true
  },
  pub_trust_metric_tooltip_open: {
    $id: 'meta.pub_trust_metric_tooltip_open',
    type: 'object',
    properties: { 
      metric_id: { type: 'string', enum: ['coverage', 'verified_percent', 'equity_index', 'incident_free_days'] } 
    },
    required: ['metric_id'],
    additionalProperties: true
  },
  pub_terminology_page_view: {
    $id: 'meta.pub_terminology_page_view',
    type: 'object',
    properties: { 
      stage: { type: 'string' }, 
      adoption_percent: { type: 'number', minimum: 0, maximum: 100 } 
    },
    required: ['stage'],
    additionalProperties: true
  }
};

export function compileMetaValidators(ajvInstance){
  const ajv = ajvInstance || new Ajv2020({ strict: false, allErrors: true });
  const validators = new Map();
  for (const [eventName, schema] of Object.entries(META_SCHEMAS)){
    validators.set(eventName, ajv.compile(schema));
  }
  return { ajv, validators };
}
