#!/usr/bin/env node
/**
 * NPM Scripts Inventory and Classification System
 *
 * Analyzes package.json scripts and categorizes them by:
 * - Prefix-based classification
 * - Risk level assessment (safe/grey/black)
 * - Dependency analysis
 * - Cross-platform compatibility
 *
 * Generates comprehensive inventory for validation pipeline.
 */

import fs from 'fs/promises';
import path from 'path';
import { addMetadata, stableStringify } from './lib/json-stable.js';

class ScriptsInventory {
  constructor() {
    this.riskPatterns = {
      safe: [
        /^lint/, /^test/, /^validate/, /^check/, /^verify/, /^status/,
        /^show/, /^list/, /^get/, /^read/, /^view/, /^info/, /^help/,
        /^schema/, /^generate.*\.js$/, /^analyze/, /^report/,
      ],
      grey: [
        /^build/, /^compile/, /^bundle/, /^install/, /^setup/,
        /^start.*/, /^serve/, /^dev/, /^watch/, /^monitor/,
        /^backup/, /^restore/, /^migrate/, /^sync/,
      ],
      black: [
        /^deploy/, /^publish/, /^release/, /^destroy/, /^delete/,
        /^remove/, /^clean/, /^reset/, /^kill/, /^stop/,
        /^drop/, /^wipe/, /^purge/, /^force/,
      ],
    };

    this.categories = {
      'Core Development & Validation': ['lint', 'test', 'format', 'validate', 'check', 'verify'],
      'Spec Hash & Integrity': ['spec-hash', 'param', 'evidence'],
      'Core Services': ['service'],
      'Privacy & PII Tools': ['privacy', 'pii'],
      'Fairness & Equity': ['fairness', 'equity'],
      'Infrastructure Management': ['infra', 'infrastructure'],
      'Docker & Container Management': ['docker', 'container'],
      'Kubernetes Operations': ['k8s', 'kubernetes', 'kube'],
      'Performance & Monitoring': ['perf', 'performance', 'benchmark'],
      'Observability & Metrics': ['observability', 'metrics', 'monitoring'],
      'High Availability': ['ha', 'cluster', 'replica'],
      'Compliance & Security': ['compliance', 'security', 'audit'],
      'Week Status & Demos': ['phase', 'week', 'demo', 'status'],
      'API & Services Testing': ['api', 'smoke', 'endpoint'],
      'Data & Analytics': ['data', 'analytics', 'reporting'],
      'UI & Frontend': ['ui', 'frontend', 'a11y'],
      'Chain & Blockchain': ['chain', 'signer', 'collector'],
      'Governance & Policy': ['governance', 'policy', 'dec'],
      'Event Processing': ['event', 'pipeline'],
      'Documentation & Help': ['docs', 'help', 'readme'],
      'Deployment & CI/CD': ['deploy', 'ci', 'cd', 'publish'],
      'Database & Storage': ['db', 'database', 'storage'],
      'Scripts Management': ['scripts'],
    };
  }

