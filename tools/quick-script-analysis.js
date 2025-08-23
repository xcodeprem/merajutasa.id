#!/usr/bin/env node
/**
 * Quick Script Analysis Tool
 * Fast identification of script issues and categories
 */

import fs from 'fs/promises';
import path from 'path';

class QuickScriptAnalyzer {
  constructor() {
    this.issues = [];
    this.categories = {};
    this.obsoletePatterns = [
      // Powershell commands that won't work on Linux
      /powershell -c/,
      // Commands referencing missing tools
      /concurrently/,
      // Commands with obvious syntax issues
      /\$env:/,
    ];
  }

  async loadScripts() {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    return packageJson.scripts || {};
  }

  categorizeScripts(scripts) {
    const categories = {};
    Object.keys(scripts).forEach(scriptName => {
      const prefix = scriptName.split(':')[0];
      if (!categories[prefix]) {
        categories[prefix] = [];
      }
      categories[prefix].push({
        name: scriptName,
        command: scripts[scriptName],
      });
    });
    return categories;
  }

  async checkFileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async analyzeScript(scriptName, command) {
    const analysis = {
      name: scriptName,
      command,
      issues: [],
      type: 'unknown',
    };

    // Check for obsolete patterns
    this.obsoletePatterns.forEach(pattern => {
      if (pattern.test(command)) {
        analysis.issues.push(`Obsolete pattern: ${pattern.source}`);
      }
    });

    // Check for missing files
    const nodeFileMatch = command.match(/node\s+([^\s]+\.js)/);
    if (nodeFileMatch) {
      const filePath = nodeFileMatch[1];
      const exists = await this.checkFileExists(filePath);
      if (!exists) {
        analysis.issues.push(`Missing file: ${filePath}`);
      }
      analysis.type = 'node_script';
    }

    const shellFileMatch = command.match(/([^\s]+\.sh)/);
    if (shellFileMatch) {
      const filePath = shellFileMatch[1];
      if (!filePath.startsWith('./')) {
        // Relative path
        const exists = await this.checkFileExists(filePath);
        if (!exists) {
          analysis.issues.push(`Missing file: ${filePath}`);
        }
      }
      analysis.type = 'shell_script';
    }

    // Identify script types
    if (command.includes('npm run')) {
      analysis.type = 'composite';
    } else if (command.includes('echo')) {
      analysis.type = 'placeholder';
    } else if (command.includes('curl') || command.includes('Invoke-RestMethod')) {
      analysis.type = 'api_call';
    } else if (command.includes('kubectl')) {
      analysis.type = 'kubernetes';
    } else if (command.includes('docker')) {
      analysis.type = 'docker';
    }

    return analysis;
  }

  async analyzeAllScripts() {
    console.log('🔍 Quick Script Analysis Starting...\n');

    const scripts = await this.loadScripts();
    const categories = this.categorizeScripts(scripts);

    console.log(`📊 Found ${Object.keys(scripts).length} scripts in ${Object.keys(categories).length} categories\n`);

    const results = {
      total: Object.keys(scripts).length,
      categories: {},
      issues: [],
      obsolete: [],
      missing_files: [],
      summary: {},
    };

    for (const [category, categoryScripts] of Object.entries(categories)) {
      console.log(`📋 Analyzing category: ${category} (${categoryScripts.length} scripts)`);

      const categoryAnalysis = {
        count: categoryScripts.length,
        scripts: [],
        issues: 0,
      };

      for (const script of categoryScripts) {
        const analysis = await this.analyzeScript(script.name, script.command);
        categoryAnalysis.scripts.push(analysis);

        if (analysis.issues.length > 0) {
          categoryAnalysis.issues++;
          results.issues.push(analysis);

          // Categorize issues
          analysis.issues.forEach(issue => {
            if (issue.includes('Obsolete pattern')) {
              results.obsolete.push(script.name);
            } else if (issue.includes('Missing file')) {
              results.missing_files.push(script.name);
            }
          });
        }
      }

      results.categories[category] = categoryAnalysis;
      if (categoryAnalysis.issues > 0) {
        console.log(`   ⚠️  ${categoryAnalysis.issues} issues found`);
      } else {
        console.log('   ✅ No obvious issues');
      }
    }

    results.summary = {
      totalIssues: results.issues.length,
      obsoleteScripts: results.obsolete.length,
      missingFiles: results.missing_files.length,
      healthyScripts: results.total - results.issues.length,
    };

    return results;
  }

  generateReport(results) {
    console.log('\n═'.repeat(80));
    console.log('📊 QUICK SCRIPT ANALYSIS REPORT');
    console.log('═'.repeat(80));

    console.log(`📋 Total Scripts: ${results.total}`);
    console.log(`✅ Healthy Scripts: ${results.summary.healthyScripts}`);
    console.log(`⚠️  Scripts with Issues: ${results.summary.totalIssues}`);
    console.log(`🗑️  Obsolete Scripts: ${results.summary.obsoleteScripts}`);
    console.log(`📁 Missing Files: ${results.summary.missingFiles}`);

    console.log('\n📊 CATEGORY BREAKDOWN:');
    Object.entries(results.categories)
      .sort((a, b) => b[1].count - a[1].count)
      .forEach(([category, data]) => {
        const status = data.issues > 0 ? `(${data.issues} issues)` : '(healthy)';
        console.log(`   ${category}: ${data.count} scripts ${status}`);
      });

    if (results.obsolete.length > 0) {
      console.log('\n🗑️  OBSOLETE SCRIPTS (recommend removal):');
      results.obsolete.forEach(script => console.log(`   - ${script}`));
    }

    if (results.missing_files.length > 0) {
      console.log('\n📁 SCRIPTS WITH MISSING FILES:');
      results.missing_files.forEach(script => console.log(`   - ${script}`));
    }

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('   1. Remove obsolete PowerShell scripts for Linux compatibility');
    console.log('   2. Fix scripts with missing file references');
    console.log('   3. Install missing dependencies (concurrently, etc.)');
    console.log('   4. Group scripts better in package.json with comments');
    console.log('   5. Add missing Week 6 integration scripts');

    console.log('\n═'.repeat(80));
    return results;
  }

  async saveResults(results, filename = 'artifacts/quick-script-analysis.json') {
    try {
      await fs.mkdir(path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, JSON.stringify(results, null, 2));
      console.log(`📄 Results saved to: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new QuickScriptAnalyzer();

  analyzer.analyzeAllScripts()
    .then(results => {
      const report = analyzer.generateReport(results);
      return analyzer.saveResults(results);
    })
    .catch(error => {
      console.error('❌ Analysis failed:', error);
      process.exit(1);
    });
}

export default QuickScriptAnalyzer;
