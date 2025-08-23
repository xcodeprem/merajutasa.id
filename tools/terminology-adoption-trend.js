#!/usr/bin/env node
/**
 * terminology-adoption-trend.js (Gate 2 - H1-F1)
 * Generates terminology adoption trend reports in ndjson/json format
 * Supports both single-shot and trend aggregation modes
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

  // Get current adoption data
  const currentReport = await readJson('artifacts/terminology-adoption.json');
  const timestamp = new Date().toISOString();

  if (!currentReport) {
    console.error('[terminology-trend] No current adoption data found');
    process.exit(1);
  }

  // Create trend entry
  const trendEntry = {
    timestamp,
    adoptionPercent: currentReport.adoptionPercent,
    old_total: currentReport.old_total,
    new_total: currentReport.new_total,
    files_scanned: currentReport.files.length,
    suggestions_count: currentReport.suggestions?.length || 0,
  };

  // Read existing trend data
  let trendData = [];
  try {
    const existing = await fs.readFile('artifacts/terminology-adoption-trend.ndjson', 'utf8');
    trendData = existing.trim().split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
  } catch {
    // File doesn't exist yet
  }

  // Append new entry
  trendData.push(trendEntry);

  // Keep only last 30 entries to prevent infinite growth
  if (trendData.length > 30) {
    trendData = trendData.slice(-30);
  }

  // Write NDJSON format
  const ndjsonContent = trendData.map(entry => JSON.stringify(entry)).join('\n') + '\n';
  await fs.writeFile('artifacts/terminology-adoption-trend.ndjson', ndjsonContent);

  // Generate aggregated JSON report
  const summary = {
    version: '1.0.0',
    generated_utc: timestamp,
    entries_count: trendData.length,
    current: trendEntry,
    history: trendData,
    trend_analysis: {
      latest_adoption: trendEntry.adoptionPercent,
      avg_adoption_last_7: trendData.slice(-7).reduce((sum, e) => sum + e.adoptionPercent, 0) / Math.min(7, trendData.length),
      suggestion_reduction: trendData.length >= 2 ?
        trendData[trendData.length - 2].suggestions_count - trendEntry.suggestions_count : 0,
    },
  };

  await fs.writeFile('artifacts/terminology-adoption-trend.json', JSON.stringify(summary, null, 2));

  console.log(`[terminology-trend] Generated trend report: ${trendData.length} entries, current adoption: ${trendEntry.adoptionPercent}%`);
}

main().catch(e => {
  console.error('[terminology-trend] error', e);
  process.exit(2);
});
