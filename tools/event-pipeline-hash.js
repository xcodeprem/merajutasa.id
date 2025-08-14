#!/usr/bin/env node
/**
 * Computes a pipeline_hash for the public event schema and taxonomy.
 * pipeline_hash = sha256(schema_version + '|' + sorted_event_names.join(',') + '|' + sha256(schema_doc))
 */
import { promises as fs } from 'fs';
import { createHash } from 'crypto';

const SCHEMA_DOC = 'docs/analytics/event-schema-canonical-v1.md';

function sha256Hex(s){ return createHash('sha256').update(s).digest('hex'); }

async function main(){
  const doc = await fs.readFile(SCHEMA_DOC,'utf8');
  const versionMatch = doc.match(/Canonical Specification \(v([0-9.]+)\)/);
  const schema_version = versionMatch ? versionMatch[1] : '1.0';
  // Extract event names listed as bullet points, e.g. "- pub_event_name"
  const eventNames = Array.from(doc.matchAll(/^[-*]\s+(pub|sys)_[a-z0-9_]+/gmi)).map(m=>m[0].replace(/^[-*]\s+/,'').trim());
  const uniqueSorted = [...new Set(eventNames)].sort();
  const schemaHash = sha256Hex(doc);
  const pipeline_hash = sha256Hex(`${schema_version}|${uniqueSorted.join(',')}|${schemaHash}`);
  const out = { schema_version, event_count: uniqueSorted.length, pipeline_hash, schemaHash };
  await fs.mkdir('artifacts',{recursive:true});
  await fs.writeFile('artifacts/event-pipeline-hash.json', JSON.stringify(out,null,2));
  console.log(`[event-pipeline-hash] schema_version=${schema_version} events=${uniqueSorted.length} pipeline_hash=${pipeline_hash.slice(0,16)}…`);
}

main().catch(e=>{ console.error('[event-pipeline-hash] error', e); process.exit(2); });
