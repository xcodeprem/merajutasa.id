import fs from 'fs';
import path from 'path';

function textIncludesAll(txt, needles) {
  return needles.every(n => txt.includes(n));
}

function validateFile(filePath, expectations) {
  const txt = fs.readFileSync(filePath, 'utf8');
  const results = expectations.map(e => ({ key: e.key, ok: textIncludesAll(txt, e.matchAll) }));
  return { file: filePath, ok: results.every(r => r.ok), results };
}

function main() {
  const artifactsDir = path.join(process.cwd(), 'artifacts');
  if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });

  const checks = [];
  // Compliance deployments file
  checks.push(validateFile(
    path.join(process.cwd(), 'infrastructure/kubernetes/deployments/compliance-deployment.yaml'),
    [
      { key: 'seccompProfile', matchAll: ['seccompProfile:', 'type: RuntimeDefault'] },
      { key: 'pss.enforce', matchAll: ['pod-security.kubernetes.io/enforce: restricted'] },
      { key: 'apparmor', matchAll: ['container.apparmor.security.beta.kubernetes.io/'] },
      { key: 'container.securityContext', matchAll: ['allowPrivilegeEscalation: false', 'readOnlyRootFilesystem: true', 'capabilities:', 'drop:', '- ALL'] },
    ]
  ));
  // API gateway deployments file
  checks.push(validateFile(
    path.join(process.cwd(), 'infrastructure/kubernetes/deployments/api-gateway-deployment.yaml'),
    [
      { key: 'seccompProfile', matchAll: ['seccompProfile:', 'type: RuntimeDefault'] },
      { key: 'pss.enforce', matchAll: ['pod-security.kubernetes.io/enforce: restricted'] },
      { key: 'apparmor', matchAll: ['container.apparmor.security.beta.kubernetes.io/'] },
      { key: 'container.securityContext', matchAll: ['allowPrivilegeEscalation: false', 'readOnlyRootFilesystem: true', 'capabilities:', 'drop:', '- ALL'] },
    ]
  ));

  const policies = {
    networkPolicy: fs.existsSync(path.join(process.cwd(), 'infrastructure/kubernetes/networkpolicy/compliance-network-policies.yaml')),
    namespacePSS: fs.existsSync(path.join(process.cwd(), 'infrastructure/kubernetes/namespaces/merajutasa-pss.yaml')),
    imageVerification: fs.existsSync(path.join(process.cwd(), 'infrastructure/kubernetes/policies/image-verification-policy.yaml')),
  };

  const overall = checks.every(c => c.ok) && Object.values(policies).every(Boolean);
  const report = { ts: new Date().toISOString(), files: checks, policies, overall };
  fs.writeFileSync(path.join(artifactsDir, 'k8s-baseline-validate.json'), JSON.stringify(report, null, 2));
  console.log(`Wrote artifacts/k8s-baseline-validate.json (overall=${overall ? 'PASS' : 'FAIL'})`);
}

main();
