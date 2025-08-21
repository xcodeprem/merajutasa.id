# Infra Health Triage Runbook

Runbook operasional untuk melakukan triage berdasarkan output health check infrastruktur.

## Cara Menjalankan

```bash
npm run health:check
```

**Laporan**: `artifacts/integrated-health-check-report.json`

## Memahami Laporan Health Check

### Bidang Penting pada Laporan

- **`overall_status`**: `healthy|warning|degraded|critical` - Status keseluruhan sistem
- **`overall_health_score`**: 0-100 - Skor kesehatan keseluruhan 
- **`components`**: Status per komponen individu dengan detail
- **`system_dependencies.startup_order`**: Fase startup komponen berdasarkan dependency
- **`system_dependencies.dependencies`**: Ketergantungan antar komponen
- **`recommendations`**: Rekomendasi prioritas `high|medium|low` untuk perbaikan

### Status Level Komponen

- **`healthy`** (100-80): Komponen berfungsi normal
- **`warning`** (79-60): Ada masalah ringan, perlu monitoring
- **`degraded`** (59-40): Kinerja menurun, perlu investigasi
- **`critical`** (0-39): Komponen tidak responsif, perlu intervensi segera

## Triage Cepat

### Status `critical` (Overall Health Score < 40)

**Fokus**: Komponen dengan status `critical` pada `components[*]`

**Langkah**:
1. Identifikasi komponen critical dari laporan
2. Periksa error message di `components[component_name].error`
3. Lakukan restart/inspeksi log sesuai rekomendasi `high` priority
4. Verifikasi dependency order untuk startup yang benar

**Contoh**:
```bash
# Jika signer/chain/collector critical
npm run service:signer &
npm run service:chain &
npm run service:collector &

# Tunggu beberapa detik, lalu test ulang
npm run health:core
```

### Status `degraded` (40-60) / `warning` (60-80)

**Fokus**: Pantau resource dan konfigurasi komponen terkait

**Langkah**:
1. Review komponen dengan status warning/degraded
2. Periksa resource usage dan konfigurasi di `details`
3. Monitor trend dan implementasi rekomendasi `medium/low` priority
4. Gunakan subset health check untuk monitoring lanjutan

### Status `healthy` (> 80)

**Fokus**: Maintenance rutin dan optimisasi

**Langkah**:
1. Review rekomendasi `low` priority untuk optimisasi
2. Monitor dependency health secara berkala
3. Implementasi improvement berdasarkan recommendations

## Subset Commands untuk Focused Troubleshooting

```bash
# Core services (signer, chain, collector, fileSystem)
npm run health:core

# Infrastructure services 
npm run health:infra

# Week 6 compliance components
npm run health:week6

# Kategori spesifik
npm run infra:health:observability
npm run infra:health:performance  
npm run infra:health:api-gateway
npm run infra:health:high-availability
npm run infra:health:compliance
npm run infra:health:security
npm run infra:health:monitoring
```

## Dependency Order dan Startup Strategy

Gunakan `system_dependencies.startup_order` untuk startup yang benar:

**Phase 1**: File System
- Validasi akses file system dasar

**Phase 2**: Core Services (Paralel)
- `signer`, `chain`, `collector`
- Services ini bisa distart bersamaan

**Phase 3**: Foundation Services  
- `auditSystem`, `logAggregation`
- Butuh file system, mendukung services selanjutnya

**Phase 4**: Compliance & Security
- `securityHardening`, `privacyRights`, `complianceAutomation` 
- Butuh audit dan logging

**Phase 5**: Orchestration
- `complianceOrchestrator`, `observability`
- Coordinate services dari phase sebelumnya

**Phase 6**: Infrastructure
- `haOrchestrator`, `apiGateway`, `performance`
- Services tingkat tinggi yang butuh foundation lengkap

## Troubleshooting Common Issues

### Services Tidak Responding (Critical)

**Gejala**: `fetch failed` error, health_score = 0

**Solusi**:
1. Periksa apakah service berjalan di port yang benar
2. Check environment variables (`SIGNER_PORT`, `CHAIN_PORT`, `COLLECTOR_PORT`)
3. Restart service yang bermasalah
4. Verifikasi dependency services sudah running

### Module/Package Tidak Ditemukan

**Gejala**: `Cannot find module` atau `Cannot find package` error

**Solusi**:
1. Jalankan `npm ci` untuk install dependencies
2. Periksa apakah file/module exists di path yang dimaksud
3. Untuk optional modules, abaikan jika tidak critical untuk operasi

### Compliance Issues

**Gejala**: Compliance score rendah, violation rate tinggi

**Solusi**:
1. Review `activeAlerts` dalam compliance automation detail
2. Implementasikan rekomendasi dari compliance assessment
3. Monitor framework compliance secara individual

## CI/CD Integration

### Exit Codes
- **Exit code 0**: `overall_status` selain `critical`
- **Exit code 1**: `overall_status = critical` - cocok untuk gating di CI/CD

### Pipeline Integration
```bash
# Dalam CI/CD pipeline
npm run health:check
if [ $? -ne 0 ]; then
  echo "Critical infrastructure issues detected"
  exit 1
fi
```

## Monitoring dan Alerting

### Automated Monitoring
```bash
# Setup monitoring berkala
*/5 * * * * cd /path/to/project && npm run health:check

# Alert pada critical status
npm run health:check || echo "ALERT: Infrastructure critical" | mail admin@domain.com
```

### Proactive Health Checks
```bash
# Morning health check routine
npm run health:check
npm run health:core      # Focus on core services
npm run health:week6     # Check compliance components
```

## Best Practices

1. **Regular Monitoring**: Jalankan health check minimal setiap 5 menit untuk production
2. **Dependency Awareness**: Selalu ikuti startup order saat restart services
3. **Focused Debugging**: Gunakan subset commands untuk isolasi masalah
4. **Log Review**: Selalu periksa error messages di laporan untuk troubleshooting
5. **Preventive Action**: Tangani warning/degraded status sebelum menjadi critical
6. **Documentation**: Update runbook berdasarkan pengalaman troubleshooting baru

## Quick Reference

| Status | Priority | Action |
|--------|----------|--------|
| Critical | HIGH | Restart services, check logs, verify dependencies |
| Degraded | MEDIUM | Monitor resources, investigate configuration |  
| Warning | MEDIUM | Review config, monitor trends |
| Healthy | LOW | Routine maintenance, optimization |

**Remember**: Exit code non-0 ketika `overall_status=critical`, cocok untuk gating di CI/CD pipeline.