  /**
   * Analyze all scripts in package.json
   */
  async analyzeScripts() {
    try {
      console.log('📋 Analyzing NPM scripts inventory...');

      const packagePath = path.join(process.cwd(), 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf8');
      const packageData = JSON.parse(packageContent);

      const scripts = packageData.scripts || {};
      const scriptNames = Object.keys(scripts);

      console.log(`📦 Found ${scriptNames.length} scripts to analyze`);

      const inventory = {
        metadata: {
          total_scripts: scriptNames.length,
          analyzed_at: new Date().toISOString(),
          package_version: packageData.version,
          node_version: process.version,
        },
        categories: {},
        risk_levels: {
          safe: [],
          grey: [],
          black: [],
          unknown: [],
        },
        cross_platform_issues: [],
        dependency_analysis: {},
        scripts_details: {},
      };

      console.log('🔍 Analyzing individual scripts...');

      // Analyze each script
      for (const [name, command] of Object.entries(scripts)) {
        const analysis = this.analyzeScript(name, command);

        // Categorize by prefix
        const category = this.categorizeScript(name);
        if (!inventory.categories[category]) {
          inventory.categories[category] = [];
        }
        inventory.categories[category].push(name);

        // Risk level classification
        inventory.risk_levels[analysis.risk_level].push(name);

        // Cross-platform issues
        if (analysis.cross_platform_issues.length > 0) {
          inventory.cross_platform_issues.push({
            script: name,
            issues: analysis.cross_platform_issues,
          });
        }

        // Store detailed analysis
        inventory.scripts_details[name] = analysis;
      }

      console.log('📊 Analyzing dependencies...');

      // Dependency analysis
      inventory.dependency_analysis = await this.analyzeDependencies(packageData);

      // Generate summary statistics
      inventory.summary = this.generateSummary(inventory);

      console.log('💾 Saving inventory...');

      // Save inventory
      const outputPath = path.join('artifacts', 'scripts', 'inventory.json');
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      const output = {
        tool: 'scripts-inventory',
        version: '1.0.0',
        generated_at: new Date().toISOString(),
        ...inventory,
        _metadata: {
          generated_at: new Date().toISOString(),
          generator: 'scripts-inventory',
          version: '1.0',
          git_sha: process.env.GITHUB_SHA || 'unknown',
          run_id: process.env.GITHUB_RUN_ID || 'local',
          actor: process.env.GITHUB_ACTOR || 'local-user',
          git_ref: process.env.GITHUB_REF || 'unknown',
        },
      };

      await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf8');

      console.log(`✅ Scripts inventory saved to ${outputPath}`);
      console.log(`📊 Summary: ${inventory.summary.safe_scripts}/${inventory.metadata.total_scripts} safe scripts (${Math.round(inventory.summary.safe_coverage * 100)}% safe coverage)`);

      return inventory;

    } catch (error) {
      console.error('❌ Failed to analyze scripts:', error);
      throw error;
    }
  }

  /**
   * Analyze individual script
   */
  analyzeScript(name, command) {
    const analysis = {
      name,
      command,
      risk_level: 'unknown',
      category: this.categorizeScript(name),
      estimated_duration: this.estimateDuration(command),
      requires_network: this.requiresNetwork(command),
      requires_filesystem_write: this.requiresFilesystemWrite(command),
      cross_platform_issues: [],
      dependencies: this.extractDependencies(command),
      can_run_safely: false,
      skip_reason: null,
    };

    // Determine risk level
    analysis.risk_level = this.determineRiskLevel(name, command);

    // Check cross-platform compatibility
    analysis.cross_platform_issues = this.checkCrossPlatformIssues(command);

    // Determine if can run safely
    analysis.can_run_safely = analysis.risk_level === 'safe' &&
                              analysis.cross_platform_issues.length === 0 &&
                              !this.hasProhibitedPatterns(command);

    if (!analysis.can_run_safely) {
      analysis.skip_reason = this.getSkipReason(analysis);
    }

    return analysis;
  }

  /**
   * Categorize script by name/prefix
   */
  categorizeScript(name) {
    for (const [category, prefixes] of Object.entries(this.categories)) {
      if (prefixes.some(prefix => name.startsWith(prefix))) {
        return category;
      }
    }
    return 'Uncategorized';
  }

  /**
   * Determine risk level based on patterns
   */
  determineRiskLevel(name, command) {
    // Check safe patterns first
    for (const pattern of this.riskPatterns.safe) {
      if (pattern.test(name) || pattern.test(command)) {
        return 'safe';
      }
    }

    // Check black patterns (destructive)
    for (const pattern of this.riskPatterns.black) {
      if (pattern.test(name) || pattern.test(command)) {
        return 'black';
      }
    }

    // Check grey patterns (potentially risky)
    for (const pattern of this.riskPatterns.grey) {
      if (pattern.test(name) || pattern.test(command)) {
        return 'grey';
      }
    }

    // Additional heuristics
    if (command.includes('--watch') || command.includes('--serve')) {
      return 'grey';
    }

    if (command.includes('rm ') || command.includes('del ') ||
        command.includes('> /dev/null') || command.includes('--force')) {
      return 'black';
    }

    return 'unknown';
  }

  /**
   * Check for cross-platform compatibility issues
   */
  checkCrossPlatformIssues(command) {
    const issues = [];

    // PowerShell specific
    if (command.includes('powershell') || command.includes('.ps1')) {
      issues.push('powershell_dependency');
    }

    // Shell-specific operators
    if (command.includes(' && ') && !command.includes('npm-run-all')) {
      issues.push('shell_chaining_operators');
    }

    if (command.includes(' || ')) {
      issues.push('shell_logical_operators');
    }

    // Environment variable syntax
    if (command.includes('$') && !command.includes('npm_')) {
      issues.push('environment_variable_syntax');
    }

    // Path separators
    if (command.includes('\\')) {
      issues.push('windows_path_separators');
    }

    return issues;
  }

  /**
   * Check for prohibited patterns that make scripts unsafe
   */
  hasProhibitedPatterns(command) {
    const prohibited = [
      /sudo/, /su /, /chmod/, /chown/,
      /format /, /fdisk/, /mkfs/,
      /DROP TABLE/, /DELETE FROM/,
      /rm -rf/, /del \/s/, /rmdir \/s/,
    ];

    return prohibited.some(pattern => pattern.test(command));
  }

  /**
   * Estimate script duration
   */
  estimateDuration(command) {
    if (command.includes('test') || command.includes('lint')) {
      return 'short'; // < 30s
    }
    if (command.includes('build') || command.includes('compile')) {
      return 'medium'; // 30s - 5min
    }
    if (command.includes('install') || command.includes('deploy')) {
      return 'long'; // > 5min
    }
    return 'unknown';
  }

  /**
   * Check if script requires network access
   */
  requiresNetwork(command) {
    return command.includes('npm install') ||
           command.includes('curl') ||
           command.includes('wget') ||
           command.includes('git clone') ||
           command.includes('docker pull') ||
           command.includes('http://') ||
           command.includes('https://');
  }

  /**
   * Check if script requires filesystem write access
   */
  requiresFilesystemWrite(command) {
    return command.includes(' > ') ||
           command.includes('mkdir') ||
           command.includes('touch') ||
           command.includes('write') ||
           this.determineRiskLevel('', command) !== 'safe';
  }

  /**
   * Extract dependencies from command
   */
  extractDependencies(command) {
    const deps = [];

    if (command.includes('node ')) {
      deps.push('nodejs');
    }
    if (command.includes('npm ')) {
      deps.push('npm');
    }
    if (command.includes('docker')) {
      deps.push('docker');
    }
    if (command.includes('kubectl') || command.includes('k8s')) {
      deps.push('kubernetes');
    }
    if (command.includes('curl')) {
      deps.push('curl');
    }

    return deps;
  }

  /**
   * Get reason why script should be skipped
   */
  getSkipReason(analysis) {
    if (analysis.risk_level === 'black') {
      return 'destructive_operations';
    }
    if (analysis.risk_level === 'grey') {
      return 'potentially_risky_operations';
    }
    if (analysis.cross_platform_issues.length > 0) {
      return `cross_platform_issues: ${analysis.cross_platform_issues.join(', ')}`;
    }
    if (this.hasProhibitedPatterns(analysis.command)) {
      return 'prohibited_patterns_detected';
    }
    return 'unknown_safety_level';
  }

  /**
   * Analyze package dependencies
   */
  async analyzeDependencies(packageData) {
    return {
      has_cross_env: 'cross-env' in (packageData.dependencies || {}),
      has_npm_run_all: 'npm-run-all' in (packageData.dependencies || {}),
      has_concurrently: 'concurrently' in (packageData.dependencies || {}),
      total_dependencies: Object.keys(packageData.dependencies || {}).length,
      total_dev_dependencies: Object.keys(packageData.devDependencies || {}).length,
    };
  }

  /**
   * Generate summary statistics
   */
  generateSummary(inventory) {
    const total = inventory.metadata.total_scripts;
    const safe = inventory.risk_levels.safe.length;
    const grey = inventory.risk_levels.grey.length;
    const black = inventory.risk_levels.black.length;
    const unknown = inventory.risk_levels.unknown.length;

    return {
      total_scripts: total,
      safe_scripts: safe,
      grey_scripts: grey,
      black_scripts: black,
      unknown_scripts: unknown,
      safe_coverage: safe / total,
      categories_count: Object.keys(inventory.categories).length,
      cross_platform_issues: inventory.cross_platform_issues.length,
      can_run_safely_count: Object.values(inventory.scripts_details)
        .filter(s => s.can_run_safely).length,
    };
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const inventory = new ScriptsInventory();
    await inventory.analyzeScripts();
    console.log('✅ Scripts inventory analysis complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Scripts inventory failed:', error);
    process.exit(1);
  }
}

export { ScriptsInventory };
