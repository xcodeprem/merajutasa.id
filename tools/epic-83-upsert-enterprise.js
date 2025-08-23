'use strict';

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';
import { stableStringify, addMetadata } from './lib/json-stable.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OWNER = 'xcodeprem';
const REPO = 'merajutasa.id';
const ISSUE = 83;
const ARTIFACTS_DIR = path.resolve(__dirname, '../artifacts');
const TMP_DIR = path.join(ARTIFACTS_DIR, 'tmp', 'epic-83');
const REVIEWERS_CONFIG_PATH = path.resolve(
  __dirname,
  '../config/reviewers.json',
);
const REVIEW_CFG = {
  tech_owner: process.env.TECH_OWNER || 'xcodeprem,Farid-Ze',
  required_reviewers: (
    process.env.REQUIRED_REVIEWERS || 'Andhika-Rey,xcodeprem,Farid-Ze'
  )
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),
};
try {
  const raw = await fs.readFile(REVIEWERS_CONFIG_PATH, 'utf8');
  const cfg = JSON.parse(raw);
  if (cfg?.tech_owner) {REVIEW_CFG.tech_owner = cfg.tech_owner;}
  if (Array.isArray(cfg?.required_reviewers) && cfg.required_reviewers.length)
  {REVIEW_CFG.required_reviewers = cfg.required_reviewers;}
} catch {}

const BLOCK_BEGIN = '<!-- AUTO:ENTERPRISE_TEMPLATE_V1 BEGIN -->';
const BLOCK_END = '<!-- AUTO:ENTERPRISE_TEMPLATE_V1 END -->';

