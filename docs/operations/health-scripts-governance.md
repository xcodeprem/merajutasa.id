# Health Scripts Governance: Categories & Usage Guide

Sistem health monitoring di MerajutASA.id menggunakan arsitektur dua tingkat dengan skrip terpadu dan kategorikal untuk monitoring komprehensif.

## Skrip Unified

### `health:check` - Pemeriksaan Terpadu Semua Komponen

```bash
npm run health:check
```

**Fungsi:** Menjalankan pemeriksaan kesehatan lengkap pada semua 35+ komponen infrastruktur dengan rekomendasi, dependency graph, dan laporan terintegrasi.

**Output:**

- Status keseluruhan sistem
- Health score (0-100)
- Rekomendasi perbaikan
- Urutan startup dependency
- Laporan tersimpan di `artifacts/integrated-health-report.json`

### `health:full` - Alias ke Unified

```bash
npm run health:full
```

**Fungsi:** Alias ke `health:check` untuk konsistensi penamaan.

## Skrip Subset

### `health:core` - Komponen Inti

```bash
npm run health:core
```

**Target Komponen:**

- `signer` - Service penandatangan kriptografis (port 4601)
- `chain` - Service blockchain/rantai data (port 4602)
- `collector` - Service pengumpul event (port 4603)
- `fileSystem` - Pemeriksaan sistem file dan direktori

**Use Case:** Monitoring cepat komponen dasar sebelum menjalankan operasi lain.

### `health:infra` - Infrastruktur Platform

```bash
npm run health:infra
```

**Target Komponen:**

- `haOrchestrator` - High Availability orchestrator
- `observability` - Sistem observability dan metrics
- `apiGateway` - API gateway dan service mesh
- `performance` - Performance monitoring dan cache

**Use Case:** Monitoring kesehatan layer infrastruktur untuk operasi production.

### `health:week6` - Komponen Week 6 (Compliance & Security)

```bash
npm run health:week6
```

**Target Komponen:**

- `auditSystem` - Sistem audit trail
- `complianceAutomation` - Otomasi compliance
- `securityHardening` - Security hardening tools
- `privacyRights` - Privacy rights management
- `complianceOrchestrator` - Orchestrator compliance

**Use Case:** Validasi komponen compliance dan security untuk Phase 2 Week 6.

## Skrip Kategori Infrastruktur (infra:health:*)

### `infra:health:all` - Semua Kategori Infrastruktur

```bash
npm run infra:health:all
```

**Fungsi:** Menjalankan health check pada semua kategori infrastruktur dengan fail-soft behavior.

### `infra:health:observability` - Observability Stack

```bash
npm run infra:health:observability
```

**Target Modules:**

- `infrastructure/observability/advanced-observability-system.js`

**Output:** Status sistem observability, metrics collection, tracing, dan monitoring.

### `infra:health:performance` - Performance Monitoring

```bash
npm run infra:health:performance
```

**Target Modules:**

- `infrastructure/performance/monitoring/sla-monitor.js`
- `infrastructure/performance/cache/cache-strategies.js`

**Output:** Status SLA monitoring, cache performance, dan resource usage.

### `infra:health:api-gateway` - API Gateway

```bash
npm run infra:health:api-gateway
```

**Target Modules:**

- `infrastructure/api-gateway/api-gateway-orchestrator.js`
- `infrastructure/api-gateway/service-mesh.js`

**Output:** Status API gateway, service mesh topology, dan routing health.

### `infra:health:high-availability` - High Availability

```bash
npm run infra:health:high-availability
```

**Target Modules:**

- `infrastructure/high-availability/ha-orchestrator.js`
- `infrastructure/high-availability/health-monitoring.js`
- `infrastructure/high-availability/auto-scaling.js`

**Output:** Status HA cluster, auto-scaling, load balancing, dan failover readiness.

### `infra:health:compliance` - Compliance Systems

```bash
npm run infra:health:compliance
```

**Target Modules:**

- `infrastructure/compliance/audit-system.js`
- `infrastructure/compliance/compliance-automation.js`
- `infrastructure/compliance/compliance-orchestrator.js`
- `infrastructure/compliance/privacy-rights-management.js`

**Output:** Status audit trail, compliance automation, dan privacy rights.

### `infra:health:security` - Security Hardening

