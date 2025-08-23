'use strict';

// Propagate narratives (Issue 1..15) into bodies of relevant sub-issues for parents #4..#18
// - Reads docs/analysis/ISSUE-83-NARRATIVES-V1.md
// - Reads artifacts/audit/sub-issue-link-audit-2025-08-23.json to get parent issues
// - For each parent, fetches native sub-issues via GraphQL
// - For each sub-issue, injects/updates a Context block in the issue body (not just comments)
// - Writes artifacts/narratives-propagation-YYYY-MM-DD.json (deterministic)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { stableStringify, addMetadata } from './lib/json-stable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER = 'xcodeprem';
const REPO = 'merajutasa.id';

const NARRATIVES_MD = path.resolve(__dirname, '../docs/analysis/ISSUE-83-NARRATIVES-V1.md');
const AUDIT_JSON = path.resolve(__dirname, '../artifacts/audit/sub-issue-link-audit-2025-08-23.json');
const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');
const TMP_DIR = path.join(ARTIFACTS_DIR, 'tmp', 'narratives');

const CONTEXT_MARKER_BEGIN = '<!-- AUTO:CONTEXT_V1 BEGIN -->';
const CONTEXT_MARKER_END = '<!-- AUTO:CONTEXT_V1 END -->';
const CONTEXT_MARKER_BEGIN_MINI = '<!-- AUTO:CONTEXT_MINI_V1 BEGIN -->';
const CONTEXT_MARKER_END_MINI = '<!-- AUTO:CONTEXT_MINI_V1 END -->';

function runGh(args, options = {}) {
  try {
    const out = execFileSync('gh', args, { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024, ...options });
    return out.trim();
  } catch (err) {
    const msg = err?.stdout?.toString?.() || err?.message || String(err);
    throw new Error(`gh ${args.join(' ')} failed: ${msg}`);
  }
}

async function ensureDirs() {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
}

function parseNarratives(md) {
  // Split by sections starting with '## Issue N:'
  const sections = {};
  const parts = md.split(/\n## Issue\s+(\d+):\s+([^\n]+)\n/);
  // parts = [before, n1, title1, body1, n2, title2, body2, ...]
  for (let i = 1; i < parts.length; i += 3) {
    const num = parseInt(parts[i], 10);
    const title = parts[i + 1].trim();
    const body = parts[i + 2] || '';
    sections[num] = { title, body };
  }
  return sections;
}

function mdExtract(sectionBody, heading) {
  // Extract bullet/paragraph under a heading like '- Context:' or '- Non-Negotiable:' etc.
  // The narratives use lines like '- Context: ...' and then bullet lists for Non-Negotiable etc.
  const lines = sectionBody.split(/\r?\n/);
  const out = [];
  let capture = false;
  for (const line of lines) {
    const h = line.trim();
    if (/^\-\s*Context:/i.test(h)) capture = heading.toLowerCase() === 'context';
    else if (/^\-\s*Problem:/i.test(h)) capture = heading.toLowerCase() === 'problem';
    else if (/^\-\s*Non\-Negotiable/i.test(h)) capture = heading.toLowerCase() === 'nonneg';
    else if (/^\-\s*Deliverables:/i.test(h)) capture = heading.toLowerCase() === 'deliverables';
    else if (/^\-\s*Acceptance/i.test(h)) capture = heading.toLowerCase() === 'acceptance';
    else if (/^\-\s*DoD:/i.test(h)) capture = heading.toLowerCase() === 'dod';
    else if (/^\-\s*Test Plan:/i.test(h)) capture = heading.toLowerCase() === 'testplan';
    else if (/^\-\s*Perf/i.test(h)) capture = heading.toLowerCase() === 'perf';
    else if (/^\-\s*Observability/i.test(h)) capture = heading.toLowerCase() === 'observability';
    else if (/^\-\s*Docs/i.test(h)) capture = heading.toLowerCase() === 'docs';
    else if (/^\-\s*Rollout/i.test(h)) capture = heading.toLowerCase() === 'rollout';
    else if (/^\-\s*Dependencies/i.test(h)) capture = heading.toLowerCase() === 'dependencies';
    else if (/^\-\s*Risks/i.test(h)) capture = heading.toLowerCase() === 'risks';
    else if (/^\-\s*Metrics/i.test(h)) capture = heading.toLowerCase() === 'metrics';
    // Stop capture when a top-level new dash heading appears
    if (/^\-\s+[A-Z]/.test(h) && !/^\-\s*(Context|Problem|Non\-Negotiable|Deliverables|Acceptance|DoD|Test Plan|Perf|Observability|Docs|Rollout|Dependencies|Risks|Metrics)/i.test(h)) {
      capture = false;
    }
    if (capture) out.push(line);
  }
  return out.join('\n').trim();
}

function buildContextBlock(issueIdx, domainTitle, sectionBody, parentNumber) {
  const ctx = mdExtract(sectionBody, 'context');
  const prob = mdExtract(sectionBody, 'problem');
  const nonneg = mdExtract(sectionBody, 'nonneg');
  const acc = mdExtract(sectionBody, 'acceptance');
  const dod = mdExtract(sectionBody, 'dod');
  // Trim long sections to avoid overloading issue body
  const limit = (s, n) => (s && s.length > n ? s.slice(0, n) + '\n…' : s || '');

  const header = `## Context (EPIC #83 · Domain ${issueIdx}: ${domainTitle})`;
  const lines = [
    CONTEXT_MARKER_BEGIN,
    `<!-- parent:#${parentNumber} epic:#83 generated:${new Date().toISOString()} -->`,
    header,
    ctx ? `\n${ctx}\n` : '',
    prob ? `\n### Problem\n${limit(prob, 1000)}\n` : '',
    nonneg ? `\n### Non-Negotiable Requirements\n${limit(nonneg, 2000)}\n` : '',
    acc ? `\n### Acceptance Criteria (excerpt)\n${limit(acc, 1000)}\n` : '',
    dod ? `\n### Definition of Done (excerpt)\n${limit(dod, 800)}\n` : '',
    CONTEXT_MARKER_END
  ].filter(Boolean);
  return lines.join('\n');
}

function upsertContextIntoBody(existingBody, contextBlock) {
  if (!existingBody || typeof existingBody !== 'string') existingBody = '';
  const beginIdx = existingBody.indexOf(CONTEXT_MARKER_BEGIN);
  const endIdx = existingBody.indexOf(CONTEXT_MARKER_END);
  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    // Replace existing block
    const before = existingBody.slice(0, beginIdx).trimEnd();
    const after = existingBody.slice(endIdx + CONTEXT_MARKER_END.length).trimStart();
    return [before, '', contextBlock, '', after].join('\n').trim() + '\n';
  }
  // Insert near top, after initial H1 if present
  const lines = existingBody.split(/\r?\n/);
  let insertAt = 0;
  if (lines[0]?.startsWith('# ')) {
    // find first blank line after H1
    insertAt = lines.findIndex((l, idx) => idx > 0 && l.trim() === '');
    if (insertAt === -1) insertAt = 1;
    else insertAt = insertAt + 1;
  }
  const updated = [
    ...lines.slice(0, insertAt),
    '',
    contextBlock,
    '',
    ...lines.slice(insertAt)
  ].join('\n').replace(/\n{3,}/g, '\n\n');
  return updated.trim() + '\n';
}

