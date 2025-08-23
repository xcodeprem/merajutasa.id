#!/usr/bin/env node
/**
 * NPM Scripts Validation Harness
 *
 * Safely executes and validates npm scripts with:
 * - Timeout protection
 * - Environment isolation
 * - Result capture and analysis
 * - Safety filtering (safe scripts only)
 *
 * Generates validation reports for governance pipeline.
 */

import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';
import { addMetadata, stableStringify } from './lib/json-stable.js';

class ScriptsValidator {
  constructor(options = {}) {
    this.options = {
      timeout: options.timeout || 120000, // 2 minutes default
      maxParallel: options.maxParallel || 3,
      safeOnly: options.safeOnly !== false,
      dryRun: options.dryRun || false,
      verbose: options.verbose || false,
      environment: {
        NODE_ENV: 'test',
        NO_COLOR: '1',
        CI: '1',
        ...options.environment,
      },
    };

    this.results = {
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        timeout: 0,
      },
      scripts: {},
      started_at: new Date().toISOString(),
      completed_at: null,
    };
  }

  /**
   * Validate all eligible scripts
   */
  async validateScripts() {
    try {
      console.log('🧪 Starting NPM scripts validation...');
      console.log(`⚙️ Mode: ${this.options.safeOnly ? 'Safe scripts only' : 'All scripts'}`);
      console.log(`⏱️ Timeout: ${this.options.timeout / 1000}s`);
      console.log(`🔄 Max parallel: ${this.options.maxParallel}`);

      // Load inventory
      const inventory = await this.loadInventory();
      if (!inventory) {
        throw new Error('Scripts inventory not found. Run scripts:inventory first.');
      }

      // Get scripts to validate
      const scriptsToValidate = await this.getScriptsToValidate(inventory);
      this.results.summary.total = scriptsToValidate.length;

      console.log(`📋 Found ${scriptsToValidate.length} scripts to validate`);

      if (this.options.dryRun) {
        console.log('🏃‍♂️ Dry run - scripts that would be executed:');
        scriptsToValidate.forEach(script => {
          console.log(`  - ${script.name}: ${script.command}`);
        });
        return this.results;
      }

      // Validate scripts in batches
      const batches = this.createBatches(scriptsToValidate, this.options.maxParallel);

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        console.log(`📦 Processing batch ${i + 1}/${batches.length} (${batch.length} scripts)`);

        const batchPromises = batch.map(script =>
          this.validateScript(script.name, script.command, inventory.scripts_details[script.name]),
        );

        await Promise.allSettled(batchPromises);
      }

      this.results.completed_at = new Date().toISOString();

      // Generate summary
      this.generateValidationSummary();

      // Save results
      await this.saveResults();

      console.log('✅ Scripts validation completed');
      this.printSummary();

      return this.results;

    } catch (error) {
      console.error('❌ Scripts validation failed:', error);
      throw error;
    }
  }

  /**
   * Load scripts inventory
   */
  async loadInventory() {
    try {
      const inventoryPath = path.join('artifacts', 'scripts', 'inventory.json');
      const content = await fs.readFile(inventoryPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️ Could not load scripts inventory:', error.message);
      return null;
    }
  }

  /**
   * Get scripts that should be validated
   */
  async getScriptsToValidate(inventory) {
    const packagePath = path.join(process.cwd(), 'package.json');
    const packageContent = await fs.readFile(packagePath, 'utf8');
    const packageData = JSON.parse(packageContent);
    const scripts = packageData.scripts || {};

    const scriptsToValidate = [];

    for (const [name, command] of Object.entries(scripts)) {
      const details = inventory.scripts_details[name];

      // Skip if safe-only mode and script is not safe
      if (this.options.safeOnly && details && !details.can_run_safely) {
        this.results.scripts[name] = {
          status: 'skipped',
          skip_reason: details.skip_reason || 'not_safe_for_validation',
          command: command,
        };
        this.results.summary.skipped++;
        continue;
      }

      // Skip if script has known issues
      if (this.shouldSkipScript(name, command, details)) {
        this.results.scripts[name] = {
          status: 'skipped',
          skip_reason: this.getSkipReason(name, command, details),
          command: command,
        };
        this.results.summary.skipped++;
        continue;
      }

      scriptsToValidate.push({ name, command });
    }

    return scriptsToValidate;
  }

  /**
   * Check if script should be skipped
   */
  shouldSkipScript(name, command, details) {
    // Skip long-running services
    if (name.includes('service:') && !name.includes('test')) {
      return true;
    }

    // Skip watch commands
    if (command.includes('--watch')) {
      return true;
    }

    // Skip deployment scripts
    if (name.includes('deploy') || name.includes('publish')) {
      return true;
    }

    // Skip scripts that require user interaction
    if (command.includes('--interactive') || command.includes('read ')) {
      return true;
    }

    // Skip PowerShell scripts
    if (command.includes('powershell') || command.includes('.ps1')) {
      return true;
    }

    return false;
  }

  /**
   * Get skip reason for script
   */
  getSkipReason(name, command, details) {
    if (name.includes('service:') && !name.includes('test')) {
      return 'long_running_service';
    }
    if (command.includes('--watch')) {
      return 'watch_mode_command';
    }
    if (name.includes('deploy') || name.includes('publish')) {
      return 'deployment_script';
    }
    if (command.includes('--interactive')) {
      return 'interactive_command';
    }
    if (command.includes('powershell') || command.includes('.ps1')) {
      return 'powershell_dependency';
    }
    return details?.skip_reason || 'unknown';
  }

  /**
   * Create batches for parallel execution
   */
  createBatches(scripts, batchSize) {
    const batches = [];
    for (let i = 0; i < scripts.length; i += batchSize) {
      batches.push(scripts.slice(i, i + batchSize));
    }
    return batches;
  }

  /**
   * Validate individual script
   */
  async validateScript(name, command, details) {
    const startTime = Date.now();

    console.log(`🧪 Validating: ${name}`);

    if (this.options.verbose) {
      console.log(`  Command: ${command}`);
    }

    try {
      const result = await this.executeScript(name, command);
      const duration = Date.now() - startTime;

      this.results.scripts[name] = {
        status: result.exitCode === 0 ? 'passed' : 'failed',
        exit_code: result.exitCode,
        duration_ms: duration,
        stdout_preview: this.truncateOutput(result.stdout),
        stderr_preview: this.truncateOutput(result.stderr),
        command: command,
        validated_at: new Date().toISOString(),
      };

      if (result.exitCode === 0) {
        this.results.summary.passed++;
        console.log(`  ✅ ${name} (${duration}ms)`);
      } else {
        this.results.summary.failed++;
        console.log(`  ❌ ${name} (exit code: ${result.exitCode})`);
        if (result.stderr && this.options.verbose) {
          console.log(`    Error: ${result.stderr.substring(0, 200)}`);
        }
      }

    } catch (error) {
      const duration = Date.now() - startTime;

      if (error.message === 'TIMEOUT') {
        this.results.summary.timeout++;
        this.results.scripts[name] = {
          status: 'timeout',
          duration_ms: duration,
          command: command,
          error: 'Script execution timed out',
          validated_at: new Date().toISOString(),
        };
        console.log(`  ⏱️ ${name} (timeout after ${duration}ms)`);
      } else {
        this.results.summary.failed++;
        this.results.scripts[name] = {
          status: 'error',
          duration_ms: duration,
          command: command,
          error: error.message,
          validated_at: new Date().toISOString(),
        };
        console.log(`  ❌ ${name} (error: ${error.message})`);
      }
    }
  }

  /**
   * Execute script with timeout and isolation
   */
  executeScript(name, command) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        child.kill('SIGTERM');
        reject(new Error('TIMEOUT'));
      }, this.options.timeout);

      const child = spawn('npm', ['run', name], {
        env: { ...process.env, ...this.options.environment },
        stdio: 'pipe',
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (exitCode) => {
        clearTimeout(timeout);
        resolve({
          exitCode: exitCode || 0,
          stdout: stdout,
          stderr: stderr,
        });
      });

      child.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * Truncate output for preview
   */
  truncateOutput(output, maxLength = 500) {
    if (!output) {return '';}
    if (output.length <= maxLength) {return output;}
    return output.substring(0, maxLength) + '... [truncated]';
  }

  /**
   * Generate validation summary
   */
  generateValidationSummary() {
    const duration = new Date(this.results.completed_at) - new Date(this.results.started_at);

    this.results.validation_summary = {
      total_duration_ms: duration,
      success_rate: this.results.summary.passed / this.results.summary.total,
      failure_rate: this.results.summary.failed / this.results.summary.total,
      timeout_rate: this.results.summary.timeout / this.results.summary.total,
      skip_rate: this.results.summary.skipped / this.results.summary.total,
      passed_scripts: Object.keys(this.results.scripts)
        .filter(name => this.results.scripts[name].status === 'passed'),
      failed_scripts: Object.keys(this.results.scripts)
        .filter(name => this.results.scripts[name].status === 'failed'),
      timeout_scripts: Object.keys(this.results.scripts)
        .filter(name => this.results.scripts[name].status === 'timeout'),
      skipped_scripts: Object.keys(this.results.scripts)
        .filter(name => this.results.scripts[name].status === 'skipped'),
    };
  }

  /**
   * Save validation results
   */
  async saveResults() {
    const outputPath = path.join('artifacts', 'scripts', 'validation.json');
    await fs.mkdir(path.dirname(outputPath), { recursive: true });

    const output = addMetadata({
      tool: 'scripts-validator',
      version: '1.0.0',
      options: this.options,
      generated_at: new Date().toISOString(),
    }, this.results);

    await fs.writeFile(outputPath, stableStringify(output), 'utf8');

    // Also save a summary file
    const summaryPath = path.join('artifacts', 'scripts', 'validation-summary.json');
    const summary = {
      ...this.results.validation_summary,
      summary: this.results.summary,
      completed_at: this.results.completed_at,
    };

    const summaryOutput = addMetadata({
      tool: 'scripts-validator-summary',
      version: '1.0.0',
      generated_at: new Date().toISOString(),
    }, summary);

    await fs.writeFile(summaryPath, stableStringify(summaryOutput), 'utf8');

    console.log(`📄 Validation results saved to ${outputPath}`);
    console.log(`📋 Validation summary saved to ${summaryPath}`);
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const { summary, validation_summary } = this.results;

    console.log('\n📊 Validation Summary:');
    console.log(`  Total scripts: ${summary.total}`);
    console.log(`  ✅ Passed: ${summary.passed} (${Math.round(validation_summary.success_rate * 100)}%)`);
    console.log(`  ❌ Failed: ${summary.failed} (${Math.round(validation_summary.failure_rate * 100)}%)`);
    console.log(`  ⏱️ Timeout: ${summary.timeout} (${Math.round(validation_summary.timeout_rate * 100)}%)`);
    console.log(`  ⏭️ Skipped: ${summary.skipped} (${Math.round(validation_summary.skip_rate * 100)}%)`);
    console.log(`  ⏱️ Duration: ${Math.round(validation_summary.total_duration_ms / 1000)}s`);

    if (validation_summary.failed_scripts.length > 0) {
      console.log('\n❌ Failed scripts:');
      validation_summary.failed_scripts.forEach(name => {
        const result = this.results.scripts[name];
        console.log(`  - ${name}: ${result.error || `exit code ${result.exit_code}`}`);
      });
    }

    if (validation_summary.timeout_scripts.length > 0) {
      console.log('\n⏱️ Timeout scripts:');
      validation_summary.timeout_scripts.forEach(name => {
        console.log(`  - ${name}`);
      });
    }
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose'),
    safeOnly: !args.includes('--all'),
    timeout: args.includes('--timeout') ?
      parseInt(args[args.indexOf('--timeout') + 1]) * 1000 : 120000,
  };

  try {
    const validator = new ScriptsValidator(options);
    await validator.validateScripts();

    // Exit with appropriate code
    const success_rate = validator.results.validation_summary?.success_rate || 0;
    if (success_rate < 0.95) { // Less than 95% success rate
      console.log('⚠️ Validation success rate below target (95%)');
      process.exit(1);
    }

    console.log('✅ Scripts validation successful');
    process.exit(0);
  } catch (error) {
    console.error('❌ Scripts validation failed:', error);
    process.exit(1);
  }
}

export { ScriptsValidator };
