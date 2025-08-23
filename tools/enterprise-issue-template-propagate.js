"use strict";

// Upsert a full enterprise-grade issue body block aligned with .github/ISSUE_TEMPLATE/enterprise-task.yml
// Scope: Parents (#4..#18) + their sub-issues (+ grandchildren)

import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { execFileSync } from "child_process";
import { stableStringify, addMetadata } from "./lib/json-stable.js";

// Resolve __dirname early (ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load reviewers config after __dirname is defined
const REVIEWERS_CONFIG_PATH = path.resolve(
  __dirname,
  "../config/reviewers.json"
);
let REVIEW_CFG = {
  tech_owner: process.env.TECH_OWNER || "xcodeprem",
  required_reviewers: (
    process.env.REQUIRED_REVIEWERS || "Andhika-Rey,xcodeprem"
  )
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};
try {
  const raw = await fs.readFile(REVIEWERS_CONFIG_PATH, "utf8");
  const cfg = JSON.parse(raw);
  if (cfg?.tech_owner) REVIEW_CFG.tech_owner = cfg.tech_owner;
  if (Array.isArray(cfg?.required_reviewers) && cfg.required_reviewers.length)
    REVIEW_CFG.required_reviewers = cfg.required_reviewers;
} catch {}

const OWNER = "xcodeprem";
const REPO = "merajutasa.id";

const NARRATIVES_MD = path.resolve(
  __dirname,
  "../docs/analysis/ISSUE-83-NARRATIVES-V1.md"
);
const AUDIT_JSON = path.resolve(
  __dirname,
  "../artifacts/audit/sub-issue-link-audit-2025-08-23.json"
);
const ARTIFACTS_DIR = path.resolve(__dirname, "../artifacts");
const TMP_DIR = path.join(ARTIFACTS_DIR, "tmp", "enterprise");

const BLOCK_BEGIN = "<!-- AUTO:ENTERPRISE_TEMPLATE_V1 BEGIN -->";
const BLOCK_END = "<!-- AUTO:ENTERPRISE_TEMPLATE_V1 END -->";

function runGh(args, options = {}) {
  try {
    return execFileSync("gh", args, {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
      ...options,
    }).trim();
  } catch (err) {
    const msg = err?.stdout?.toString?.() || err?.message || String(err);
    throw new Error(`gh ${args.join(" ")} failed: ${msg}`);
  }
}

async function ensureDirs() {
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.mkdir(TMP_DIR, { recursive: true });
}

function ghGraphQL(query, variables) {
  const args = ["api", "graphql", "-f", `query=${query}`];
  for (const [k, v] of Object.entries(variables || {})) {
    if (typeof v === "number" || typeof v === "boolean")
      args.push("-F", `${k}=${String(v)}`);
    else if (v && typeof v === "object")
      args.push("-F", `${k}=${JSON.stringify(v)}`);
    else args.push("-f", `${k}=${String(v)}`);
  }
  const json = runGh(args);
  return JSON.parse(json);
}

function listSubIssues(number) {
  const q = `query($owner:String!,$name:String!,$number:Int!){repository(owner:$owner,name:$name){issue(number:$number){subIssues(first:100){nodes{number title url}}}}}`;
  const d = ghGraphQL(q, { owner: OWNER, name: REPO, number });
  return (
    d?.data?.repository?.issue?.subIssues?.nodes?.map((n) => ({
      number: n.number,
      title: n.title,
      url: n.url,
    })) || []
  );
}

function getIssueBody(number) {
  const out = runGh([
    "issue",
    "view",
    String(number),
    "-R",
    `${OWNER}/${REPO}`,
    "--json",
    "body",
    "--jq",
    ".body",
  ]);
  return out || "";
}

async function writeTemp(number, body) {
  const fp = path.join(TMP_DIR, `${number}.md`);
  await fs.writeFile(fp, body, "utf8");
  return fp;
}

function updateIssueBodyFromFile(number, file) {
  runGh([
    "issue",
    "edit",
    String(number),
    "-R",
    `${OWNER}/${REPO}`,
    "--body-file",
    file,
  ]);
}

