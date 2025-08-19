#!/usr/bin/env node
// Sync Project V2 fields (Status, Area, Priority, Phase) for given issue numbers based on labels
// Inputs via env:
// - GH_PROJECT_TOKEN: classic PAT with project permissions
// - PROJECT_OWNER: project owner login (user)
// - PROJECT_TITLE: project title
// - OWNER/REPO or GITHUB_REPOSITORY
// - INPUT_NUMBERS: comma-separated issue numbers

const OWNER = process.env.OWNER || (process.env.GITHUB_REPOSITORY || '').split('/')[0];
const REPO = process.env.REPO || (process.env.GITHUB_REPOSITORY || '').split('/')[1];
const PROJECT_OWNER = process.env.PROJECT_OWNER;
const PROJECT_TITLE = process.env.PROJECT_TITLE;
const TOKEN = process.env.GH_PROJECT_TOKEN || process.env.GITHUB_TOKEN;
const INPUT_NUMBERS = (process.env.INPUT_NUMBERS || '').trim();

if (!TOKEN) {
  console.error('Missing GH_PROJECT_TOKEN/GITHUB_TOKEN');
  process.exit(1);
}
if (!PROJECT_OWNER || !PROJECT_TITLE) {
  console.error('Missing PROJECT_OWNER or PROJECT_TITLE');
  process.exit(1);
}
if (!OWNER || !REPO) {
  console.error('Missing OWNER/REPO');
  process.exit(1);
}
if (!INPUT_NUMBERS) {
  console.error('Provide INPUT_NUMBERS (comma-separated issue numbers)');
  process.exit(1);
}

const gh = async (path, init={}) => {
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      'authorization': `Bearer ${TOKEN}`,
      'accept': 'application/vnd.github+json',
      'content-type': 'application/json',
      ...(init.headers||{}),
    }
  });
  if (!res.ok) {
    const text = await res.text().catch(()=> '');
    throw new Error(`HTTP ${res.status} ${res.statusText} for ${path}: ${text}`);
  }
  return res.json();
};

const gql = async (query, variables={}) => {
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    throw new Error('GraphQL error: ' + JSON.stringify(json.errors));
  }
  return json.data;
};

const resolveProjectByTitle = async (login, title) => {
  // Try user first, then org
  const qUser = `query($login:String!,$first:Int!){ user(login:$login){ projectsV2(first:$first){ nodes { id title number } } } }`;
  const qu = await gql(qUser, { login, first: 50 });
  const userProjects = qu.user?.projectsV2?.nodes || [];
  const hitU = userProjects.find(p => p.title === title);
  if (hitU) return { id: hitU.id, number: hitU.number, title: hitU.title };
  const qOrg = `query($login:String!,$first:Int!){ organization(login:$login){ projectsV2(first:$first){ nodes { id title number } } } }`;
  const qo = await gql(qOrg, { login, first: 50 });
  const orgProjects = qo.organization?.projectsV2?.nodes || [];
  const hitO = orgProjects.find(p => p.title === title);
  if (hitO) return { id: hitO.id, number: hitO.number, title: hitO.title };
  throw new Error(`Project '${title}' not found for owner '${login}'`);
};

const getProjectFields = async (projectId) => {
  const q = `query($id:ID!){ node(id:$id){ ... on ProjectV2 { fields(first:100){ nodes { __typename id name ... on ProjectV2SingleSelectField { options { id name } } } } } } }`;
  const d = await gql(q, { id: projectId });
  const nodes = d.node?.fields?.nodes || [];
  const byName = new Map(nodes.map(n => [n.name, n]));
  return { nodes, byName };
};

