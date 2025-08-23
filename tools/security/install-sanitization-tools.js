#!/usr/bin/env node
/**
 * install-sanitization-tools.js
 * Auto-install git-filter-repo and BFG Repo-Cleaner for git history sanitization
 * Provides comprehensive tooling for removing secrets from git history
 */

import { promises as fs } from 'fs';
import { spawnSync } from 'child_process';
import { stableStringify } from '../lib/json-stable.js';

const TOOLS_DIR = '/tmp/sanitization-tools';
const ARTIFACTS_DIR = 'artifacts';

/**
 * Install git-filter-repo via pip
 */
async function installGitFilterRepo() {
  console.log('[install-sanitization] Installing git-filter-repo...');

  // Check if already installed
  const checkResult = spawnSync('git-filter-repo', ['--version'], { encoding: 'utf8' });
  if (checkResult.status === 0) {
    console.log('[install-sanitization] git-filter-repo already installed');
    return {
      tool: 'git-filter-repo',
      status: 'ALREADY_INSTALLED',
      version: checkResult.stdout.trim(),
      path: 'git-filter-repo',
    };
  }

  // Try pip install
  const pipResult = spawnSync('pip3', ['install', 'git-filter-repo'], {
    encoding: 'utf8',
    timeout: 120000,
  });

  if (pipResult.status === 0) {
    const versionResult = spawnSync('git-filter-repo', ['--version'], { encoding: 'utf8' });
    return {
      tool: 'git-filter-repo',
      status: 'INSTALLED_VIA_PIP',
      version: versionResult.stdout?.trim() || 'unknown',
      path: 'git-filter-repo',
      install_output: pipResult.stdout,
    };
  }

  // Try manual download as fallback
  console.log('[install-sanitization] Pip install failed, trying manual download...');
  await fs.mkdir(TOOLS_DIR, { recursive: true });

  const downloadResult = spawnSync('wget', [
    '-O', `${TOOLS_DIR}/git-filter-repo`,
    'https://raw.githubusercontent.com/newren/git-filter-repo/main/git-filter-repo',
  ], {
    encoding: 'utf8',
    timeout: 60000,
  });

  if (downloadResult.status === 0) {
    spawnSync('chmod', ['+x', `${TOOLS_DIR}/git-filter-repo`]);

    // Test the downloaded version
    const testResult = spawnSync('python3', [`${TOOLS_DIR}/git-filter-repo`, '--version'], {
      encoding: 'utf8',
    });

    if (testResult.status === 0) {
      return {
        tool: 'git-filter-repo',
        status: 'INSTALLED_MANUAL',
        version: testResult.stdout?.trim() || 'unknown',
        path: `${TOOLS_DIR}/git-filter-repo`,
        requires_python: true,
      };
    }
  }

  return {
    tool: 'git-filter-repo',
    status: 'FAILED',
    error: 'Could not install git-filter-repo via pip or manual download',
    pip_error: pipResult.stderr,
    download_error: downloadResult.stderr,
  };
}

/**
 * Install BFG Repo-Cleaner
 */
async function installBFG() {
  console.log('[install-sanitization] Installing BFG Repo-Cleaner...');

  await fs.mkdir(TOOLS_DIR, { recursive: true });

  // Check if already downloaded
  const bfgPath = `${TOOLS_DIR}/bfg.jar`;
  try {
    await fs.access(bfgPath);
    console.log('[install-sanitization] BFG already downloaded');
    return {
      tool: 'bfg',
      status: 'ALREADY_DOWNLOADED',
      path: bfgPath,
      requires_java: true,
    };
  } catch (error) {
    // Not found, download it
  }

  // Download BFG jar
  const downloadResult = spawnSync('wget', [
    '-O', bfgPath,
    'https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar',
  ], {
    encoding: 'utf8',
    timeout: 60000,
  });

  if (downloadResult.status === 0) {
    // Test that Java can run it
    const testResult = spawnSync('java', ['-jar', bfgPath, '--help'], {
      encoding: 'utf8',
      timeout: 10000,
    });

    if (testResult.status === 0) {
      return {
        tool: 'bfg',
        status: 'INSTALLED',
        path: bfgPath,
        requires_java: true,
        version: '1.14.0',
      };
    } else {
      return {
        tool: 'bfg',
        status: 'DOWNLOADED_BUT_JAVA_FAILED',
        path: bfgPath,
        java_error: testResult.stderr,
        note: 'BFG downloaded but Java test failed - may still work',
      };
    }
  }

  return {
    tool: 'bfg',
    status: 'FAILED',
    error: 'Could not download BFG Repo-Cleaner',
    download_error: downloadResult.stderr,
  };
}

/**
 * Verify system dependencies
 */
