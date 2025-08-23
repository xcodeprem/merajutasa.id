#!/usr/bin/env node
/**
 * security-patterns-smoke.js
 * Lightweight smoke test to detect risky security patterns in codebase.
 * Flags potential security vulnerabilities that could lead to CodeQL alerts.
 */
import { promises as fs } from 'fs';
import { glob } from 'glob';
import path from 'path';

const PATTERNS = {
  EXEC_SYNC_STRING: {
    regex: /execSync\s*\(\s*`[^`]*\$\{[^}]*\}[^`]*`/g,
    severity: 'HIGH',
    description: 'execSync with template literal interpolation (shell injection risk)',
    safe_patterns: [
      /execSync\s*\(\s*['"`][^$]*['"`]\s*,/, // Fixed strings without interpolation
    ],
  },
  EXEC_SYNC_USAGE: {
    regex: /execSync\s*\(/g,
    severity: 'MEDIUM',
    description: 'execSync usage - consider execFileSync for better security',
    safe_patterns: [
      /execSync\s*\(\s*['"`][^$'"`]*['"`]\s*,/, // Fixed strings without variables
      /execFileSync/, // execFileSync is preferred
    ],
  },
  HTML_TAG_STRIP_UNSAFE: {
    regex: /\.replace\s*\(\s*\/[^/]*<[^/]*\+[^/]*>[^/]*\/[^,)]*,/g,
    severity: 'MEDIUM',
    description: 'Potentially unsafe HTML tag stripping with complex regex pattern',
    safe_patterns: [
      /replace\s*\(\s*\/\[<>]\//g, // Character class replacement is safer
      /data-disclaimer-id/, // Context indicates safe usage in disclaimers
      /Avoid regex tag-stripping.*alerts/i, // Comment indicating awareness
    ],
  },
  PATH_RESOLVE_USER: {
    regex: /path\.resolve\s*\(\s*process\.argv\[[^\]]+\]\s*\)/g,
    severity: 'HIGH',
    description: 'path.resolve with user input (directory traversal risk)',
    safe_patterns: [
      /\/\*.*safe.*path.*\*\//i, // Explicitly marked as safe with comment
      /path\.resolve.*\.startsWith\(/g, // Has path validation
    ],
  },
};

async function scanFile(filePath) {
  const violations = [];

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');

    for (const [patternName, config] of Object.entries(PATTERNS)) {
      const matches = [...content.matchAll(config.regex)];

      for (const match of matches) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const line = lines[lineNumber - 1];

        // Check if this is a safe usage
        const isSafe = config.safe_patterns?.some(safeRegex =>
          safeRegex.test(line) || safeRegex.test(content),
        );

        if (!isSafe) {
          violations.push({
            file: filePath,
            line: lineNumber,
            pattern: patternName,
            severity: config.severity,
            description: config.description,
            match: match[0],
            context: line.trim(),
          });
        }
      }
    }
  } catch (error) {
    console.warn(`[security-patterns] Warning: Could not read ${filePath}: ${error.message}`);
  }

  return violations;
}

async function main() {
  console.log('[security-patterns] Starting security patterns smoke test...');

  // Scan all JavaScript files in tools directory
  const jsFiles = await glob('tools/**/*.js', { ignore: ['tools/node_modules/**'] });

  const allViolations = [];

  for (const file of jsFiles) {
    const violations = await scanFile(file);
    allViolations.push(...violations);
  }

  // Generate report
  await fs.mkdir('artifacts', { recursive: true });
  const report = {
    timestamp: new Date().toISOString(),
    files_scanned: jsFiles.length,
    violations: allViolations,
    summary: {
      total_violations: allViolations.length,
      by_severity: {
        HIGH: allViolations.filter(v => v.severity === 'HIGH').length,
        MEDIUM: allViolations.filter(v => v.severity === 'MEDIUM').length,
        LOW: allViolations.filter(v => v.severity === 'LOW').length,
      },
    },
  };

  await fs.writeFile('artifacts/security-patterns-smoke.json', JSON.stringify(report, null, 2));

  // Report results
  if (allViolations.length === 0) {
    console.log('[security-patterns] PASS - No risky patterns detected');
    return;
  }

  console.log(`[security-patterns] Found ${allViolations.length} potential security issues:`);

  for (const violation of allViolations) {
    console.log(`  ${violation.severity}: ${violation.file}:${violation.line} - ${violation.description}`);
    console.log(`    Pattern: ${violation.pattern}`);
    console.log(`    Context: ${violation.context}`);
    console.log('');
  }

  // For now, treat as advisory (warnings only)
  // In production, this could exit with non-zero code for HIGH severity issues
  const highSeverityCount = allViolations.filter(v => v.severity === 'HIGH').length;

  if (highSeverityCount > 0) {
    console.warn(`[security-patterns] WARNING: ${highSeverityCount} high-severity security patterns detected`);
    console.warn('[security-patterns] Review patterns and consider safer alternatives');
  }

  console.log('[security-patterns] Completed security patterns scan');
}

main().catch(e => {
  console.error('[security-patterns] Error:', e.message);
  process.exit(1);
});