function buildMiniContext(issueIdx, domainTitle, sectionBody, parentNumber, parentChildNumber) {
  const ctx = mdExtract(sectionBody, 'context');
  const prob = mdExtract(sectionBody, 'problem');
  const limit = (s, n) => (s && s.length > n ? s.slice(0, n) + '\n…' : s || '');
  const header = `### Context (EPIC #83 → Domain ${issueIdx}: ${domainTitle})`;
  const lines = [
    CONTEXT_MARKER_BEGIN_MINI,
    `<!-- parent:#${parentNumber} child:#${parentChildNumber} epic:#83 generated:${new Date().toISOString()} -->`,
    header,
    ctx ? `\n${limit(ctx, 600)}\n` : '',
    prob ? `\nProblem: ${limit(prob, 400)}\n` : '',
    CONTEXT_MARKER_END_MINI
  ].filter(Boolean);
  return lines.join('\n');
}

function upsertMiniContext(existingBody, miniBlock) {
  if (!existingBody || typeof existingBody !== 'string') existingBody = '';
  const b = existingBody.indexOf(CONTEXT_MARKER_BEGIN_MINI);
  const e = existingBody.indexOf(CONTEXT_MARKER_END_MINI);
  if (b !== -1 && e !== -1 && e > b) {
    const before = existingBody.slice(0, b).trimEnd();
    const after = existingBody.slice(e + CONTEXT_MARKER_END_MINI.length).trimStart();
    return [before, '', miniBlock, '', after].join('\n').trim() + '\n';
  }
  // Append mini block at bottom
  const updated = [existingBody.trimEnd(), '', miniBlock, ''].join('\n').replace(/\n{3,}/g, '\n\n');
  return updated.trim() + '\n';
}

function ghGraphQL(query, variables) {
  const args = ['api', 'graphql', '-f', `query=${query}`];
  for (const [k, v] of Object.entries(variables || {})) {
    if (typeof v === 'number' || typeof v === 'boolean') {
      args.push('-F', `${k}=${String(v)}`);
    } else if (v && typeof v === 'object') {
      args.push('-F', `${k}=${JSON.stringify(v)}`);
    } else {
      args.push('-f', `${k}=${String(v)}`);
    }
  }
  const json = runGh(args);
  try { return JSON.parse(json); } catch { throw new Error('Invalid JSON from gh api graphql'); }
}

function listSubIssues(parentNumber) {
  const query = `
    query($owner:String!, $name:String!, $number:Int!) {
      repository(owner:$owner, name:$name) {
        issue(number:$number) {
          number
          title
          url
          subIssues(first: 100) {
            nodes { id number title url }
            totalCount
          }
        }
      }
    }
  `;
  const data = ghGraphQL(query, { owner: OWNER, name: REPO, number: parentNumber });
  const nodes = data?.data?.repository?.issue?.subIssues?.nodes || [];
  return nodes.map(n => ({ number: n.number, title: n.title, url: n.url }));
}

