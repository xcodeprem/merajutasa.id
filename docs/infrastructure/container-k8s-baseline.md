# Container & Kubernetes Security Baseline

Scope: compliance services (orchestrator, audit, automation, privacy-rights, security-hardening).

Controls

- Image integrity: Kyverno verifyImages policy scaffold (`infrastructure/kubernetes/policies/image-verification-policy.yaml`).
- SBOM: produced in CI via Syft; images should include labels `org.opencontainers.image.source`.
- Pod Security Standards: namespace and pod annotations enforce `restricted`.
- SecurityContext: non-root UID/GID, no privilege escalation, all capabilities dropped, read-only root FS, seccomp `RuntimeDefault`, AppArmor `runtime/default`.
- NetworkPolicy: only API Gateway and Service Mesh may reach compliance pods; DNS egress allowed.

Verification

- Run: `npm run docker:status`, `npm run k8s:status`, `npm run k8s:logs` or `npm run infra:container-k8s-verify`.
- Artifacts: `artifacts/container-k8s-verify.json`, plus raw status/logs text files.