function runGh(args, options = {}) {
  try {
    return execFileSync('gh', args, {
      encoding: 'utf8',
      maxBuffer: 2 * 1024 * 1024,
      ...options,
    }).trim();
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
  const out = runGh([
    'issue',
    'view',
    String(number),
    '-R',
    `${OWNER}/${REPO}`,
    '--json',
    'body',
    '--jq',
    '.body',
  ]);
  return out || '';
}

async function writeTemp(number, body) {
  const fp = path.join(TMP_DIR, `${number}.md`);
  await fs.writeFile(fp, body, 'utf8');
  return fp;
}

function updateIssueBodyFromFile(number, file) {
  runGh([
    'issue',
    'edit',
    String(number),
    '-R',
    `${OWNER}/${REPO}`,
    '--body-file',
    file,
  ]);
}

function upsertBlock(existingBody, block) {
  if (!existingBody || typeof existingBody !== 'string') {existingBody = '';}
  const b = existingBody.indexOf(BLOCK_BEGIN);
  const e = existingBody.indexOf(BLOCK_END);
  if (b !== -1 && e !== -1 && e > b) {
    const before = existingBody.slice(0, b).trimEnd();
    const after = existingBody.slice(e + BLOCK_END.length).trimStart();
    return [before, '', block, '', after].join('\n').trim() + '\n';
  }
  // Insert near top after H1 if present
  const lines = existingBody.split(/\r?\n/);
  let insertAt = 0;
  if (lines[0]?.startsWith('# ')) {
    insertAt = lines.findIndex((l, idx) => idx > 0 && l.trim() === '');
    insertAt = insertAt === -1 ? 1 : insertAt + 1;
  }
  const updated = [
    ...lines.slice(0, insertAt),
    '',
    block,
    '',
    ...lines.slice(insertAt),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n');
  return updated.trim() + '\n';
}

function buildEpicEnterpriseBlock() {
  const lines = [
    BLOCK_BEGIN,
    `<!-- epic:${ISSUE} program:hardening generated:${new Date().toISOString()} -->`,
    '## Context & Problem Statement',
    'Program pembangunan dan hardening menyatukan 15 domain kualitas (governance, CI/CD, supply chain, testing, dokumentasi, IaC/policy, kontainerisasi/rilis, environment/rahasia, observability, kontrak API, kinerja/ketahanan, audit keamanan, manajemen data). Tanpa standar non-negotiable, risiko insiden, regresi, dan ketidakpatuhan meningkat.',
    '',
    '## Non-Negotiable Requirements',
    '- HARUS LICENSE, CODEOWNERS, CONTRIBUTING, CoC, Issue/PR templates terpakai otomatis.',
    '- HARUS CI matrix (Node LTS) dengan lint, typecheck, unit/integration/E2E, coverage ≥ 80%, anotasi PR.',
    '- HARUS CodeQL, Dependabot, Secret Scanning + Push Protection aktif; PR gagal bila ada temuan critical/high.',
    '- HARUS pin semua GitHub Actions ke commit SHA.',
    '- HARUS SBOM per build + provenance/attestation; artefak bertanda tangan dan tervalidasi.',
    '- HARUS ADR dan diagram arsitektur terkini; README operasional; runbook insiden dan rilis/rollback.',
    '- HARUS Terraform remote state + locking, plan di PR, apply di branch terlindungi; OPA/Conftest gate; tfsec/Checkov.',
    '- HARUS drift detection terjadwal dan artefak laporan.',
    '- HARUS Dockerfile aman (multi-stage, non-root, healthcheck); build multi-arch; push GHCR; release otomatis.',
    '- HARUS Environments (dev/stg/prod) dengan required reviewers; rahasia hanya via GitHub Secrets.',
    '- HARUS Observability: logging JSON+trace-id, OpenTelemetry tracing, metrics, dashboards, alerts, error tracking.',
    '- HARUS OpenAPI untuk layanan, contract testing di CI, rate limiting dan standar authN/Z.',
    '- HARUS Performance budgets, load test (k6) dengan SLA p95/p99, rollback drills.',
    '- HARUS Siklus audit keamanan triwulan (SCA/SAST/DAST) + threat modeling (STRIDE).',
    '- HARUS Backup/restore drill dengan RTO/RPO terukur; enkripsi in-transit dan at-rest.',
    '- HARUS branch protection: required checks (CI, guard PR template), review ≥ 1, status checks wajib hijau.',
    '',
    '## Deliverables',
    '- YAML workflows (build/test/coverage, CodeQL, SBOM/provenance, release).',
    '- Governance files (.github/, LICENSE, CODEOWNERS, CONTRIBUTING, CoC).',
    '- ADRs, diagram, README, runbooks.',
    '- Terraform pipelines + policy-as-code + laporan scan & drift.',
    '- Dockerfile + release automation + GHCR images bertanda tangan.',
    '- OpenAPI + contract tests + gateway policy.',
    '- Observability configs, dashboards, alerts.',
    '- Backup scripts/schedule + drill report.',
    '',
    '## Acceptance Criteria (semua wajib dicentang)',
    '- [ ] Semua PR menunjukkan required checks hijau; guard PR template lulus.',
    '- [ ] Coverage ≥ 80%, target > 90% progresif.',
    '- [ ] CodeQL/Dependabot/Secret scan: 0 critical/high pada PR.',
    '- [ ] SBOM + attestation tersedia dan tervalidasi di setiap rilis.',
    '- [ ] Image/container lulus scan dan signature valid.',
    '- [ ] Environments butuh approval untuk prod; audit trail utuh.',
    '- [ ] Drift = 0 pada laporan berkala; IaC gate enforced.',
    '- [ ] Backup drill sukses; RTO/RPO terpenuhi.',
    '',
    '## Definition of Done (DoD)',
    'Semua gate aktif dan enforced pada main (branch protection), evidence artefak tersimpan, dan dashboard observability menunjukkan status sehat.',
    '',
    '## Security & Compliance Gates',
    '- [ ] Secret scanning + Push Protection aktif',
    '- [ ] Actions pin SHA',
    '- [ ] SBOM + provenance + signature',
    '- [ ] LICENSE & notices konsisten',
    '',
    '## Test Plan',
    '- Unit: domain logika utama',
    '- Integration: kontrak API, pipeline IaC',
    '- E2E: alur build→release→deploy→observability',
    '- Negative: policy gate fail, secret push ditolak',
    '- Failure injection/rollback: validasi playbook',
    '',
    '## Performance & Reliability',
    '- Budgets terdefinisi; p95/p99 sesuai SLA; error rate < budget; HA checks hijau.',
    '',
    '## Observability',
    '- Logging JSON, tracing OTel, metrics, alerts, dashboards; error tracking aktif.',
    '',
    '## Documentation & Runbooks',
    '- README/ADR/diagram mutakhir; playbook rilis/rollback diuji.',
    '',
    '## Rollout Plan & Rollback',
    'Aktifkan proteksi bertahap (PR→branch protection→environments) dengan verifikasi dan rollback plan teruji.',
    '',
    '## Tech Owner (wajib)',
    `@${REVIEW_CFG.tech_owner}`,
    '',
    '## Required Reviewers',
    REVIEW_CFG.required_reviewers.map((r) => `@${r}`).join(' '),
    '',
    '## Due Date (UTC, YYYY-MM-DD)',
    '2025-09-15',
    BLOCK_END,
  ];
  return lines.join('\n');
}

async function main() {
  await ensureDirs();
  const res = {
    action: 'epic_enterprise_upsert',
    epic: ISSUE,
    updated: false,
    error: null,
  };
  const current = getIssueBody(ISSUE);
  const block = buildEpicEnterpriseBlock();
  const updated = upsertBlock(current, block);
  if (updated !== current) {
    const fp = await writeTemp(ISSUE, updated);
    updateIssueBodyFromFile(ISSUE, fp);
    res.updated = true;
  }
  const out = path.join(
    ARTIFACTS_DIR,
    `epic-83-enterprise-upsert-${new Date().toISOString().slice(0, 10)}.json`,
  );
  await fs.writeFile(
    out,
    stableStringify(
      addMetadata(res, { generator: 'tools/epic-83-upsert-enterprise.js' }),
    ),
    'utf8',
  );
  console.log(`Wrote ${out} (updated:${res.updated})`);
}

main().catch(async (err) => {
  try {
    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    const p = path.join(
      ARTIFACTS_DIR,
      `epic-83-enterprise-upsert-error-${Date.now()}.json`,
    );
    await fs.writeFile(
      p,
      stableStringify(
        addMetadata(
          { error: err?.message || String(err) },
          { generator: 'tools/epic-83-upsert-enterprise.js' },
        ),
      ),
      'utf8',
    );
    console.error('ERROR:', err?.message || err);
    process.exitCode = 1;
  } catch (e) {
    console.error('FATAL:', err?.message || err);
    process.exit(1);
  }
});