function listSubSubIssues(childNumber) {
  const query = `
    query($owner:String!, $name:String!, $number:Int!) {
      repository(owner:$owner, name:$name) {
        issue(number:$number) {
          number
          subIssues(first: 50) { nodes { number title url } totalCount }
        }
      }
    }
  `;
  const data = ghGraphQL(query, { owner: OWNER, name: REPO, number: childNumber });
  const nodes = data?.data?.repository?.issue?.subIssues?.nodes || [];
  return nodes.map(n => ({ number: n.number, title: n.title, url: n.url }));
}

function getIssueBody(number) {
  const out = runGh(['issue', 'view', String(number), '-R', `${OWNER}/${REPO}`, '--json', 'body', '--jq', '.body']);
  return out || '';
}

async function writeTempBodyFile(number, body) {
  const fp = path.join(TMP_DIR, `${number}.md`);
  await fs.writeFile(fp, body, 'utf8');
  return fp;
}

function updateIssueBodyFromFile(number, filePath) {
  runGh(['issue', 'edit', String(number), '-R', `${OWNER}/${REPO}`, '--body-file', filePath]);
}

async function main() {
  await ensureDirs();
  const propagateGrandchildren = process.argv.includes('--grandchildren');
  const res = { action: 'narratives_propagation', owner: OWNER, repo: REPO, epic: 83, updated: [], errors: [], options: { grandchildren: propagateGrandchildren } };
  const md = await fs.readFile(NARRATIVES_MD, 'utf8');
  const narratives = parseNarratives(md);

  const auditRaw = await fs.readFile(AUDIT_JSON, 'utf8');
  const audit = JSON.parse(auditRaw);
  const parents = audit?.epic?.rollup_verification?.parents || [];

  for (const p of parents) {
    const parentNum = p.number;
    const idx = parentNum - 3; // Map Issue 1..15 to parent #4..#18
    const narrative = narratives[idx];
    if (!narrative) {
      res.errors.push({ parent: parentNum, error: `No narrative section for Issue ${idx}` });
      continue;
    }
    let children = [];
    try {
      children = listSubIssues(parentNum);
    } catch (e) {
      res.errors.push({ parent: parentNum, error: `List sub-issues failed: ${e.message}` });
      continue;
    }
    if (!children.length) continue;

    const contextBlock = buildContextBlock(idx, narrative.title, narrative.body, parentNum);

    for (const child of children) {
      try {
        const current = getIssueBody(child.number);
        const updated = upsertContextIntoBody(current, contextBlock);
        if (updated !== current) {
          const fp = await writeTempBodyFile(child.number, updated);
          updateIssueBodyFromFile(child.number, fp);
          res.updated.push({ parent: parentNum, child: child.number, url: child.url, status: 'updated' });
        } else {
          res.updated.push({ parent: parentNum, child: child.number, url: child.url, status: 'nochange' });
        }
        if (propagateGrandchildren) {
          const grand = listSubSubIssues(child.number);
          if (grand.length) {
            const mini = buildMiniContext(idx, narrative.title, narrative.body, parentNum, child.number);
            for (const g of grand) {
              try {
                const gBody = getIssueBody(g.number);
                const gUpdated = upsertMiniContext(gBody, mini);
                if (gUpdated !== gBody) {
                  const gfp = await writeTempBodyFile(g.number, gUpdated);
                  updateIssueBodyFromFile(g.number, gfp);
                  res.updated.push({ parent: parentNum, child: child.number, grandchild: g.number, url: g.url, status: 'updated' });
                } else {
                  res.updated.push({ parent: parentNum, child: child.number, grandchild: g.number, url: g.url, status: 'nochange' });
                }
              } catch (e) {
                res.errors.push({ parent: parentNum, child: child.number, grandchild: g.number, error: e.message });
              }
            }
          }
        }
      } catch (e) {
        res.errors.push({ parent: parentNum, child: child.number, error: e.message });
      }
    }
  }

  const artifactPath = path.join(ARTIFACTS_DIR, `narratives-propagation-${new Date().toISOString().slice(0,10)}.json`);
  const withMeta = addMetadata(res, { generator: 'tools/narratives-propagate.js' });
  await fs.writeFile(artifactPath, stableStringify(withMeta), 'utf8');
  console.log(`Wrote ${artifactPath} (updated: ${res.updated.length}, errors: ${res.errors.length})`);
}

main().catch(async (err) => {
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    const artifactPath = path.join(ARTIFACTS_DIR, `narratives-propagation-error-${Date.now()}.json`);
    await fs.writeFile(artifactPath, stableStringify(addMetadata({ error: err?.message || String(err) }, { generator: 'tools/narratives-propagate.js' })), 'utf8');
    console.error('ERROR:', err?.message || err);
    process.exitCode = 1;
  } catch (e) {
    console.error('FATAL:', err?.message || err);
    process.exit(1);
  }
});
