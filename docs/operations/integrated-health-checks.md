# Integrated Infrastructure Health (Baseline)

Entrypoint:

- `npm run health:check` → `node tools/integrated-health-check.js`
- Laporan: `artifacts/integrated-health-check-report.json`
- Exit code: 1 jika `overall_status` = `critical`, 0 selain itu.

Komponen yang dicakup (sesuai implementasi saat ini):

- signer, chain, collector
- auditSystem, complianceAutomation, securityHardening, privacyRights, complianceOrchestrator
- haOrchestrator, observability, logAggregation, apiGateway, performance
- fileSystem

Contoh subset:

```
node tools/integrated-health-check.js signer chain collector
```

Ringkasan output meliputi:

- `overall_status`, `overall_health_score`, `components`, `system_dependencies`, `recommendations`
