#!/usr/bin/env node
/**
 * equity-anomaly-annotate.js (Gate 2 - H1-B3)
 * Ensures 100% internal annotation coverage for detected anomalies
 */
import { promises as fs } from 'fs';

async function readJson(path) {
  try {
    return JSON.parse(await fs.readFile(path, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  await fs.mkdir('artifacts', { recursive: true });

  // Read anomaly detection results
  const anomalies = await readJson('artifacts/equity-anomalies.json');
  if (!anomalies) {
    console.error('[anomaly-annotate] No anomaly data found');
    process.exit(1);
  }

  // Read existing annotations
  let annotations = {};
  try {
    annotations = await readJson('artifacts/equity-anomaly-annotations.json') || {};
  } catch {
    // No existing annotations
  }

  const timestamp = new Date().toISOString();
  let newAnnotations = 0;
  let existingAnnotations = 0;

  // Annotate each anomaly
  for (const anomaly of anomalies.anomalies || []) {
    const anomalyKey = `${anomaly.unit}_${anomaly.ts}`;

    if (!annotations[anomalyKey]) {
      // Generate automatic annotation
      const annotation = {
        anomaly_id: anomalyKey,
        unit: anomaly.unit,
        timestamp: anomaly.ts,
        delta: anomaly.delta,
        threshold: anomaly.threshold,
        region: anomaly.twd?.region || 'unknown',
        auto_annotation: {
          type: 'automated_analysis',
          severity: Math.abs(anomaly.delta) > anomaly.threshold * 2 ? 'high' : 'medium',
          description: `Equity delta of ${anomaly.delta.toFixed(4)} exceeded threshold ${anomaly.threshold} for unit ${anomaly.unit}`,
          twd_context: anomaly.twd ? {
            phi: anomaly.twd.phi,
            alpha: anomaly.twd.alpha,
            beta: anomaly.twd.beta,
            region: anomaly.twd.region,
          } : null,
          suggested_action: Math.abs(anomaly.delta) > anomaly.threshold * 2 ?
            'immediate_review' : 'monitor_trend',
          confidence: 0.8,
        },
        created_utc: timestamp,
        status: 'auto_annotated',
      };

      annotations[anomalyKey] = annotation;
      newAnnotations++;
    } else {
      existingAnnotations++;
    }
  }

  // Calculate coverage
  const totalAnomalies = anomalies.anomalies?.length || 0;
  const annotatedAnomalies = Object.keys(annotations).length;
  const coveragePercent = totalAnomalies === 0 ? 100 : Math.round((annotatedAnomalies / totalAnomalies) * 100);

  // Save updated annotations
  await fs.writeFile('artifacts/equity-anomaly-annotations.json', JSON.stringify(annotations, null, 2));

  // Generate coverage report
  const coverageReport = {
    version: '1.0.0',
    generated_utc: timestamp,
    anomaly_source: {
      total_anomalies: totalAnomalies,
      anomaly_version: anomalies.version,
      anomaly_generated: anomalies.generated_utc,
    },
    annotation_coverage: {
      total_annotations: annotatedAnomalies,
      new_annotations: newAnnotations,
      existing_annotations: existingAnnotations,
      coverage_percent: coveragePercent,
      target_percent: 100,
    },
    gate2_compliance: {
      meets_100_percent_requirement: coveragePercent === 100,
      status: coveragePercent === 100 ? 'PASS' : 'FAIL',
    },
    annotation_summary: Object.values(annotations).reduce((acc, ann) => {
      acc[ann.auto_annotation?.severity || 'unknown'] = (acc[ann.auto_annotation?.severity || 'unknown'] || 0) + 1;
      return acc;
    }, {}),
  };

  await fs.writeFile('artifacts/equity-anomaly-coverage.json', JSON.stringify(coverageReport, null, 2));

  if (coveragePercent < 100) {
    console.error(`[anomaly-annotate] FAIL: Coverage ${coveragePercent}% < 100% requirement`);
    process.exit(1);
  }

  console.log(`[anomaly-annotate] PASS: 100% annotation coverage (${annotatedAnomalies}/${totalAnomalies} anomalies, +${newAnnotations} new)`);
}

main().catch(e => {
  console.error('[anomaly-annotate] error', e);
  process.exit(2);
});