const normalize = {
  priority: (labels) => {
    // map P0..P3 or high/medium/low
    const set = new Set(labels.map(l=>l.toLowerCase()));
  if (set.has('p0') || set.has('urgent') || set.has('critical')) return 'P0';
  if (set.has('p1') || set.has('high')) return 'P1';
    if (set.has('p2') || set.has('medium')) return 'P2';
    if (set.has('p3') || set.has('low')) return 'P3';
    // also handle labels like priority:p1
    const p = [...set].find(s => /^priority:/.test(s));
    if (p) return p.split(':')[1].toUpperCase();
    return null;
  },
  status: (labels) => {
    const s = labels.map(l=>l.toLowerCase());
    if (s.includes('status:todo') || s.includes('todo') || s.includes('to do')) return 'To Do';
    if (s.includes('status:in-progress') || s.includes('in progress') || s.includes('in-progress')) return 'In Progress';
    if (s.includes('status:in-review') || s.includes('in review') || s.includes('in-review') || s.includes('review')) return 'In Review';
    if (s.includes('status:blocked') || s.includes('blocked')) return 'Blocked';
    if (s.includes('status:done') || s.includes('done')) return 'Done';
    return null;
  },
  area: (labels) => {
    const a = labels.find(l => l.toLowerCase().startsWith('area:'));
    if (!a) return null;
    const val = a.split(':')[1] || '';
    return val.replace(/[-_]/g, ' ').replace(/\b\w/g, c=>c.toUpperCase());
    },
  phase: (labels) => {
    const p = labels.find(l => l.toLowerCase().startsWith('phase:'));
    if (!p) return null;
    const tail = p.split(':')[1]; // e.g., 2-week-6
    const m = tail.match(/(\d+)\s*[-_ ]?week\s*[-_ ]?(\d+)/i);
    if (m) {
      return `Phase ${m[1]} W${m[2]}`;
    }
    return null;
  }
};

const upsertItemAndSetFields = async (project, fields, issueNumber) => {
  // 1) get issue node id + labels
  const issue = await gh(`/repos/${OWNER}/${REPO}/issues/${issueNumber}`);
  const labels = (issue.labels || []).map(l => typeof l === 'string' ? l : l.name).filter(Boolean);
  // 2) ensure item exists
  const addRes = await gql(`mutation($projectId:ID!,$contentId:ID!){ addProjectV2ItemById(input:{projectId:$projectId, contentId:$contentId}){ item { id } } }`, {
    projectId: project.id,
    contentId: issue.node_id,
  }).catch(()=>null);
  const itemId = addRes?.addProjectV2ItemById?.item?.id || null;
  // To find item ID even if it already exists, query items by content
  const qItems = `query($pid:ID!,$cid:ID!){ node(id:$pid){ ... on ProjectV2 { items(first:50, query:"repo:${OWNER}/${REPO} is:open is:issue ${issueNumber}"){ nodes { id content { ... on Issue { number } ... on PullRequest { number } } } } } } }`;
  const di = await gql(qItems, { pid: project.id, cid: issue.node_id });
  const item = (di.node?.items?.nodes || []).find(n => n.content?.number === issueNumber);
  const finalItemId = item?.id || itemId;
  if (!finalItemId) throw new Error(`Cannot resolve project item for #${issueNumber}`);

  // 3) derive expected values
  const expected = {
    Priority: normalize.priority(labels),
    Status: normalize.status(labels),
    Area: normalize.area(labels),
    Phase: normalize.phase(labels),
  };

  // 4) set fields if we have values and field exists
  const setSingleSelect = async (fieldName, want) => {
    if (!want) return;
    const f = fields.byName.get(fieldName);
    if (!f || f.__typename !== 'ProjectV2SingleSelectField') return;
    const opt = (f.options || []).find(o => o.name.toLowerCase() === want.toLowerCase());
    if (!opt) {
      console.warn(`Option '${want}' not found for field '${fieldName}'`);
      return;
    }
    await gql(`mutation($projectId:ID!,$itemId:ID!,$fieldId:ID!,$optionId:String!){ updateProjectV2ItemFieldValue(input:{ projectId:$projectId, itemId:$itemId, fieldId:$fieldId, value:{ singleSelectOptionId:$optionId }}){ projectV2Item { id } } }`, {
      projectId: project.id,
      itemId: finalItemId,
      fieldId: f.id,
      optionId: opt.id,
    });
    console.log(`Set ${fieldName}='${opt.name}' for #${issueNumber}`);
  };

  await setSingleSelect('Status', expected.Status);
  await setSingleSelect('Area', expected.Area);
  // We only fix true mismatches observed; optionally also keep these in sync:
  if (expected.Priority) await setSingleSelect('Priority', expected.Priority);
  if (expected.Phase) await setSingleSelect('Phase', expected.Phase);
};

(async () => {
  try {
    const project = await resolveProjectByTitle(PROJECT_OWNER, PROJECT_TITLE);
    const fields = await getProjectFields(project.id);
    const numbers = INPUT_NUMBERS.split(',').map(s=>parseInt(s.trim(),10)).filter(n=>Number.isFinite(n));
    for (const n of numbers) {
      await upsertItemAndSetFields(project, fields, n);
    }
    console.log(JSON.stringify({ ok: true, owner: OWNER, repo: REPO, project, numbers }, null, 2));
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  }
})();
