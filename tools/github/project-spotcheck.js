/**
 * Project board spot-check: compares Issue labels to Project v2 field values
 * Fields checked: Priority, Area, Phase, Status
 *
 * Inputs (env):
 *   GH_PROJECT_TOKEN or GITHUB_TOKEN: GitHub PAT with project read access
 *   PROJECT_OWNER: user/org login (default: repo owner from CLI)
 *   PROJECT_TITLE: project v2 title (default: "MerajutASA Program Board")
 *
 * Inputs (CLI):
 *   --owner=<owner>  (repo owner)
 *   --repo=<repo>    (repo name)
 *   --issues=98,96   (issue numbers to check; default: latest 2 open issues)
 *   --projectTitle="MerajutASA Program Board"
 *
 * Output: artifacts/project-spotcheck.json (deterministic ordering)
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, '..', '..');
const ARTIFACTS = path.join(ROOT, 'artifacts');

async function stableImport(modulePath) {
  return await import(modulePath);
}

let stableStringify;
try {
  const js = await stableImport('../lib/json-stable.js');
  stableStringify = js.stableStringify || ((o) => JSON.stringify(o, Object.keys(o).sort(), 2));
} catch {
  stableStringify = (o) => JSON.stringify(o, null, 2);
}

const args = Object.fromEntries(process.argv.slice(2).map(a => {
  const [k, ...rest] = a.split('=');
  return [k.replace(/^--/, ''), rest.join('=') || true];
}));

const OWNER = (process.env.PROJECT_OWNER || args.owner || '').trim();
const REPO = (args.repo || '').trim();
const PROJECT_TITLE = (process.env.PROJECT_TITLE || args.projectTitle || 'MerajutASA Program Board').trim();
const TOKEN = (process.env.GH_PROJECT_TOKEN || process.env.GITHUB_TOKEN || '').trim();

if (!TOKEN) {
  console.error('Missing GH_PROJECT_TOKEN or GITHUB_TOKEN in environment.');
  process.exit(2);
}
if (!OWNER || !REPO) {
  console.error('Usage: node tools/github/project-spotcheck.js --owner=<owner> --repo=<repo> [--issues=1,2] [--projectTitle=...]');
  process.exitCode = 1;
}

const ISSUES = String(args.issues || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(n => parseInt(n, 10))
  .filter(n => Number.isFinite(n));

const GQL_ENDPOINT = 'https://api.github.com/graphql';
const REST_ENDPOINT = 'https://api.github.com';

async function ghFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'authorization': `Bearer ${TOKEN}`,
      'accept': 'application/vnd.github+json',
      'content-type': 'application/json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${res.statusText} - ${text.slice(0, 1000)}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json') || url.includes('/graphql')) return res.json();
  return res.text();
}

async function ghGraphQL(query, variables) {
  const body = { query, variables };
  const res = await ghFetch(GQL_ENDPOINT, { method: 'POST', body: JSON.stringify(body) });
  if (res.errors && res.errors.length) {
    throw new Error('GraphQL error: ' + JSON.stringify(res.errors));
  }
  return res.data;
}

async function resolveProjectByTitle(login, title) {
  // Try as user first; if not found, try as organization. Avoid combined query to prevent GraphQL partial errors.
  const qUser = `
    query($login:String!){
      user(login:$login){ projectsV2(first:50){ nodes{ id number title } } }
    }
  `;
  const qOrg = `
    query($login:String!){
      organization(login:$login){ projectsV2(first:50){ nodes{ id number title } } }
    }
  `;
  let nodes = [];
  try {
    const du = await ghGraphQL(qUser, { login });
    nodes = [...(du.user?.projectsV2?.nodes || [])];
  } catch (e) {
    // Ignore and fall back to org query
  }
  if (!nodes.length) {
    try {
      const do_ = await ghGraphQL(qOrg, { login });
      nodes = [...(do_.organization?.projectsV2?.nodes || [])];
    } catch (e) {
      // If both fail, bubble up the error
      throw e;
    }
  }
  const match = nodes.find(n => n.title === title) || nodes.find(n => n.title?.toLowerCase() === title.toLowerCase());
  if (!match) throw new Error(`Project titled '${title}' not found under ${login}`);
  return { id: match.id, number: match.number, title: match.title };
}

async function getLatestOpenIssues(owner, repo, limit = 2) {
  const url = `${REST_ENDPOINT}/repos/${owner}/${repo}/issues?state=open&per_page=${limit}&sort=created&direction=desc`;
  const data = await ghFetch(url);
  return data.filter(i => !i.pull_request).map(i => i.number);
}

async function getIssueProjectValues(owner, repo, number) {
  const q = `
    query($owner:String!,$repo:String!,$number:Int!){
      repository(owner:$owner, name:$repo){
        issue(number:$number){
          id number title
          labels(first:100){ nodes{ name } }
          projectItems(first:20){
            nodes{
              id
              project{ id title number }
              fieldValues(first:50){
                nodes{
                  ... on ProjectV2ItemFieldSingleSelectValue{
                    field{ ... on ProjectV2FieldCommon{ name } }
                    option{ name }
                  }
                  ... on ProjectV2ItemFieldTextValue{
                    field{ ... on ProjectV2FieldCommon{ name } }
                    text
                  }
                  ... on ProjectV2ItemFieldDateValue{
                    field{ ... on ProjectV2FieldCommon{ name } }
                    date
                  }
                  ... on ProjectV2ItemFieldNumberValue{
                    field{ ... on ProjectV2FieldCommon{ name } }
                    number
                  }
                  ... on ProjectV2ItemFieldIterationValue{
                    field{ ... on ProjectV2FieldCommon{ name } }
                    title
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  const d = await ghGraphQL(q, { owner, repo, number });
  return d.repository.issue;
}

function deriveExpectedFromLabels(labelNames) {
  const lower = labelNames.map(s => s.toLowerCase());
  const pick = (prefix) => {
    const m = lower.find(n => n.startsWith(prefix + ':'));
    return m ? m.split(':')[1] : null;
  };
  const priorityLabel = pick('priority') || lower.find(n => /^(p[1-5]|high|medium|low)$/.test(n)) || null;
  const areaLabel = pick('area');
  const phaseLabel = pick('phase');
  const statusLabel = pick('status');
  return {
    Priority: priorityLabel ? normalizeValue(priorityLabel) : null,
    Area: areaLabel ? normalizeValue(areaLabel) : null,
    Phase: phaseLabel ? normalizeValue(phaseLabel) : null,
    Status: statusLabel ? normalizeValue(statusLabel) : null,
  };
}

function normalizeValue(v) {
  if (!v) return v;
  const s = String(v).trim();
  // map common variants
  const map = {
    'in-progress': 'In Progress',
    'in review': 'In Review',
    'in-review': 'In Review',
    'todo': 'Todo',
    'to do': 'Todo',
    'p1': 'P1', 'p2': 'P2', 'p3': 'P3', 'p4': 'P4', 'p5': 'P5',
    'high': 'High', 'medium': 'Medium', 'low': 'Low',
  };
  return map[s.toLowerCase()] || capitalizeWords(s.replace(/[-_]/g, ' '));
}

function capitalizeWords(str) {
  return str.replace(/\b\w+/g, w => w.charAt(0).toUpperCase() + w.slice(1));
}

function extractProjectFields(fieldValues) {
  const rv = {};
  for (const fv of fieldValues || []) {
    const fieldName = fv?.field?.name;
    if (!fieldName) continue;
    if (typeof fv.text === 'string') rv[fieldName] = fv.text;
    else if (typeof fv.date === 'string') rv[fieldName] = fv.date;
    else if (typeof fv.number === 'number') rv[fieldName] = String(fv.number);
    else if (typeof fv.title === 'string') rv[fieldName] = fv.title;
    else if (fv.option && typeof fv.option.name === 'string') rv[fieldName] = fv.option.name;
  }
  return rv;
}

function compareMapping(expected, actual) {
  const fields = ['Priority', 'Area', 'Phase', 'Status'];
  const mismatches = [];
  for (const f of fields) {
    if (!expected[f]) continue; // only check when label expectation exists
    const exp = expected[f];
    const act = actual[f] || null;
    if (!act || exp.toLowerCase() !== String(act).toLowerCase()) {
      mismatches.push({ field: f, expected: exp, actual: act });
    }
  }
  return mismatches;
}

async function main() {
  try {
    const issuesToCheck = ISSUES.length ? ISSUES : await getLatestOpenIssues(OWNER, REPO, 2);
    const project = await resolveProjectByTitle(OWNER, PROJECT_TITLE);

    const results = [];
    for (const num of issuesToCheck) {
      const info = await getIssueProjectValues(OWNER, REPO, num);
      const labels = (info.labels?.nodes || []).map(n => n.name);
      const itemForProject = (info.projectItems?.nodes || []).find(n => n.project?.number === project.number);
      const projectFields = extractProjectFields(itemForProject?.fieldValues?.nodes || []);
      const expected = deriveExpectedFromLabels(labels);
      const mismatches = compareMapping(expected, projectFields);
      results.push({
        issue: { number: info.number, title: info.title },
        labels: labels.sort((a,b)=>a.localeCompare(b)),
        expected,
        project: { title: project.title, number: project.number },
        projectFields,
        mismatches,
      });
    }

    if (!fs.existsSync(ARTIFACTS)) fs.mkdirSync(ARTIFACTS, { recursive: true });
    const out = {
      kind: 'project_spotcheck',
      ts: new Date().toISOString(),
      owner: OWNER,
      repo: REPO,
      project: { title: project.title, number: project.number },
      results,
      notes: {
        guidance: 'If mismatches exist, consider re-running auto-add/bulk-import or manually syncing fields.',
      },
    };
    const outPath = path.join(ARTIFACTS, 'project-spotcheck.json');
    fs.writeFileSync(outPath, stableStringify(out));
    console.log(`Wrote ${outPath}`);
  } catch (err) {
    console.error('Spot-check failed:', err.message || err);
    process.exitCode = 2;
  }
}

await main();
