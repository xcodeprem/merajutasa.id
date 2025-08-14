# Methodology Snippet (H0)

Status: Decision Pending

This project applies a non-ranking fairness approach using a hysteresis method (Option F) to avoid churn. The public summary focuses on equity and trust foundations:

- Non-ranking: No league tables; only stability around entry/exit using thresholds.
- Equity index: Published as 1 − Gini on the latest snapshot.
- Trust primitives: Credentials are signed (Ed25519) and hashed; chain continuity is verifiable.
- Privacy: PII is scanned; phone/email are redacted; NIK is blocked.

Badge: Decision Pending (Hysteresis narrative and thresholds are being finalized in governance.)

References:

- DEC-20250812-02 (Hysteresis Option F)
- Event Schema v1.0 (ingestion & meta rules)
- PII Pattern Library v1.0 (runtime & corpus)

See also: `/equity` for the latest index and `/trust` for verify instructions.
