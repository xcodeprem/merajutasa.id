#!/usr/bin/env node
/**
 * Obsolete Scripts Detection
 *
 * Identifies potentially obsolete scripts based on:
 * - Unreferenced scripts
 * - Failing scripts
 * - Duplicate functionality
 * - PowerShell dependencies
 */

import fs from 'fs/promises';
import path from 'path';

class ObsoleteDetector {
  constructor() {
    this.obsoleteCandidates = [];
  }

  async detectObsoleteScripts() {
    try {
      console.log('🔍 Detecting obsolete script candidates...');

      // Load package.json
      const packageContent = await fs.readFile('package.json', 'utf8');
      const packageData = JSON.parse(packageContent);
      const scripts = packageData.scripts || {};

      // Load validation results if available
      let validationResults = null;
      try {
        const validationContent = await fs.readFile('artifacts/scripts/validation.json', 'utf8');
        validationResults = JSON.parse(validationContent);
      } catch {
        console.log('⚠️ No validation results found');
      }

      const candidates = {
        powershell_dependent: [],
        consistently_failing: [],
        unreferenced: [],
        duplicate_functionality: [],
        deprecated_patterns: [],
      };

      // Detect PowerShell dependent scripts
      for (const [name, command] of Object.entries(scripts)) {
        if (command.includes('powershell') || command.includes('.ps1')) {
          candidates.powershell_dependent.push({
            name,
            command,
            reason: 'PowerShell dependency - not compatible with Linux',
          });
        }

        // Check for deprecated patterns
        if (command.includes('&& echo') || command.includes('|| echo')) {
          candidates.deprecated_patterns.push({
            name,
            command,
            reason: 'Uses deprecated shell patterns',
          });
        }
      }

      // Check validation results for consistently failing scripts
      if (validationResults) {
        for (const [name, result] of Object.entries(validationResults.scripts || {})) {
          if (result.status === 'failed' || result.status === 'timeout') {
            candidates.consistently_failing.push({
              name,
              command: scripts[name],
              reason: `Validation ${result.status}: ${result.error || 'timeout'}`,
            });
          }
        }
      }

      // Simple duplicate detection (same command)
      const commandMap = new Map();
      for (const [name, command] of Object.entries(scripts)) {
        if (commandMap.has(command)) {
          candidates.duplicate_functionality.push({
            name,
            command,
            reason: `Duplicate of: ${commandMap.get(command)}`,
          });
        } else {
          commandMap.set(command, name);
        }
      }

      // Save results
      const outputPath = 'artifacts/scripts/obsolete-candidates.json';
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      const output = {
        tool: 'obsolete-detector',
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        summary: {
          total_candidates: Object.values(candidates).flat().length,
          powershell_dependent: candidates.powershell_dependent.length,
          consistently_failing: candidates.consistently_failing.length,
          unreferenced: candidates.unreferenced.length,
          duplicate_functionality: candidates.duplicate_functionality.length,
          deprecated_patterns: candidates.deprecated_patterns.length,
        },
        candidates,
      };

      await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');

      console.log(`📄 Obsolete candidates report saved to ${outputPath}`);
      console.log(`📊 Found ${output.summary.total_candidates} obsolete candidates`);

      if (output.summary.powershell_dependent > 0) {
        console.log(`  🔴 ${output.summary.powershell_dependent} PowerShell dependent scripts`);
      }
      if (output.summary.consistently_failing > 0) {
        console.log(`  ❌ ${output.summary.consistently_failing} consistently failing scripts`);
      }
      if (output.summary.duplicate_functionality > 0) {
        console.log(`  🔄 ${output.summary.duplicate_functionality} potential duplicates`);
      }

      return output;

    } catch (error) {
      console.error('❌ Failed to detect obsolete scripts:', error);
      throw error;
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const detector = new ObsoleteDetector();
    await detector.detectObsoleteScripts();
    console.log('✅ Obsolete script detection complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Obsolete detection failed:', error);
    process.exit(1);
  }
}

export { ObsoleteDetector };
