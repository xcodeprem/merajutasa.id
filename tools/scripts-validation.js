#!/usr/bin/env node
/**
 * Comprehensive npm Scripts Validation Tool
 * Systematically tests all package.json scripts to identify working vs broken ones
 */

import fs from 'fs/promises';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

class ScriptValidator {
  constructor() {
    this.results = {
      working: [],
      broken: [],
      skipped: [],
      categories: {},
      summary: {}
    };
    
    // Scripts that should be skipped from automatic validation
    this.skipPatterns = [
      /^service:/, // Require manual startup/shutdown
      /^infra:start-all$/, // Starts multiple services
      /^ci:/, // Require specific CI environment
      /^equity-ui-v2:dev$/, // Interactive development server
      /^dashboards:open$/, // Opens browser
      /^signer:rotate$/, // Requires running signer service
      /^collector:smoke$/, // Requires running collector service
      /^chain:append$/, // Requires running services
      /^chain:verify:negative$/, // Requires running services
      /^test:signer-e2e$/, // Requires specific service setup
      /^test:chain-verify-negative$/ // Requires specific service setup
    ];
    
    // Scripts that are known to have specific environmental requirements
    this.environmentalRequirements = {
      'docker:build-all': 'Docker daemon',
      'docker:deploy-dev': 'Docker daemon',
      'docker:deploy-prod': 'Docker daemon', 
      'docker:deploy-test': 'Docker daemon',
      'k8s:deploy': 'Kubernetes cluster',
      'k8s:delete': 'Kubernetes cluster',
      'k8s:status': 'kubectl configured',
      'infra:nginx': 'nginx installed'
    };
  }

  /**
   * Load package.json and extract scripts
   */
  async loadScripts() {
    try {
      const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
      return packageJson.scripts || {};
    } catch (error) {
      throw new Error(`Failed to load package.json: ${error.message}`);
    }
  }

  /**
   * Categorize scripts by prefix
   */
  categorizeScripts(scripts) {
    const categories = {};
    
    Object.keys(scripts).forEach(scriptName => {
      const prefix = scriptName.split(':')[0];
      if (!categories[prefix]) {
        categories[prefix] = [];
      }
      categories[prefix].push(scriptName);
    });
    
    return categories;
  }

  /**
   * Check if script should be skipped
   */
  shouldSkip(scriptName) {
    return this.skipPatterns.some(pattern => pattern.test(scriptName));
  }

