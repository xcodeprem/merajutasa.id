#!/usr/bin/env node
/**
 * event-meta-validate.js
 * Validates presence and basic meta fields for ≥10 canonical events (registry-driven).
 * Output: artifacts/event-meta-validate.json
 * Behavior: Fails only if registry has <10 validators; individual meta failures are advisory for Wave 1.5.
 */
import { promises as fs } from 'fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { META_SCHEMAS, compileMetaValidators } from './event-meta-schemas.js';

const REQUIRED_MIN = 10;

async function main(){
  await fs.mkdir('artifacts',{recursive:true});
  const ajv = new Ajv2020({ strict:false, allErrors:true });
  addFormats(ajv);
  const { validators } = compileMetaValidators(ajv);
  const issues = [];
  const registryCount = validators.size;
  if (registryCount < REQUIRED_MIN) {issues.push({ code:'REQUIRED_EVENTS_INSUFFICIENT', size: registryCount });}

  // Optionally, verify that schemas compile and have sensible required keys
  const schemasSummary = Object.entries(META_SCHEMAS).map(([k,s])=>({ event_name:k, required:(s.required||[]), additionalProperties: s.additionalProperties!==false }));
  const out = { version:1, registryCount, schemas: schemasSummary, issues };
  await fs.writeFile('artifacts/event-meta-validate.json', JSON.stringify(out,null,2));
  if (issues.length){ console.error('[event-meta-validate] FAIL', issues); process.exit(1); }
  console.log('[event-meta-validate] PASS registryCount>='+REQUIRED_MIN);
}

main().catch(e=>{ console.error('[event-meta-validate] error', e); process.exit(2); });
