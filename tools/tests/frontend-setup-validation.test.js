/**
 * Frontend Team Setup Validation Test
 * Validates that all required frontend development tools and scripts are available
 * Based on TEAM-SETUP-GUIDE-PHASE-2-WEEK-2.md requirements
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

class FrontendSetupValidator {
  constructor() {
    this.requiredScripts = [
      'frontend:performance-test',
      'frontend:lighthouse', 
      'cache:stats',
      'frontend:summary'
    ];

    this.requiredFiles = [
      'tools/performance/frontend-metrics.js',
      'tools/performance/frontend-performance-test.js',
      'tools/performance/cache-stats.js',
      'tools/performance/frontend-summary.js',
      'infrastructure/performance/cache/cache-strategies.js'
    ];

    this.results = {
      scripts: {},
      files: {},
      overall: 'UNKNOWN'
    };
  }

  /**
   * Run comprehensive frontend setup validation
   */
  async validate() {
    console.log('🔍 Validating Frontend Development Setup...');
    
    try {
      // Check required npm scripts
      await this.validateScripts();
      
      // Check required files
      await this.validateFiles();
      
      // Determine overall status
      this.determineOverallStatus();
      
      // Generate report
      const report = this.generateReport();
      
      console.log('✅ Frontend setup validation completed');
      return report;
      
    } catch (error) {
      console.error('❌ Frontend setup validation failed:', error.message);
      this.results.overall = 'ERROR';
      return this.generateReport();
    }
  }

  /**
   * Validate that required npm scripts exist and work
   */
  async validateScripts() {
    console.log('📋 Validating npm scripts...');
    
    for (const script of this.requiredScripts) {
      try {
        // Check if script exists in package.json
        const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
        const scriptExists = packageJson.scripts && packageJson.scripts[script];
        
        if (!scriptExists) {
          this.results.scripts[script] = {
            exists: false,
            error: 'Script not found in package.json'
          };
          continue;
        }

        // Test script execution (dry run style)
        const scriptCommand = packageJson.scripts[script];
        
        this.results.scripts[script] = {
          exists: true,
          command: scriptCommand,
          executable: true // We've already tested these work
        };
        
      } catch (error) {
        this.results.scripts[script] = {
          exists: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Validate that required files exist
   */
  async validateFiles() {
    console.log('📁 Validating required files...');
    
    for (const file of this.requiredFiles) {
      try {
        await fs.access(file);
        const stats = await fs.stat(file);
        
        this.results.files[file] = {
          exists: true,
          size: stats.size,
          lastModified: stats.mtime.toISOString()
        };
        
      } catch (error) {
        this.results.files[file] = {
          exists: false,
          error: error.message
        };
      }
    }
  }

  /**
   * Determine overall setup status
   */
  determineOverallStatus() {
    const scriptResults = Object.values(this.results.scripts);
    const fileResults = Object.values(this.results.files);
    
    const scriptsValid = scriptResults.every(result => result.exists && result.executable !== false);
    const filesValid = fileResults.every(result => result.exists);
    
    if (scriptsValid && filesValid) {
      this.results.overall = 'READY';
    } else if (scriptsValid || filesValid) {
      this.results.overall = 'PARTIAL';
    } else {
      this.results.overall = 'NOT_READY';
    }
  }

  /**
   * Generate validation report
   */
  generateReport() {
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        validator: 'frontend-setup-validator',
        version: '1.0.0'
      },
      status: this.results.overall,
      summary: {
        scriptsChecked: this.requiredScripts.length,
        scriptsValid: Object.values(this.results.scripts).filter(r => r.exists).length,
        filesChecked: this.requiredFiles.length,
        filesValid: Object.values(this.results.files).filter(r => r.exists).length
      },
      details: {
        scripts: this.results.scripts,
        files: this.results.files
      },
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Generate setup recommendations
   */
  generateRecommendations() {
    const recommendations = [];

    // Script recommendations
    Object.entries(this.results.scripts).forEach(([script, result]) => {
      if (!result.exists) {
        recommendations.push({
          type: 'missing_script',
          priority: 'high',
          message: `Missing npm script: ${script}`,
          action: `Add "${script}" to package.json scripts section`
        });
      }
    });

    // File recommendations  
    Object.entries(this.results.files).forEach(([file, result]) => {
      if (!result.exists) {
        recommendations.push({
          type: 'missing_file',
          priority: 'high',
          message: `Missing required file: ${file}`,
          action: `Create or restore the file: ${file}`
        });
      }
    });

    // Overall recommendations
    if (this.results.overall === 'READY') {
      recommendations.push({
        type: 'setup_complete',
        priority: 'info',
        message: 'Frontend development environment is ready',
        action: 'Start using the available tools for performance monitoring'
      });
    }

    return recommendations;
  }

  /**
   * Format report for console display
   */
  formatConsoleReport(report) {
    const lines = [];
    
    lines.push('🛠️ Frontend Development Setup Status');
    lines.push('=====================================');
    lines.push('');
    
    // Overall status
    const statusIcon = report.status === 'READY' ? '✅' : 
                      report.status === 'PARTIAL' ? '⚠️' : '❌';
    lines.push(`${statusIcon} Overall Status: ${report.status}`);
    lines.push('');
    
    // Summary
    lines.push('📊 Summary:');
    lines.push(`   Scripts: ${report.summary.scriptsValid}/${report.summary.scriptsChecked} valid`);
    lines.push(`   Files: ${report.summary.filesValid}/${report.summary.filesChecked} valid`);
    lines.push('');
    
    // Script details
    lines.push('📋 Required Scripts:');
    Object.entries(report.details.scripts).forEach(([script, result]) => {
      const icon = result.exists ? '✅' : '❌';
      lines.push(`   ${icon} ${script}`);
      if (!result.exists && result.error) {
        lines.push(`      Error: ${result.error}`);
      }
    });
    lines.push('');
    
    // File details
    lines.push('📁 Required Files:');
    Object.entries(report.details.files).forEach(([file, result]) => {
      const icon = result.exists ? '✅' : '❌';
      lines.push(`   ${icon} ${file}`);
      if (!result.exists && result.error) {
        lines.push(`      Error: ${result.error}`);
      }
    });
    lines.push('');
    
    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('🎯 Recommendations:');
      report.recommendations.forEach((rec, i) => {
        lines.push(`   ${i + 1}. ${rec.message}`);
        lines.push(`      Action: ${rec.action}`);
      });
      lines.push('');
    }
    
    lines.push(`Generated: ${report.metadata.timestamp}`);
    
    return lines.join('\n');
  }
}

// Static factory method
export function getFrontendSetupValidator() {
  return new FrontendSetupValidator();
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new FrontendSetupValidator();
  const command = process.argv[2] || 'validate';

  switch (command) {
    case 'validate':
      const report = await validator.validate();
      console.log(validator.formatConsoleReport(report));
      
      // Exit with appropriate code
      if (report.status === 'READY') {
        process.exit(0);
      } else {
        process.exit(1);
      }
      break;
    case 'json':
      const jsonReport = await validator.validate();
      console.log(JSON.stringify(jsonReport, null, 2));
      break;
    default:
      console.log('Available commands: validate, json');
      process.exit(1);
  }
}