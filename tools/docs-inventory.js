#!/usr/bin/env node
/**
 * docs-inventory.js
 * Generate comprehensive inventory of docs/ directory:
 * - Scan all .md files
 * - Extract H1/H2 headers
 * - Get last commit timestamps
 * - Categorize by domain
 * - Identify gaps based on PR template references
 *
 * Outputs:
 * - docs/_inventory/report.json
 * - docs/_inventory/summary.md
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const DOCS_DIR = path.join(ROOT_DIR, 'docs');
const INVENTORY_DIR = path.join(ROOT_DIR, 'docs', '_inventory');
const REPORT_JSON = path.join(INVENTORY_DIR, 'report.json');
const SUMMARY_MD = path.join(INVENTORY_DIR, 'summary.md');

// Domain categorization based on directory structure
const DOMAIN_MAPPING = {
  'analysis': 'Architecture & Analysis',
  'analytics': 'Analytics & Events',
  'api': 'API Documentation',
  'architecture': 'Architecture & Analysis',
  'archive': 'Archive',
  'audit': 'Governance',
  'data': 'Data & Schemas',
  'development': 'Development',
  'fairness': 'Fairness & Equity',
  'faq': 'Support & FAQ',
  'feedback': 'User Feedback',
  'gap-analysis': 'Analysis & Planning',
  'governance': 'Governance',
  'implementation': 'Implementation',
  'infrastructure': 'Infrastructure',
  'integrity': 'Integrity & Security',
  'legal': 'Legal & Compliance',
  'master-spec': 'Specifications',
  'master-spec-deltas': 'Specifications',
  'onboarding': 'Onboarding & Setup',
  'operations': 'Operations & Runbooks',
  'phase-1': 'Project Phases',
  'phase-2': 'Project Phases',
  'planning': 'Planning & Strategy',
  'playbooks': 'Operations & Runbooks',
  'policies': 'Policies & Guidelines',
  'principles': 'Principles & Guidelines',
  'privacy': 'Privacy & Data Protection',
  'produk': 'Product Specifications',
  'public': 'Public Documentation',
  'quick-reference': 'Reference & Guides',
  'release': 'Release Management',
  'roadmap': 'Planning & Strategy',
  'schemas': 'Data & Schemas',
  'scripts': 'Development',
  'security': 'Integrity & Security',
  'status': 'Status & Progress',
  'strategic-analysis': 'Analysis & Planning',
  'support': 'Support & FAQ',
  'team-guides': 'Onboarding & Setup',
  'tests': 'Testing',
  'transparency': 'Transparency & Trust',
  'trust': 'Transparency & Trust',
  'ux': 'User Experience',
};

// Documents expected based on PR template references
const EXPECTED_DOCUMENTS = [
  'docs/integrity/credential-schema-final-v1.md',
  'docs/governance/dec/DEC-20250812-02-hysteresis-adoption.md',
  'docs/analytics/event-schema-canonical-v1.md',
  'docs/governance/disclaimers-lint-spec-v1.md',
  'docs/privacy/pii-pattern-library-v1.md',
  'docs/fairness/hysteresis-config-v1.yml',
  'docs/roadmap/roadmap-master-v1.md',
  'docs/master-spec/master-spec-v2.md',
  'docs/governance/dec/templates/DEC-template-v1.md',
  'docs/integrity/spec-hash-manifest-v1.json',
];

async function findMarkdownFiles(dir) {
  const files = [];

  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        // Skip _inventory directory to avoid circular reference
        if (entry.name !== '_inventory') {
          await scan(fullPath);
        }
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }

  await scan(dir);
  return files;
}

async function extractHeaders(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const headers = [];

    for (const line of lines) {
      const h1Match = line.match(/^# (.+)$/);
      if (h1Match) {
        headers.push({ level: 1, text: h1Match[1].trim() });
        continue;
      }

      const h2Match = line.match(/^## (.+)$/);
      if (h2Match) {
        headers.push({ level: 2, text: h2Match[1].trim() });
      }
    }

    return headers;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    return [];
  }
}

function getLastCommitTimestamp(filePath) {
  try {
    const result = spawnSync('git', [
      'log', '-1', '--format=%cI', '--', filePath,
    ], {
      cwd: ROOT_DIR,
      encoding: 'utf-8',
    });

    if (result.status === 0 && result.stdout.trim()) {
      return result.stdout.trim();
    }

    // Fallback to file stat if git fails
    return new Date().toISOString();
  } catch (error) {
    console.warn(`Warning: Could not get git timestamp for ${filePath}: ${error.message}`);
    return new Date().toISOString();
  }
}

function categorizeDomain(filePath) {
  const relativePath = path.relative(DOCS_DIR, filePath);
  const parts = relativePath.split(path.sep);

  if (parts.length > 0) {
    const topLevel = parts[0];
    return DOMAIN_MAPPING[topLevel] || 'Other';
  }

  return 'Other';
}

async function generateInventory() {
  console.log('Starting documentation inventory scan...');

  // Find all markdown files
  const markdownFiles = await findMarkdownFiles(DOCS_DIR);
  console.log(`Found ${markdownFiles.length} markdown files`);

  const inventory = [];

  for (const filePath of markdownFiles) {
    console.log(`Processing: ${path.relative(ROOT_DIR, filePath)}`);

    const headers = await extractHeaders(filePath);
    const lastCommit = getLastCommitTimestamp(filePath);
    const domain = categorizeDomain(filePath);
    const relativePath = path.relative(ROOT_DIR, filePath);

    const entry = {
      path: relativePath,
      domain: domain,
      headers: headers,
      lastCommitTimestamp: lastCommit,
      firstH1: headers.find(h => h.level === 1)?.text || null,
      firstH2: headers.find(h => h.level === 2)?.text || null,
      headerCount: headers.length,
      h1Count: headers.filter(h => h.level === 1).length,
      h2Count: headers.filter(h => h.level === 2).length,
    };

    inventory.push(entry);
  }

  // Sort by path for consistency
  inventory.sort((a, b) => a.path.localeCompare(b.path));

  return inventory;
}

async function analyzeGaps(inventory) {
  const gaps = [];
  const existingPaths = new Set(inventory.map(item => item.path));

  for (const expectedPath of EXPECTED_DOCUMENTS) {
    if (!existingPaths.has(expectedPath)) {
      gaps.push({
        path: expectedPath,
        reason: 'Referenced in PR template',
        criticality: 'high',
      });
    }
  }

  return gaps;
}

async function generateReport(inventory, gaps) {
  const report = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalFiles: inventory.length,
      scanDirectory: 'docs/',
      version: '1.0.0',
    },
    statistics: {
      fileCount: inventory.length,
      domainDistribution: {},
      averageHeadersPerFile: 0,
      totalH1Headers: 0,
      totalH2Headers: 0,
      gapCount: gaps.length,
    },
    inventory: inventory,
    gaps: gaps,
  };

  // Calculate statistics
  const domainCounts = {};
  let totalHeaders = 0;
  let totalH1 = 0;
  let totalH2 = 0;

  for (const item of inventory) {
    // Domain distribution
    domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;

    // Header statistics
    totalHeaders += item.headerCount;
    totalH1 += item.h1Count;
    totalH2 += item.h2Count;
  }

  report.statistics.domainDistribution = domainCounts;
  report.statistics.averageHeadersPerFile = inventory.length > 0 ?
    (totalHeaders / inventory.length).toFixed(2) : 0;
  report.statistics.totalH1Headers = totalH1;
  report.statistics.totalH2Headers = totalH2;

  return report;
}

async function generateSummary(report) {
  const { metadata, statistics, inventory, gaps } = report;

  const summary = `# Documentation Inventory Summary

Generated: ${metadata.generatedAt}
Total Files: ${metadata.totalFiles}
Scan Directory: \`${metadata.scanDirectory}\`

## Overview

This inventory provides a comprehensive scan of all documentation files in the repository, capturing file paths, headers, commit timestamps, and domain categorizations. It serves as a baseline for documentation index development and gap analysis.

## Statistics

- **Total Files**: ${statistics.fileCount}
- **Total H1 Headers**: ${statistics.totalH1Headers}
- **Total H2 Headers**: ${statistics.totalH2Headers}
- **Average Headers per File**: ${statistics.averageHeadersPerFile}
- **Identified Gaps**: ${statistics.gapCount}

## Domain Distribution

${Object.entries(statistics.domainDistribution)
    .sort(([,a], [,b]) => b - a)
    .map(([domain, count]) => `- **${domain}**: ${count} files`)
    .join('\n')}

## Gap Analysis

### Missing Documents (${gaps.length})

The following documents are referenced in the PR template but not found in the repository:

${gaps.length > 0 ?
    gaps.map(gap => `- \`${gap.path}\` - ${gap.reason} (${gap.criticality} priority)`).join('\n') :
    '*No missing documents identified*'
}

## Domain Overview

${Object.keys(statistics.domainDistribution)
    .sort()
    .map(domain => {
      const domainFiles = inventory.filter(item => item.domain === domain);
      const fileList = domainFiles
        .sort((a, b) => a.path.localeCompare(b.path))
        .slice(0, 5) // Show first 5 files
        .map(file => `  - \`${file.path}\`${file.firstH1 ? ` - ${file.firstH1}` : ''}`)
        .join('\n');

      return `### ${domain} (${domainFiles.length} files)\n\n${fileList}${domainFiles.length > 5 ? `\n  - ... and ${domainFiles.length - 5} more files` : ''}`;
    }).join('\n\n')}

## Recent Activity

Files updated in the last 30 days:

${inventory
    .filter(item => {
      const commitDate = new Date(item.lastCommitTimestamp);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return commitDate > thirtyDaysAgo;
    })
    .sort((a, b) => new Date(b.lastCommitTimestamp) - new Date(a.lastCommitTimestamp))
    .slice(0, 10)
    .map(item => `- \`${item.path}\` - ${new Date(item.lastCommitTimestamp).toLocaleDateString()}`)
    .join('\n') || '*No recent updates found*'}

## Recommendations

1. **Address Missing Documents**: Focus on creating the ${gaps.length} missing documents referenced in the PR template
2. **Standardize Headers**: Ensure all files have proper H1 titles
3. **Domain Organization**: Consider reorganizing files with unclear domain categorization
4. **Regular Updates**: Establish a process for keeping documentation current

---

*This summary is generated automatically from \`tools/docs-inventory.js\`. To update, run the inventory script again.*
`;

  return summary;
}

async function main() {
  try {
    // Ensure inventory directory exists
    await fs.mkdir(INVENTORY_DIR, { recursive: true });

    // Generate inventory
    const inventory = await generateInventory();

    // Analyze gaps
    const gaps = await analyzeGaps(inventory);

    // Generate report
    const report = await generateReport(inventory, gaps);

    // Write report.json
    await fs.writeFile(REPORT_JSON, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`✓ Generated: ${path.relative(ROOT_DIR, REPORT_JSON)}`);

    // Generate and write summary.md
    const summary = await generateSummary(report);
    await fs.writeFile(SUMMARY_MD, summary, 'utf-8');
    console.log(`✓ Generated: ${path.relative(ROOT_DIR, SUMMARY_MD)}`);

    console.log('\n📊 Inventory Summary:');
    console.log(`- Total files: ${report.statistics.fileCount}`);
    console.log(`- Domains: ${Object.keys(report.statistics.domainDistribution).length}`);
    console.log(`- Missing documents: ${report.statistics.gapCount}`);
    console.log(`- Average headers per file: ${report.statistics.averageHeadersPerFile}`);

    if (gaps.length > 0) {
      console.log('\n⚠️  Missing Documents:');
      gaps.forEach(gap => console.log(`  - ${gap.path}`));
    }

  } catch (error) {
    console.error('Error generating documentation inventory:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
