# Horizon 0 Completion – Quick Guide (Windows PowerShell)

Status: checklist and commands to verify H0 deliverables locally. Use separate terminals for services.

## Acceptance checklist

- [ ] Signer service runs (port 4601) and returns /pubkey
- [ ] Chain service runs (port 4602) and /append then /verify OK
- [x] Event collector runs (port 4603) and ingests one event to `artifacts/ingested-events.ndjson`
- [x] Events validator PASS (`npm run events:validate`)
- [x] Parameter integrity PASS (`npm run param:integrity`)
- [x] Fairness unit tests PASS (`npm run test:fairness-unit`)
- [x] Spec-hash verify PASS (`npm run spec-hash:verify`)
- [x] Evidence schemas PASS (`npm run evidence:validate`)

## Start services (run each in its own terminal)

```powershell
npm run service:signer
```

```powershell
npm run service:chain
```

```powershell
npm run service:collector
```

## Quick checks

- Spec hashes / integrity / evidence:

```powershell
npm run spec-hash:verify
npm run param:integrity
npm run evidence:validate
```

- Fairness unit tests:

```powershell
npm run test:fairness-unit
```

- Events validator on sample (also backfills missing event_hash):

```powershell
npm run events:validate
```

- Collector ingest (send one minimal event):

```powershell
npm run collector:smoke
```

If the smoke script fails to connect, ensure the collector terminal shows `listening on 4603`, then retry. If ports 4601/4602 are busy for signer/chain, close any previous terminals or change ports via env vars if supported.

## Notes

- Collector writes ingested events to `artifacts/ingested-events.ndjson` (append-only NDJSON).
- Collector validates against draft 2020-12 schema, enforces `date-time` formats, computes `integrity.event_hash` when missing, and lightly redacts emails/phones in feedback-like payloads.
- Chain entries require a valid Ed25519 signature from the signer service; an optional smoke test exists at `tools/tests/chain-append-smoke.js`.

## Next steps (H1)

- Schedule signer/chain smoke as the first task: ensure ports free, start `npm run service:signer` and `npm run service:chain`, then run the chain append smoke.
- Optional snapshot for traceability:

```powershell
npm run snapshot:artifacts
```
