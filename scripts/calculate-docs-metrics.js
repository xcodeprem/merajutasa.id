#!/usr/bin/env node

/**
 * Documentation Metrics Calculator
 * Generates repeatable metrics for documentation and infrastructure
 * Outputs to artifacts/docs-metrics.json for evidence-based tracking
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function calculateDirectoryStats(dirPath) {
  try {
    // Calculate total size in KB
    const sizeOutput = execSync(`du -sk "${dirPath}" 2>/dev/null | cut -f1`, { encoding: 'utf8' });
    const sizeKB = parseInt(sizeOutput.trim()) || 0;

    // Count files
    const fileCount = execSync(`find "${dirPath}" -type f 2>/dev/null | wc -l`, { encoding: 'utf8' });
    const files = parseInt(fileCount.trim()) || 0;

    // Count markdown files specifically for docs
    const markdownCount = execSync(`find "${dirPath}" -name "*.md" 2>/dev/null | wc -l`, { encoding: 'utf8' });
    const markdownFiles = parseInt(markdownCount.trim()) || 0;

    return { sizeKB, files, markdownFiles };
  } catch (error) {
    console.warn(`Warning: Could not calculate stats for ${dirPath}:`, error.message);
    return { sizeKB: 0, files: 0, markdownFiles: 0 };
  }
}

function calculateInfrastructureStats() {
  try {
    // Calculate infrastructure code size (infrastructure/ + tools/)
    const infraSize = execSync('du -sk infrastructure/ tools/ 2>/dev/null | awk \'{sum+=$1} END {print sum}\'', { encoding: 'utf8' });
    const sizeKB = parseInt(infraSize.trim()) || 0;

    // Count infrastructure components (code files)
    const componentCount = execSync('find infrastructure/ tools/ -type f -name "*.js" -o -name "*.json" -o -name "*.yml" -o -name "*.yaml" -o -name "*.tf" -o -name "*.md" 2>/dev/null | wc -l', { encoding: 'utf8' });
    const components = parseInt(componentCount.trim()) || 0;

    return { sizeKB, components };
  } catch (error) {
    console.warn('Warning: Could not calculate infrastructure stats:', error.message);
    return { sizeKB: 0, components: 0 };
  }
}

function main() {
  const timestamp = new Date().toISOString();

  // Calculate documentation stats
  const docsStats = calculateDirectoryStats('docs/');

  // Calculate infrastructure stats
  const infraStats = calculateInfrastructureStats();

  // Generate metrics object
  const metrics = {
    generated_at: timestamp,
    documentation: {
      total_size_kb: docsStats.sizeKB,
      total_files: docsStats.files,
      markdown_files: docsStats.markdownFiles,
      size_mb: Math.round(docsStats.sizeKB / 1024 * 10) / 10,
    },
    infrastructure: {
      total_size_kb: infraStats.sizeKB,
      total_components: infraStats.components,
      size_mb: Math.round(infraStats.sizeKB / 1024 * 10) / 10,
    },
    summary: {
      docs_description: `${Math.round(docsStats.sizeKB / 1024 * 10) / 10}MB across ${docsStats.markdownFiles} documentation files`,
      infra_description: `${Math.round(infraStats.sizeKB / 1024 * 10) / 10}MB across ${infraStats.components} enterprise components`,
    },
  };

  // Ensure artifacts directory exists
  const artifactsDir = 'artifacts';
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }

  // Write metrics to artifacts
  const outputPath = path.join(artifactsDir, 'docs-metrics.json');
  fs.writeFileSync(outputPath, JSON.stringify(metrics, null, 2));

  console.log('Documentation metrics calculated:');
  console.log(`- Documentation: ${metrics.summary.docs_description}`);
  console.log(`- Infrastructure: ${metrics.summary.infra_description}`);
  console.log(`- Output saved to: ${outputPath}`);

  return metrics;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main, calculateDirectoryStats, calculateInfrastructureStats };