async function checkDependencies() {
  console.log('[install-sanitization] Checking system dependencies...');

  const deps = {
    python3: spawnSync('python3', ['--version'], { encoding: 'utf8' }),
    pip3: spawnSync('pip3', ['--version'], { encoding: 'utf8' }),
    java: spawnSync('java', ['-version'], { encoding: 'utf8' }),
    git: spawnSync('git', ['--version'], { encoding: 'utf8' }),
    wget: spawnSync('wget', ['--version'], { encoding: 'utf8' }),
  };

  const report = {};

  for (const [tool, result] of Object.entries(deps)) {
    report[tool] = {
      available: result.status === 0,
      version: result.status === 0 ? (result.stdout || result.stderr).split('\n')[0] : null,
      error: result.status !== 0 ? result.stderr : null,
    };
  }

  return report;
}

/**
 * Generate installation report
 */
async function generateReport(dependencies, gitFilterRepo, bfg) {
  const report = {
    installation_type: 'git_history_sanitization_tools',
    timestamp: new Date().toISOString(),
    status: 'UNKNOWN',
    dependencies: dependencies,
    tools: {
      git_filter_repo: gitFilterRepo,
      bfg: bfg,
    },
    usage_examples: {
      git_filter_repo: [
        'git filter-repo --strip-blobs-bigger-than 10M',
        "git filter-repo --path-glob '*.key' --invert-paths",
        'git filter-repo --replace-text secrets.txt',
      ],
      bfg: [
        "java -jar bfg.jar --delete-files '*.key' repo.git",
        'java -jar bfg.jar --replace-text secrets.txt repo.git',
        'java -jar bfg.jar --delete-folders cache repo.git',
      ],
    },
    recommendations: [],
  };

  // Determine overall status
  const gitFilterRepoOk = gitFilterRepo.status.includes('INSTALLED') || gitFilterRepo.status === 'ALREADY_INSTALLED';
  const bfgOk = bfg.status.includes('INSTALLED') || bfg.status === 'ALREADY_DOWNLOADED' || bfg.status === 'DOWNLOADED_BUT_JAVA_FAILED';

  if (gitFilterRepoOk && bfgOk) {
    report.status = 'SUCCESS';
    report.summary = 'Both git-filter-repo and BFG installed successfully';
  } else if (gitFilterRepoOk || bfgOk) {
    report.status = 'PARTIAL';
    report.summary = 'One sanitization tool installed successfully';
    if (!gitFilterRepoOk) {
      report.recommendations.push('git-filter-repo installation failed - try manual pip install');
    }
    if (!bfgOk) {
      report.recommendations.push('BFG installation failed - ensure Java is available');
    }
  } else {
    report.status = 'FAILED';
    report.summary = 'Both sanitization tools failed to install';
    report.recommendations.push('Check system dependencies and network connectivity');
    report.recommendations.push('Consider manual installation of tools');
  }

  // Add dependency warnings
  if (!dependencies.python3.available) {
    report.recommendations.push('Python 3 required for git-filter-repo');
  }
  if (!dependencies.java.available) {
    report.recommendations.push('Java required for BFG Repo-Cleaner');
  }

  // Write report
  await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(
    `${ARTIFACTS_DIR}/sanitization-tools-install.json`,
    stableStringify(report, null, 2),
  );

  return report;
}

/**
 * Main installation function
 */
async function main() {
  try {
    console.log('[install-sanitization] Starting sanitization tools installation...');

    // Check dependencies first
    const dependencies = await checkDependencies();

    // Install tools
    const gitFilterRepo = await installGitFilterRepo();
    const bfg = await installBFG();

    // Generate report
    const report = await generateReport(dependencies, gitFilterRepo, bfg);

    console.log(`[install-sanitization] Installation complete. Status: ${report.status}`);
    console.log(`[install-sanitization] Summary: ${report.summary}`);

    if (report.recommendations.length > 0) {
      console.log('[install-sanitization] Recommendations:');
      report.recommendations.forEach(rec => console.log(`  - ${rec}`));
    }

    // Exit with appropriate code
    if (report.status === 'FAILED') {
      console.error('[install-sanitization] Installation failed');
      process.exit(1);
    } else if (report.status === 'PARTIAL') {
      console.warn('[install-sanitization] Partial installation - some tools may not be available');
      // Don't exit with error for partial success
    } else {
      console.log('[install-sanitization] All tools installed successfully');
    }

  } catch (error) {
    console.error('[install-sanitization] Installation error:', error.message);

    const errorReport = {
      installation_type: 'git_history_sanitization_tools',
      timestamp: new Date().toISOString(),
      status: 'ERROR',
      error: error.message,
    };

    await fs.mkdir(ARTIFACTS_DIR, { recursive: true });
    await fs.writeFile(
      `${ARTIFACTS_DIR}/sanitization-tools-install.json`,
      stableStringify(errorReport, null, 2),
    );

    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { installGitFilterRepo, installBFG, checkDependencies };