function parseNarratives(md) {
  const sections = {};
  const parts = md.split(/\n## Issue\s+(\d+):\s+([^\n]+)\n/);
  for (let i = 1; i < parts.length; i += 3) {
    const idx = parseInt(parts[i], 10);
    const title = parts[i + 1].trim();
    const body = parts[i + 2] || "";
    sections[idx] = { title, body };
  }
  return sections;
}

function mdExtract(sectionBody, heading) {
  const lines = sectionBody.split(/\r?\n/);
  const out = [];
  let capture = false;
  for (const line of lines) {
    const h = line.trim();
    if (/^\-\s*Context:/i.test(h))
      capture = heading.toLowerCase() === "context";
    else if (/^\-\s*Problem:/i.test(h))
      capture = heading.toLowerCase() === "problem";
    else if (/^\-\s*Non\-Negotiable/i.test(h))
      capture = heading.toLowerCase() === "nonneg";
    else if (/^\-\s*Deliverables:/i.test(h))
      capture = heading.toLowerCase() === "deliverables";
    else if (/^\-\s*Acceptance/i.test(h))
      capture = heading.toLowerCase() === "acceptance";
    else if (/^\-\s*DoD:/i.test(h)) capture = heading.toLowerCase() === "dod";
    else if (/^\-\s*Test Plan:/i.test(h))
      capture = heading.toLowerCase() === "testplan";
    else if (/^\-\s*Perf/i.test(h)) capture = heading.toLowerCase() === "perf";
    else if (/^\-\s*Observability/i.test(h))
      capture = heading.toLowerCase() === "observability";
    else if (/^\-\s*Docs/i.test(h)) capture = heading.toLowerCase() === "docs";
    else if (/^\-\s*Rollout/i.test(h))
      capture = heading.toLowerCase() === "rollout";
    if (
      /^\-\s+[A-Z]/.test(h) &&
      !/^\-\s*(Context|Problem|Non\-Negotiable|Deliverables|Acceptance|DoD|Test Plan|Perf|Observability|Docs|Rollout)/i.test(
        h
      )
    )
      capture = false;
    if (capture) out.push(line);
  }
  return out.join("\n").trim();
}

function buildEnterpriseBlock(issueIdx, domainTitle, sectionBody) {
  const ctx = mdExtract(sectionBody, "context");
  const prob = mdExtract(sectionBody, "problem");
  const nonneg = mdExtract(sectionBody, "nonneg");
  const deliv = mdExtract(sectionBody, "deliverables");
  const acc = mdExtract(sectionBody, "acceptance");
  const dod = mdExtract(sectionBody, "dod");
  const testplan = mdExtract(sectionBody, "testplan");
  const perf = mdExtract(sectionBody, "perf");
  const observ = mdExtract(sectionBody, "observability");
  const docs = mdExtract(sectionBody, "docs");
  const rollout = mdExtract(sectionBody, "rollout");

  const lines = [
    BLOCK_BEGIN,
    `<!-- epic:#83 domain:${issueIdx}:${domainTitle} generated:${new Date().toISOString()} -->`,
    `## Context & Problem Statement\n${
      [ctx, prob].filter(Boolean).join("\n\n") ||
      "Isi konteks & masalah secara spesifik."
    }`,
    `\n## Non-Negotiable Requirements\n${nonneg || "- HARUS ..."}`,
    `\n## Deliverables\n${
      deliv || "- Artefak, konfigurasi, file, diagram, dashboard, dsb."
    }`,
    `\n## Acceptance Criteria (semua wajib dicentang)\n- [ ] Implementasi mematuhi PR template dan semua checklist lulus\n- [ ] Unit/integration/E2E tests ditambahkan dan lulus di CI\n- [ ] CodeQL, Dependabot, dan secret scan bersih (0 critical/high)\n- [ ] Performance budgets dan beban uji lulus\n- [ ] Observability (log terstruktur, tracing, error tracking) aktif\n- [ ] Dokumentasi dan runbook lengkap dan akurat`,
    `\n## Definition of Done (DoD)\n${
      dod || "Nyatakan kondisi objektif yang menandakan tugas selesai."
    }`,
    `\n## Security & Compliance Gates\n- [ ] Tidak ada rahasia dalam repo/PR; semua via Secrets\n- [ ] Semua Actions dipin ke commit SHA\n- [ ] SBOM dihasilkan dan disimpan sebagai artifact\n- [ ] License header dan file LICENSE sesuai`,
    `\n## Test Plan\n${
      testplan ||
      "- Unit: ...\n- Integration: ...\n- E2E: ...\n- Negative cases: ...\n- Failure injection/rollback: ..."
    }`,
    `\n## Performance & Reliability\n${
      perf ||
      "- Budget: ...\n- Latency p95: ...\n- Error rate: ...\n- SLA/SLO: ...\n- Load test target: ..."
    }`,
    `\n## Observability\n${
      observ || "- Logging: ...\n- Tracing: ...\n- Metrics: ...\n- Alerts: ..."
    }`,
    `\n## Documentation & Runbooks\n${
      docs || "- README/ADR/update docs: ...\n- Playbook rilis/rollback: ..."
    }`,
    `\n## Rollout Plan & Rollback\n${
      rollout || "- Tahapan penyebaran, verifikasi, rollback teruji."
    }`,
    `\n## Tech Owner (wajib)\n@${REVIEW_CFG.tech_owner}`,
    `\n## Required Reviewers\n${REVIEW_CFG.required_reviewers
      .map((r) => `@${r}`)
      .join(" ")}`,
    `\n## Due Date (UTC, YYYY-MM-DD)\n2025-09-15`,
    BLOCK_END,
  ];
  return lines.join("\n");
}

function upsertBlock(existingBody, block) {
  if (!existingBody || typeof existingBody !== "string") existingBody = "";
  const b = existingBody.indexOf(BLOCK_BEGIN);
  const e = existingBody.indexOf(BLOCK_END);
  if (b !== -1 && e !== -1 && e > b) {
    const before = existingBody.slice(0, b).trimEnd();
    const after = existingBody.slice(e + BLOCK_END.length).trimStart();
    return [before, "", block, "", after].join("\n").trim() + "\n";
  }
  // Insert near top after H1 if present
  const lines = existingBody.split(/\r?\n/);
  let insertAt = 0;
  if (lines[0]?.startsWith("# ")) {
    insertAt = lines.findIndex((l, idx) => idx > 0 && l.trim() === "");
    insertAt = insertAt === -1 ? 1 : insertAt + 1;
  }
  const updated = [
    ...lines.slice(0, insertAt),
    "",
    block,
    "",
    ...lines.slice(insertAt),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n");
  return updated.trim() + "\n";
}

async function main() {
  await ensureDirs();
  const includeGrandchildren = process.argv.includes("--grandchildren");
  const res = {
    action: "enterprise_issue_template_propagation",
    epic: 83,
    updated: [],
    errors: [],
    options: { grandchildren: includeGrandchildren },
  };

  const md = await fs.readFile(NARRATIVES_MD, "utf8");
  const narratives = parseNarratives(md);
  const audit = JSON.parse(await fs.readFile(AUDIT_JSON, "utf8"));
  const parents = audit?.epic?.rollup_verification?.parents || [];

  for (const p of parents) {
    const parentNum = p.number;
    const issueIdx = parentNum - 3; // map parent #4..#18 -> narrative Issue 1..15
    const n = narratives[issueIdx];
    if (!n) {
      res.errors.push({
        parent: parentNum,
        error: `No narrative Issue ${issueIdx}`,
      });
      continue;
    }
    const block = buildEnterpriseBlock(issueIdx, n.title, n.body);

    // Parent itself
    try {
      const cur = getIssueBody(parentNum);
      const upd = upsertBlock(cur, block);
      if (upd !== cur) {
        const f = await writeTemp(parentNum, upd);
        updateIssueBodyFromFile(parentNum, f);
        res.updated.push({
          number: parentNum,
          role: "parent",
          status: "updated",
        });
      } else {
        res.updated.push({
          number: parentNum,
          role: "parent",
          status: "nochange",
        });
      }
    } catch (e) {
      res.errors.push({ number: parentNum, role: "parent", error: e.message });
    }

    // Children
    let children = [];
    try {
      children = listSubIssues(parentNum);
    } catch (e) {
      res.errors.push({ parent: parentNum, error: e.message });
    }
    for (const c of children) {
      try {
        const cur = getIssueBody(c.number);
        const upd = upsertBlock(cur, block);
        if (upd !== cur) {
          const f = await writeTemp(c.number, upd);
          updateIssueBodyFromFile(c.number, f);
          res.updated.push({
            number: c.number,
            role: "child",
            parent: parentNum,
            status: "updated",
          });
        } else {
          res.updated.push({
            number: c.number,
            role: "child",
            parent: parentNum,
            status: "nochange",
          });
        }
        if (includeGrandchildren) {
          const grands = listSubIssues(c.number);
          for (const g of grands) {
            try {
              const gcur = getIssueBody(g.number);
              const gupd = upsertBlock(gcur, block);
              if (gupd !== gcur) {
                const gf = await writeTemp(g.number, gupd);
                updateIssueBodyFromFile(g.number, gf);
                res.updated.push({
                  number: g.number,
                  role: "grandchild",
                  parent: parentNum,
                  child: c.number,
                  status: "updated",
                });
              } else {
                res.updated.push({
                  number: g.number,
                  role: "grandchild",
                  parent: parentNum,
                  child: c.number,
                  status: "nochange",
                });
              }
            } catch (e) {
              res.errors.push({
                number: g.number,
                role: "grandchild",
                parent: parentNum,
                child: c.number,
                error: e.message,
              });
            }
          }
        }
      } catch (e) {
        res.errors.push({
          number: c.number,
          role: "child",
          parent: parentNum,
          error: e.message,
        });
      }
    }
  }

  const outPath = path.join(
    ARTIFACTS_DIR,
    `enterprise-issue-propagation-${new Date().toISOString().slice(0, 10)}.json`
  );
  await fs.writeFile(
    outPath,
    stableStringify(
      addMetadata(res, {
        generator: "tools/enterprise-issue-template-propagate.js",
      })
    ),
    "utf8"
  );
  console.log(
    `Wrote ${outPath} (updated: ${res.updated.length}, errors: ${res.errors.length})`
  );
}

main().catch(async (err) => {
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    const p = path.join(
      ARTIFACTS_DIR,
      `enterprise-issue-propagation-error-${Date.now()}.json`
    );
    await fs.writeFile(
      p,
      stableStringify(
        addMetadata(
          { error: err?.message || String(err) },
          { generator: "tools/enterprise-issue-template-propagate.js" }
        )
      ),
      "utf8"
    );
    console.error("ERROR:", err?.message || err);
    process.exitCode = 1;
  } catch (e) {
    console.error("FATAL:", err?.message || err);
    process.exit(1);
  }
});
