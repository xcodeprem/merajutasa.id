# Next steps – DSR validation

- Add CLI flags to choose request type and jurisdiction (e.g., --type=erasure|portability --jurisdiction=ccpa|gdpr).
- Extend E2E to attach request evidence bundles and link to audit event IDs in the summary.
- Wire docs/privacy/dsr-validation.md into governance artifacts index for CI surfacing.
- Add a lightweight test to assert 4 audit events exist per run (received, verified, fulfilled, closed).
- Optional: redact/mask additional fields in audit details based on privacy policy updates.

Generated on 2025-08-22.
