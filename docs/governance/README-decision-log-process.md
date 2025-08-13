# Decision Log Process (Excerpt – Updated for DEC-20250812-02)

This update APPENDS process rules to include hysteresis parameter locking.

## Parameter Lock Rule

Any runtime constants governing fairness classification (hysteresis-config-v1.yml) MUST match deployed code. Divergence:

1. Build 1: Warning (recorded)
2. Build 2 consecutive: CI FAIL (policy hysteresis.params.lock)

## DEC Cross-Hashing

- Each DEC file must include hash_of_decision_document (computed post-merge) and optional config hash if a config file is associated.
- Chain Event (future): type=DEC_REFERENCE stores (dec_id, config_hash).

## Mapping Table (Current)

| DEC ID | Domain | Status |
|--------|--------|--------|
| DEC-20250812-02 | Hysteresis Option F Adoption | adopted |

(Add future DEC entries; do not remove historical rows.)

End of appended process.