```bash
npm run infra:health:security
```

**Target Modules:**

- `infrastructure/security/enhanced/security-hardening.js`

**Note:** Script ini menggunakan fail-soft behavior karena security scan dapat tidak stabil.

### `infra:health:monitoring` - Monitoring Infrastructure

```bash
npm run infra:health:monitoring
```

**Target Modules:**

- `infrastructure/monitoring/metrics-collector.js`
- `infrastructure/monitoring/structured-logger.js`

**Output:** Status metrics collection, structured logging, dan alerting.

### `infra:health:integrations` - System Integrations

```bash
npm run infra:health:integrations
```

**Target Modules:**

- `infrastructure/integration/component-dependency-analyzer.js`
- `infrastructure/integration/infrastructure-integration-platform.js`

**Output:** Status integrasi antar komponen dan dependency health.

### `infra:health:dependencies` - Dependency Health

```bash
npm run infra:health:dependencies
```

**Target Modules:** Module-module dependency analyzer dan external service health checks.

## Arsitektur Health Check

### Dua Tingkat Pemeriksaan

1. **Integrated Health Check** (`tools/integrated-health-check.js`)
   - Pemeriksaan end-to-end semua komponen
   - Rekomendasi dan dependency graph
   - Laporan terintegrasi dengan metadata

2. **Infrastructure Health Check** (`tools/infra/health-check-all.js`)
   - Pemeriksaan per-kategori infrastruktur
   - Fail-soft behavior untuk stabilitas
   - Artifacts JSON deterministik

### Contract Health Object

```javascript
{
  component: "componentName",
  status: "healthy|degraded|critical", 
  health_score: 0-100,
  timestamp: "ISO8601",
  details: { /* component-specific data */ }
}
```

## Panduan Penggunaan

### Monitoring Rutin

```bash
# Check kesehatan dasar harian
npm run health:core

# Check infrastruktur mingguan  
npm run health:infra

# Check compliance bulanan
npm run health:week6

# Full audit quarterly
npm run health:check
```

### Troubleshooting

```bash
# Triage sempit per kategori
npm run infra:health:observability
npm run infra:health:performance
npm run infra:health:security

# Debug dengan detail
npm run health:check  # Lihat rekomendasi dan dependency graph

# Check artifacts
ls artifacts/integrated-health-report.json
ls artifacts/infra-health-*.json
```

### CI/CD Integration

```bash
# Pre-deployment validation
npm run health:core && npm run health:infra

# Post-deployment verification
npm run health:check

# Security compliance gate
npm run infra:health:security || echo "Security scan failed (expected in some environments)"
```

## Artifacts Output

### Integrated Health Report

**Lokasi:** `artifacts/integrated-health-report.json`

**Content:**

- Overall system status dan health score
- Per-component health details
- System recommendations
- Dependency startup order
- Execution metadata

### Infrastructure Health Reports  

**Lokasi:** `artifacts/infra-health-{category}.json`

**Content:**

- Category-specific component health
- Fail-soft status indicators
- Module-level health details
- Execution timestamps

## Exit Codes

- **0:** Semua komponen healthy
- **1:** Ada komponen critical atau gagal total
- **Warn:** Komponen degraded (tidak mempengaruhi exit code untuk fail-soft)

## Environment Variables

```bash
# Service ports (opsional)
export SIGNER_PORT=4601
export CHAIN_PORT=4602  
export COLLECTOR_PORT=4603

# Health check timeouts
export HEALTH_CHECK_TIMEOUT=5000  # 5 detik per komponen
```

## Catatan Penting

1. **Fail-Soft Strategy**: Infrastructure health checks menggunakan fail-soft untuk stabilitas production
2. **Security Scan**: `infra:health:security` dapat tidak stabil - gunakan dengan fail-soft expectation
3. **Port Dependencies**: Core service health checks membutuhkan service aktif pada port default
4. **Artifacts**: Semua health check menggunakan deterministic JSON output via `json-stable.js`
5. **Triage**: Gunakan kategori specific (`infra:health:*`) untuk troubleshooting sempit

---

**Integration dengan Governance Pipeline:**
Health scripts terintegrasi dengan `npm run governance:verify` dan quality gates untuk memastikan sistem health sebelum operasi critical.