  /**
   * Test individual script with timeout
   */
  async testScript(scriptName, scriptCommand, timeout = 30000) {
    return new Promise((resolve) => {
      const child = spawn('npm', ['run', scriptName], {
        stdio: 'pipe',
        timeout: timeout
      });

      let stdout = '';
      let stderr = '';
      let timedOut = false;

      const timer = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
      }, timeout);

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        clearTimeout(timer);
        
        const result = {
          scriptName,
          command: scriptCommand,
          exitCode: code,
          stdout: stdout.slice(0, 500), // Limit output size
          stderr: stderr.slice(0, 500),
          timedOut,
          success: code === 0 && !timedOut
        };

        resolve(result);
      });

      child.on('error', (error) => {
        clearTimeout(timer);
        resolve({
          scriptName,
          command: scriptCommand,
          exitCode: -1,
          stdout: '',
          stderr: error.message,
          timedOut: false,
          success: false
        });
      });
    });
  }

  /**
   * Test scripts that are known to need specific syntax validation
   */
  async testSyntaxValidation(scriptName, scriptCommand) {
    // For Node.js scripts, try to parse them
    if (scriptCommand.includes('node ') && scriptCommand.includes('.js')) {
      const scriptPath = scriptCommand.match(/node\s+([^\s]+\.js)/)?.[1];
      if (scriptPath) {
        try {
          await fs.access(scriptPath);
          return { exists: true, scriptPath };
        } catch {
          return { exists: false, scriptPath };
        }
      }
    }
    
    // For shell scripts
    if (scriptCommand.includes('.sh')) {
      const scriptPath = scriptCommand.match(/([^\s]+\.sh)/)?.[1];
      if (scriptPath) {
        try {
          await fs.access(scriptPath);
          return { exists: true, scriptPath };
        } catch {
          return { exists: false, scriptPath };
        }
      }
    }
    
    return { exists: null, scriptPath: null };
  }

  /**
   * Validate all scripts
   */
  async validateAllScripts() {
    console.log('🔍 Loading package.json scripts...\n');
    
    const scripts = await this.loadScripts();
    const categories = this.categorizeScripts(scripts);
    
    console.log(`📊 Found ${Object.keys(scripts).length} scripts in ${Object.keys(categories).length} categories\n`);
    
    // Group scripts by category for better reporting
    this.results.categories = categories;
    
    const scriptEntries = Object.entries(scripts);
    let tested = 0;
    
    for (const [scriptName, scriptCommand] of scriptEntries) {
      console.log(`\n📋 Testing script ${tested + 1}/${scriptEntries.length}: ${scriptName}`);
      
      // Check if should skip
      if (this.shouldSkip(scriptName)) {
        console.log(`   ⏭️  Skipped: Requires manual intervention`);
        this.results.skipped.push({
          scriptName,
          command: scriptCommand,
          reason: 'Requires manual intervention'
        });
        tested++;
        continue;
      }
      
      // Check environmental requirements
      if (this.environmentalRequirements[scriptName]) {
        console.log(`   ⏭️  Skipped: Requires ${this.environmentalRequirements[scriptName]}`);
        this.results.skipped.push({
          scriptName,
          command: scriptCommand,
          reason: `Requires ${this.environmentalRequirements[scriptName]}`
        });
        tested++;
        continue;
      }
      
      // Test syntax/file existence first
      const syntaxCheck = await this.testSyntaxValidation(scriptName, scriptCommand);
      if (syntaxCheck.exists === false) {
        console.log(`   ❌ File not found: ${syntaxCheck.scriptPath}`);
        this.results.broken.push({
          scriptName,
          command: scriptCommand,
          exitCode: -1,
          error: `File not found: ${syntaxCheck.scriptPath}`,
          type: 'missing_file'
        });
        tested++;
        continue;
      }
      
      // Test script execution
      console.log(`   🧪 Running: npm run ${scriptName}`);
      const testResult = await this.testScript(scriptName, scriptCommand);
      
      if (testResult.success) {
        console.log(`   ✅ Success`);
        this.results.working.push(testResult);
      } else {
        console.log(`   ❌ Failed (exit code: ${testResult.exitCode})`);
        if (testResult.stderr) {
          console.log(`      Error: ${testResult.stderr.slice(0, 100)}...`);
        }
        this.results.broken.push({
          ...testResult,
          type: testResult.timedOut ? 'timeout' : 'execution_error'
        });
      }
      
      tested++;
    }
    
    return this.generateSummary();
  }

  /**
   * Generate validation summary
   */
  generateSummary() {
    const total = this.results.working.length + this.results.broken.length + this.results.skipped.length;
    
    this.results.summary = {
      total,
      working: this.results.working.length,
      broken: this.results.broken.length,
      skipped: this.results.skipped.length,
      workingPercentage: Math.round((this.results.working.length / total) * 100),
      brokenPercentage: Math.round((this.results.broken.length / total) * 100),
      skippedPercentage: Math.round((this.results.skipped.length / total) * 100)
    };
    
    return this.results;
  }

  /**
   * Generate detailed report
   */
  generateDetailedReport() {
    console.log('\n═'.repeat(80));
    console.log('📊 SCRIPT VALIDATION SUMMARY');
    console.log('═'.repeat(80));
    
    const { summary } = this.results;
    console.log(`📋 Total Scripts: ${summary.total}`);
    console.log(`✅ Working: ${summary.working} (${summary.workingPercentage}%)`);
    console.log(`❌ Broken: ${summary.broken} (${summary.brokenPercentage}%)`);
    console.log(`⏭️  Skipped: ${summary.skipped} (${summary.skippedPercentage}%)`);
    
    // Category breakdown
    console.log('\n📊 CATEGORY BREAKDOWN:');
    Object.entries(this.results.categories)
      .sort((a, b) => b[1].length - a[1].length)
      .forEach(([category, scripts]) => {
        console.log(`   ${category}: ${scripts.length} scripts`);
      });
    
    // Broken scripts details
    if (this.results.broken.length > 0) {
      console.log('\n❌ BROKEN SCRIPTS:');
      this.results.broken.forEach(script => {
        console.log(`   ${script.scriptName}: ${script.error || script.stderr || 'Execution failed'}`);
      });
    }
    
    // Environmental requirement scripts
    if (this.results.skipped.length > 0) {
      console.log('\n⏭️  SKIPPED SCRIPTS (by category):');
      const skippedByReason = {};
      this.results.skipped.forEach(script => {
        if (!skippedByReason[script.reason]) {
          skippedByReason[script.reason] = [];
        }
        skippedByReason[script.reason].push(script.scriptName);
      });
      
      Object.entries(skippedByReason).forEach(([reason, scripts]) => {
        console.log(`   ${reason}: ${scripts.length} scripts`);
        scripts.forEach(scriptName => {
          console.log(`     - ${scriptName}`);
        });
      });
    }
    
    console.log('\n═'.repeat(80));
    return this.results;
  }

  /**
   * Save results to file
   */
  async saveResults(filename = 'artifacts/scripts-validation-report.json') {
    try {
      await fs.mkdir(path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, JSON.stringify(this.results, null, 2));
      console.log(`📄 Detailed results saved to: ${filename}`);
    } catch (error) {
      console.error(`❌ Failed to save results: ${error.message}`);
    }
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new ScriptValidator();
  
  validator.validateAllScripts()
    .then(results => {
      validator.generateDetailedReport();
      return validator.saveResults();
    })
    .catch(error => {
      console.error('❌ Validation failed:', error);
      process.exit(1);
    });
}

export default ScriptValidator;