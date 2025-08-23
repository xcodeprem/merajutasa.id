#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { stableStringify, addMetadata } from './lib/json-stable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER = 'xcodeprem';
const REPO = 'merajutasa.id';
const ISSUE_NUMBER = 83;
const MARK_BEGIN = '<!-- AUTO:NARRATIVES_V1 BEGIN -->';
const MARK_END = '<!-- AUTO:NARRATIVES_V1 END -->';
const NARRATIVES_PATH = path.resolve(__dirname, '../docs/analysis/ISSUE-83-NARRATIVES-V1.md');
const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');
const TMP_DIR = path.join(ARTIFACTS_DIR, 'tmp', 'epic-83');

function runGh(args, options = {}) {
  try {
    return execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, ...options }).trim();
  } catch (err) {
    const msg = err?.stdout?.toString?.() || err?.message || String(err);
    throw new Error(`gh ${args.join(' ')} failed: ${msg}`);
  }
}

async function ensureDirs() {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
}

function getIssueBody(number) {
  const out = runGh(['issue', 'view', String(number), '-R', `${OWNER}/${REPO}`, '--json', 'body', '--jq', '.body']);
  return out || '';
}

async function writeTemp(number, body) {
  const fp = path.join(TMP_DIR, `${number}-narratives-merged.md`);
  await fs.writeFile(fp, body, 'utf8');
  return fp;
}

function updateIssueBodyFromFile(number, file) {
  runGh(['issue', 'edit', String(number), '-R', `${OWNER}/${REPO}`, '--body-file', file]);
}

function unwrapFences(text) {
  if (!text) return '';
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  if (lines[0]?.startsWith('```')) {
    lines.shift();
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].trim() === '') { continue; }
      if (lines[i].trim() === '```') { lines.splice(i, 1); }
      break;
    }
  }
  return lines.join('\n').trim();
}

function upsertBlock(existingBody, content) {
  const block = `${MARK_BEGIN}\n\n${content.trim()}\n\n${MARK_END}`;
  if (!existingBody || typeof existingBody !== 'string') existingBody = '';
  const b = existingBody.indexOf(MARK_BEGIN);
  const e = existingBody.indexOf(MARK_END);
  if (b !== -1 && e !== -1 && e > b) {
    const before = existingBody.slice(0, b).trimEnd();
    const after = existingBody.slice(e + MARK_END.length).trimStart();
    return [before, '', '## Narratives (AUTO)', '', block, '', after].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  const sepIdx = existingBody.lastIndexOf('\n---');
  if (sepIdx !== -1) {
    const prefix = existingBody.slice(0, sepIdx + 4).trimEnd();
    const suffix = existingBody.slice(sepIdx + 4).trimStart();
    return [prefix, '', '## Narratives (AUTO)', '', block, '', suffix].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
  }
  return [existingBody.trim(), '', '## Narratives (AUTO)', '', block].join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

async function main() {
  const startedAt = new Date().toISOString();
  await ensureDirs();
  const res = { action: 'epic_narratives_upsert', epic: ISSUE_NUMBER, repo: `${OWNER}/${REPO}`, updated: false, error: null, beforeLen: 0, afterLen: 0, narratives_path: NARRATIVES_PATH, body_file: null };
  try {
    const narrativesRaw = await fs.readFile(NARRATIVES_PATH, 'utf8');
    const narratives = unwrapFences(narrativesRaw);
    const current = getIssueBody(ISSUE_NUMBER) || '';
    res.beforeLen = current.length;
    const next = upsertBlock(current, narratives);
    res.afterLen = next.length;
    if (next !== current) {
      const fp = await writeTemp(ISSUE_NUMBER, next);
      res.body_file = fp;
      await updateIssueBodyFromFile(ISSUE_NUMBER, fp);
      res.updated = true;
    }
  } catch (e) {
    res.error = e?.message || String(e);
  }
  const artifact = addMetadata(res, { generated_at: new Date().toISOString(), generator: 'tools/epic-83-upsert-narratives.js', version: '1.0' });
  const outPath = path.join(ARTIFACTS_DIR, `epic-83-narratives-upsert-${startedAt.slice(0,10)}.json`);
  await fs.writeFile(outPath, stableStringify(artifact), 'utf8');
  console.log(`Wrote ${outPath} (updated:${res.updated}${res.error ? `, error:${res.error}` : ''})`);
}

main();
