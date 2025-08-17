#!/usr/bin/env node
'use strict';

/**
 * update-readme-status.js
 * Auto-sync README "Current Status" section from governance artifacts
 * Provides single source of truth for pipeline status
 */

import fs from 'node:fs';
import path from 'node:path';
import { stableStringify } from '../lib/json-stable.js';

/**
 * Safely read JSON file, return null if not found or invalid
 */
function readJSONSafe(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`[status-sync] Warning: Could not read ${filePath}: ${error.message}`);
    return null;
  }
}

/**
 * Render status block from artifacts
 */
function renderStatus() {
  const a8Report = readJSONSafe('artifacts/no-silent-drift-report.json');
  const specHash = readJSONSafe('artifacts/spec-hash-diff.json');
  const securitySmoke = readJSONSafe('artifacts/security-patterns-smoke.json');
  const governance = readJSONSafe('artifacts/governance-verify-summary.json');
  
  const lines = [];
  
  // A8 (no-silent-drift) status
  const a8Status = a8Report?.summary?.status || a8Report?.status || 'UNKNOWN';
  lines.push(`- **A8 (no-silent-drift)**: ${a8Status}`);
  
  // Spec hash status
  if (specHash?.summary) {
    const specStatus = typeof specHash.summary === 'string' ? specHash.summary : 'PASS';
    const specViolations = specHash.violations?.length || 0;
    if (specViolations > 0) {
      lines.push(`- **Spec Hash**: ${specStatus} (${specViolations} violations)`);
    } else {
      lines.push(`- **Spec Hash**: ${specStatus}`);
    }
  } else {
    lines.push('- **Spec Hash**: UNKNOWN');
  }
  
  // Security patterns status
  if (securitySmoke) {
    const totalViolations = securitySmoke.summary?.total_violations || 0;
    const highCount = securitySmoke.summary?.by_severity?.HIGH || securitySmoke.high_severity_count || 0;
    const mediumCount = securitySmoke.summary?.by_severity?.MEDIUM || securitySmoke.medium_severity_count || 0;
    
    if (totalViolations === 0) {
      lines.push('- **Security Smoke**: PASS');
    } else if (highCount > 0 || mediumCount > 0) {
      lines.push(`- **Security Smoke**: VIOLATIONS (${highCount}H/${mediumCount}M)`);
    } else {
      lines.push(`- **Security Smoke**: VIOLATIONS (${totalViolations} total)`);
    }
  } else {
    lines.push('- **Security Smoke**: UNKNOWN');
  }
  
  // Governance summary
  if (governance?.summary?.overall_status) {
    lines.push(`- **Overall Governance**: ${governance.summary.overall_status}`);
  }
  
  // Last updated timestamp
  const timestamp = new Date().toISOString();
  lines.push('');
  lines.push(`*Last updated: ${timestamp}*`);
  
  return lines.join('\n');
}

/**
 * Update README.md with current status
 */
function updateReadme() {
  const readmePath = path.resolve('README.md');
  const markerStart = '<!-- STATUS:BEGIN -->';
  const markerEnd = '<!-- STATUS:END -->';
  
  if (!fs.existsSync(readmePath)) {
    console.error('[status-sync] ERROR: README.md not found');
    process.exitCode = 1;
    return;
  }
  
  const original = fs.readFileSync(readmePath, 'utf8');
  const hasMarkers = original.includes(markerStart) && original.includes(markerEnd);
  
  if (!hasMarkers) {
    console.error('[status-sync] ERROR: README markers missing. Add:');
    console.error(`  ${markerStart}`);
    console.error('  ... status content ...');
    console.error(`  ${markerEnd}`);
    process.exitCode = 1;
    return;
  }
  
  const statusBlock = renderStatus();
  const regex = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, 'g');
  const updated = original.replace(regex, `${markerStart}\n\n${statusBlock}\n\n${markerEnd}`);
  
  if (updated !== original) {
    fs.writeFileSync(readmePath, updated, 'utf8');
    console.log('[status-sync] README status updated successfully');
    
    // Log the change for CI
    console.log('::notice title=README Status Updated::Status section synchronized with artifacts');
  } else {
    console.log('[status-sync] README already up-to-date');
  }
}

/**
 * Validate sync - check if README is in sync with artifacts
 */
function validateSync() {
  const readmePath = path.resolve('README.md');
  const markerStart = '<!-- STATUS:BEGIN -->';
  const markerEnd = '<!-- STATUS:END -->';
  
  if (!fs.existsSync(readmePath)) {
    console.error('[status-sync] ERROR: README.md not found');
    return false;
  }
  
  const original = fs.readFileSync(readmePath, 'utf8');
  const statusBlock = renderStatus();
  const expectedContent = `${markerStart}\n\n${statusBlock}\n\n${markerEnd}`;
  
  const regex = new RegExp(`${markerStart}[\\s\\S]*?${markerEnd}`, 'g');
  const updated = original.replace(regex, expectedContent);
  
  return updated === original;
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'validate':
      if (validateSync()) {
        console.log('[status-sync] README is in sync');
        process.exit(0);
      } else {
        console.error('[status-sync] README is out of sync with artifacts');
        process.exit(1);
      }
      break;
      
    case 'update':
    default:
      updateReadme();
      break;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  renderStatus,
  updateReadme,
  validateSync,
};