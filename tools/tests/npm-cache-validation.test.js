#!/usr/bin/env node
/**
 * Test to validate npm cache implementation in GitHub Actions workflows
 * Ensures all setup-node actions use cache: 'npm' parameter
 */

import { promises as fs } from 'fs';
import { glob } from 'glob';

async function testNpmCacheValidation() {
  console.log('🧪 Testing npm cache validation in GitHub Actions workflows...');

  try {
    // Find all workflow files
    const workflowFiles = await glob('.github/workflows/*.yml');
    console.log(`📁 Found ${workflowFiles.length} workflow files`);

    let totalSetupNodeUsages = 0;
    let cachedSetupNodeUsages = 0;
    const setupNodeWithoutCache = [];
    const actionTagViolations = [];

    for (const file of workflowFiles) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');

      // Check for setup-node usage
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        if (line.includes('actions/setup-node')) {
          totalSetupNodeUsages++;

          // Check if it uses @v4 or other tags instead of commit SHA
          if (line.includes('@v') && !line.includes('#')) {
            actionTagViolations.push(`${file}:${i + 1} - ${line.trim()}`);
          }

          // Look for cache parameter in the next few lines
          let hasCacheParam = false;
          for (let j = i + 1; j < Math.min(i + 10, lines.length); j++) {
            if (lines[j].includes('cache:') && lines[j].includes('npm')) {
              hasCacheParam = true;
              cachedSetupNodeUsages++;
              break;
            }
            // Stop if we hit another action or step
            if (lines[j].includes('- uses:') || lines[j].includes('- name:')) {
              break;
            }
          }

          if (!hasCacheParam) {
            setupNodeWithoutCache.push(`${file}:${i + 1}`);
          }
        }
      }
    }

    console.log('\n📊 Analysis Results:');
    console.log(`   Total setup-node usages: ${totalSetupNodeUsages}`);
    console.log(`   Usages with npm cache: ${cachedSetupNodeUsages}`);
    console.log(`   Coverage: ${Math.round((cachedSetupNodeUsages / totalSetupNodeUsages) * 100)}%`);

    // Check for violations
    let hasViolations = false;

    if (setupNodeWithoutCache.length > 0) {
      console.error('\n❌ setup-node usages without cache:');
      setupNodeWithoutCache.forEach(usage => console.error(`   - ${usage}`));
      hasViolations = true;
    }

    if (actionTagViolations.length > 0) {
      console.error('\n❌ Actions using tags instead of commit SHA:');
      actionTagViolations.forEach(violation => console.error(`   - ${violation}`));
      hasViolations = true;
    }

    if (!hasViolations) {
      console.log('\n✅ All setup-node actions properly configured with npm cache');
      console.log('✅ All actions properly pinned to commit SHAs');
    }

    // Check allowlist compliance for actions/download-artifact
    const allowlistContent = await fs.readFile('.github/actions-allowlist.json', 'utf8');
    const allowlist = JSON.parse(allowlistContent);
    const downloadArtifactAction = allowlist.allowed_actions.find(action =>
      action.action === 'actions/download-artifact',
    );

    if (downloadArtifactAction) {
      console.log('✅ actions/download-artifact properly added to allowlist');
    } else {
      console.error('❌ actions/download-artifact missing from allowlist');
      hasViolations = true;
    }

    // Generate summary artifact
    const summary = {
      tool: 'npm-cache-validation',
      timestamp: new Date().toISOString(),
      total_setup_node_usages: totalSetupNodeUsages,
      cached_setup_node_usages: cachedSetupNodeUsages,
      cache_coverage_percent: Math.round((cachedSetupNodeUsages / totalSetupNodeUsages) * 100),
      violations: {
        setup_node_without_cache: setupNodeWithoutCache,
        action_tag_violations: actionTagViolations,
      },
      compliance: {
        npm_cache_complete: setupNodeWithoutCache.length === 0,
        sha_pinning_complete: actionTagViolations.length === 0,
        allowlist_updated: !!downloadArtifactAction,
      },
    };

    await fs.mkdir('artifacts', { recursive: true });
    await fs.writeFile('artifacts/npm-cache-validation-test.json', JSON.stringify(summary, null, 2));
    console.log('\n💾 Summary saved to artifacts/npm-cache-validation-test.json');

    return !hasViolations;

  } catch (error) {
    console.error('❌ npm cache validation test failed:', error.message);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = await testNpmCacheValidation();
  process.exit(success ? 0 : 1);
}

export { testNpmCacheValidation };
