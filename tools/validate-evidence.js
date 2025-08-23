#!/usr/bin/env node
/**
 * validate-evidence.js
 * Validates evidence artifacts against JSON Schemas under schemas/evidence.
 * Exit non-zero if any required artifact fails schema validation.
 */
import { promises as fs } from 'fs';
import path from 'path';
import { glob } from 'glob';
import Ajv from 'ajv';

const REQUIRED = [
  { artifact: 'artifacts/spec-hash-diff.json', schema: 'schemas/evidence/spec-hash-diff-v1.json' },
  { artifact: 'artifacts/param-integrity-matrix.json', schema: 'schemas/evidence/param-integrity-v1.json' },
  { artifact: 'artifacts/principles-impact-report.json', schema: 'schemas/evidence/principles-impact-v2.json' },
  { artifact: 'artifacts/hype-lint.json', schema: 'schemas/evidence/hype-lint-v1.json' },
  { artifact: 'artifacts/disclaimers-lint.json', schema: 'schemas/evidence/disclaimers-lint-v1.json' },
  { artifact: 'artifacts/pii-scan-report.json', schema: 'schemas/evidence/pii-scan-v1.json' },
  { artifact: 'artifacts/fairness-sim-scenarios.json', schema: 'schemas/evidence/fairness-sim-scenarios-v1.json' },
  { artifact: 'artifacts/fairness-sim-report.json', schema: 'schemas/evidence/fairness-sim-report-v1.json' },
  { artifact: 'artifacts/no-silent-drift-report.json', schema: 'schemas/evidence/no-silent-drift-v1.json' },
  { artifact: 'artifacts/secrets-rotation-evidence.json', schema: 'schemas/evidence/secrets-rotation-evidence-v1.json' },
];

async function loadJSON(p){ return JSON.parse(await fs.readFile(p,'utf8')); }

async function main(){
  const ajv = new Ajv({ allErrors:true, strict:false });
  // Preload schemas
  const schemaFiles = await glob('schemas/evidence/*.json');
  for (const sf of schemaFiles){
    try {
      const schema = await loadJSON(sf);
      ajv.addSchema(schema, path.basename(sf));
    } catch (e){
      console.error(`[validator] Failed loading schema ${sf}:`, e.message);
      process.exit(2);
    }
  }
  const results = [];
  for (const item of REQUIRED){
    try {
      const data = await loadJSON(item.artifact);
      const schemaId = path.basename(item.schema);
      const validate = ajv.getSchema(schemaId);
      if(!validate){
        results.push({ artifact:item.artifact, status:'SCHEMA_MISSING', errors:[] });
        continue;
      }
      const ok = validate(data);
      results.push({ artifact:item.artifact, status: ok?'PASS':'FAIL', errors: ok?[]: validate.errors });
    } catch (e){
      results.push({ artifact:item.artifact, status:'MISSING', errors:[{ message:e.message }] });
    }
  }
  const summary = {
    total: results.length,
    pass: results.filter(r=>r.status==='PASS').length,
    fail: results.filter(r=>r.status==='FAIL').length,
    missing: results.filter(r=>r.status==='MISSING').length,
    schema_missing: results.filter(r=>r.status==='SCHEMA_MISSING').length,
  };
  const out = { version:1, generated_utc: new Date().toISOString(), summary, results };
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/evidence-schema-validation.json', JSON.stringify(out,null,2));
  console.log(`[validate-evidence] PASS=${summary.pass} FAIL=${summary.fail} MISSING=${summary.missing}`);
  if (summary.fail>0) {process.exit(1);}
}

main().catch(e=>{ console.error('validate-evidence error', e); process.exit(2); });
