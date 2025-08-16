#!/usr/bin/env node
/**
 * event-pipeline-hash.js
 * Computes pipeline_hash as specified in Event Schema Canonical v1.0:
 *   SHA-256 of (schema_version + sorted event_name list + schema file commit hash)
 *
 * Implementation notes:
 * - Event names are parsed from docs/analytics/event-schema-canonical-v1.md (Section 4 taxonomy bullets)
 * - schema_version is parsed from the document title (fallback to 1.0)
 * - Schema file commit hash: prefer git commit of schemas/events/public-event-v1.json; fallback to file SHA256, then "no-git"
 * - Writes artifacts/event-pipeline-hash.json with ingredients and resulting hash
 */
import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execFileSync } from 'child_process';

const MD_SPEC_PATH = path.resolve('docs/analytics/event-schema-canonical-v1.md');
const JSON_SCHEMA_PATH = path.resolve('schemas/events/public-event-v1.json');
const TAXONOMY_JSON_PATH = path.resolve('schemas/events/event-taxonomy-v1.json');

function sha256Hex(buf){ return crypto.createHash('sha256').update(buf).digest('hex'); }

async function readText(p){ return fs.readFile(p, 'utf8'); }

function tryGitCommitHash(filePath){
  try {
    // Use execFileSync to avoid shell parsing and interpolation
    const out = execFileSync('git', ['--no-pager', 'log', '-n', '1', '--pretty=format:%H', '--', filePath], { stdio: ['ignore','pipe','ignore'] })
      .toString()
      .trim();
    return out || null;
  } catch { return null; }
}

function parseSchemaVersion(md){
  // Try title pattern: "Public Tier Event Schema Canonical Specification (v1.0)"
  const m1 = md.match(/Canonical Specification \(v(\d+\.\d+)/i);
  if (m1) return m1[1];
  // Try change log version table: "| 1.0.0 |"
  const m2 = md.match(/\|\s*(\d+\.\d+(?:\.\d+)?)\s*\|\s*\d{4}-\d{2}-\d{2}\s*\|/);
  if (m2) return m2[1];
  return '1.0';
}

function parseEventNames(md){
  // Collect bullet lines beginning with "- pub_" or "- sys_" until the end
  const events = [];
  for (const line of md.split(/\r?\n/)){
    const m = line.match(/^\s*-\s*((?:pub|sys)_[a-z0-9_]+)/);
    if (m) events.push(m[1]);
  }
  // De-duplicate and sort
  return Array.from(new Set(events)).sort();
}

async function main(){
  const md = await readText(MD_SPEC_PATH);
  const schemaVersion = parseSchemaVersion(md);
  let eventNames;
  // Prefer dedicated taxonomy JSON if present
  try {
    const taxRaw = await fs.readFile(TAXONOMY_JSON_PATH,'utf8');
    const tax = JSON.parse(taxRaw);
    if (Array.isArray(tax.events) && tax.events.length){
      eventNames = Array.from(new Set(tax.events)).sort();
    }
  } catch { /* ignore, fallback to MD */ }
  if (!eventNames){
    eventNames = parseEventNames(md);
  }

  // Determine schema file commit hash (prefer JSON schema file)
  let schemaCommit = tryGitCommitHash(JSON_SCHEMA_PATH);
  let schemaCommitSource = 'git:schemas/events/public-event-v1.json';
  if (!schemaCommit){
    try {
      const buf = await fs.readFile(JSON_SCHEMA_PATH);
      schemaCommit = sha256Hex(buf);
      schemaCommitSource = 'sha256:schemas/events/public-event-v1.json';
    } catch {
      // fallback to MD spec file
      schemaCommit = tryGitCommitHash(MD_SPEC_PATH);
      schemaCommitSource = 'git:docs/analytics/event-schema-canonical-v1.md';
      if (!schemaCommit){
        const buf = await fs.readFile(MD_SPEC_PATH);
        schemaCommit = sha256Hex(buf);
        schemaCommitSource = 'sha256:docs/analytics/event-schema-canonical-v1.md';
      }
    }
  }

  // Canonical input string
  const inputStr = [
    `schema_version=${schemaVersion}`,
    'events=',
    ...eventNames,
    `schema_commit=${schemaCommit}`
  ].join('\n');
  const pipelineHash = sha256Hex(Buffer.from(inputStr, 'utf8'));

  const out = {
    version: '1.0',
    generated_utc: new Date().toISOString(),
    spec_doc: path.relative(process.cwd(), MD_SPEC_PATH).replace(/\\/g,'/'),
    schema_file: path.relative(process.cwd(), JSON_SCHEMA_PATH).replace(/\\/g,'/'),
  taxonomy_file: (await fs.access(TAXONOMY_JSON_PATH).then(()=>true).catch(()=>false)) ? path.relative(process.cwd(), TAXONOMY_JSON_PATH).replace(/\\/g,'/') : null,
    schema_commit_source: schemaCommitSource,
    schema_version: schemaVersion,
    event_count: eventNames.length,
    events: eventNames,
    pipeline_hash: pipelineHash
  };

  await fs.mkdir('artifacts', { recursive: true });
  const outPath = path.resolve('artifacts/event-pipeline-hash.json');
  await fs.writeFile(outPath, JSON.stringify(out, null, 2));
  console.log(`[event-pipeline-hash] hash=${pipelineHash} events=${eventNames.length} -> ${path.relative(process.cwd(), outPath)}`);
}

main().catch(err => { console.error('[event-pipeline-hash] error', err); process.exit(2); });
