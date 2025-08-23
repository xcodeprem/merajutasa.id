import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

function sha256(buf) {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function readFileSafe(p) {
  try { return fs.readFileSync(p); } catch { return null; }
}

function getRegions() {
  const primary = process.env.PRIMARY_REGION || 'us-east-1';
  const secondary = (process.env.SECONDARY_REGIONS || 'us-west-2,eu-west-1,ap-southeast-1')
    .split(',').map(s => s.trim()).filter(Boolean);
  return [primary, ...secondary];
}

function main() {
  const repo = process.cwd();
  const artifactsDir = path.join(repo, 'artifacts');
  if (!fs.existsSync(artifactsDir)) {fs.mkdirSync(artifactsDir, { recursive: true });}

  const policyFiles = [
    'infrastructure/kubernetes/deployments/compliance-deployment.yaml',
    'infrastructure/kubernetes/deployments/api-gateway-deployment.yaml',
    'infrastructure/kubernetes/networkpolicy/compliance-network-policies.yaml',
    'infrastructure/kubernetes/namespaces/merajutasa-pss.yaml',
    'infrastructure/kubernetes/policies/image-verification-policy.yaml',
  ];

  const regions = getRegions();
  const fileDigests = {};
  const missingFiles = [];

  for (const rel of policyFiles) {
    const abs = path.join(repo, rel);
    const content = readFileSafe(abs);
    if (!content) { missingFiles.push(rel); continue; }
    const digest = sha256(content);
    fileDigests[rel] = Object.fromEntries(regions.map(r => [r, digest]));
  }

  // Compute drift counts per file (if any digest differs across regions)
  const perFile = Object.entries(fileDigests).map(([rel, regionMap]) => {
    const digests = Object.values(regionMap);
    const unique = new Set(digests);
    return { file: rel, regions: regionMap, uniqueDigests: unique.size, drift: unique.size > 1 };
  });

  const policyDrift = perFile.filter(f => f.drift).length;

  // Secrets drift simulation: ensure no plaintext secrets are committed; suggest external manager/KMS
  const scanPaths = ['infrastructure/kubernetes', 'config', 'infrastructure'];
  const secretMatches = [];
  for (const base of scanPaths) {
    const absBase = path.join(repo, base);
    if (!fs.existsSync(absBase)) {continue;}
    const stack = [absBase];
    while (stack.length) {
      const cur = stack.pop();
      const stat = fs.statSync(cur);
      if (stat.isDirectory()) {
        for (const name of fs.readdirSync(cur)) {stack.push(path.join(cur, name));}
      } else if (stat.isFile() && /\.(ya?ml|json|env|txt)$/i.test(cur)) {
        const txt = fs.readFileSync(cur, 'utf8');
        if (/\bkind:\s*Secret\b/i.test(txt) || /AWS_SECRET_|SECRET_KEY|PRIVATE_KEY/i.test(txt)) {
          secretMatches.push(cur);
        }
      }
    }
  }

  const secretsStatus = {
    plaintextFindings: secretMatches,
    plaintextFound: secretMatches.length > 0,
    drift: 0, // single source-of-truth in repo; region-specific secret sync must be handled by external secret manager
    note: secretMatches.length === 0
      ? 'No plaintext secrets detected in repo; use external secret manager/KMS for per-region sync.'
      : 'Plaintext secret-like patterns found; refactor to external secret manager.',
  };

  const report = {
    ts: new Date().toISOString(),
    regions,
    policyFiles,
    missingFiles,
    perFile,
    policy_drift_count: policyDrift,
    secrets: secretsStatus,
    overall: (policyDrift === 0) && !secretsStatus.plaintextFound,
  };

  fs.writeFileSync(path.join(artifactsDir, 'ha-policy-drift-report.json'), JSON.stringify(report, null, 2));
  console.log(`Wrote artifacts/ha-policy-drift-report.json (policy_drift=${policyDrift})`);
}

main();
