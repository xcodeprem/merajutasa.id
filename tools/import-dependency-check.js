#!/usr/bin/env node
/**
 * Import Dependency Checker
 *
 * Scans JavaScript files for unresolved imports and potential circular dependencies.
 * Used as a CI gate to prevent import issues like those fixed in Week 6.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ImportDependencyChecker {
  constructor() {
    this.issues = [];
    this.scannedFiles = new Set();
    this.importGraph = new Map();
  }

  async checkProject() {
    console.log('🔍 Scanning project for import dependency issues...');

    // Scan infrastructure components
    await this.scanDirectory('infrastructure');

    // Check for issues
    await this.validateImports();
    await this.detectCircularDependencies();

    // Report results
    this.reportResults();

    return this.issues.length === 0;
  }

  async scanDirectory(dirPath) {
    const fullPath = path.join(process.cwd(), dirPath);

    try {
      const entries = await fs.readdir(fullPath, { withFileTypes: true });

      for (const entry of entries) {
        const entryPath = path.join(fullPath, entry.name);
        const relativePath = path.relative(process.cwd(), entryPath);

        if (entry.isDirectory()) {
          await this.scanDirectory(relativePath);
        } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
          await this.scanFile(relativePath);
        }
      }
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
      }
    }
  }

  async scanFile(filePath) {
    if (this.scannedFiles.has(filePath)) {
      return;
    }

    this.scannedFiles.add(filePath);

    try {
      const content = await fs.readFile(filePath, 'utf8');
      const imports = this.extractImports(content);

      this.importGraph.set(filePath, imports);

      // Check each import
      for (const importInfo of imports) {
        await this.validateImport(filePath, importInfo);
      }

    } catch (error) {
      this.addIssue('FILE_READ_ERROR', filePath, null, error.message);
    }
  }

  extractImports(content) {
    const imports = [];

    // Match ES6 import statements
    const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*(?:{[^}]*}|\*\s+as\s+\w+|\w+))?\s*from\s+['"](.*?)['"];?/g;

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const importPath = match[1];
      imports.push({
        path: importPath,
        line: content.substring(0, match.index).split('\n').length,
        statement: match[0],
      });
    }

    return imports;
  }

  async validateImport(sourceFile, importInfo) {
    const { path: importPath, line, statement } = importInfo;

    // Skip node built-ins and npm packages
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      return;
    }

    // Resolve the import path
    const resolvedPath = await this.resolveImportPath(sourceFile, importPath);

    if (!resolvedPath) {
      this.addIssue('UNRESOLVED_IMPORT', sourceFile, line,
        `Cannot resolve import: ${importPath}`);
      return;
    }

    // Check if the file exists
    try {
      await fs.access(resolvedPath);
    } catch (error) {
      this.addIssue('MISSING_FILE', sourceFile, line,
        `Import points to non-existent file: ${importPath} -> ${resolvedPath}`);
    }
  }

  async resolveImportPath(sourceFile, importPath) {
    const sourceDir = path.dirname(sourceFile);

    // Handle relative imports
    if (importPath.startsWith('.')) {
      let resolvedPath = path.resolve(sourceDir, importPath);

      // If no extension, try .js
      if (!path.extname(resolvedPath)) {
        resolvedPath += '.js';
      }

      return resolvedPath;
    }

    // Handle absolute imports (should be rare in this project)
    if (importPath.startsWith('/')) {
      return path.resolve(process.cwd(), importPath.substring(1));
    }

    return null;
  }

  async validateImports() {
    console.log('🔍 Validating import resolution...');

    // Additional validation could be added here
    // For now, the validation is done during scanning
  }

  detectCircularDependencies() {
    console.log('🔍 Detecting circular dependencies...');

    const visited = new Set();
    const recursionStack = new Set();

    for (const file of this.importGraph.keys()) {
      if (!visited.has(file)) {
        this.detectCircularDependenciesRecursive(file, visited, recursionStack, []);
      }
    }
  }

  detectCircularDependenciesRecursive(file, visited, recursionStack, path) {
    visited.add(file);
    recursionStack.add(file);

    const imports = this.importGraph.get(file) || [];

    for (const importInfo of imports) {
      const resolvedPath = this.resolveImportPathSync(file, importInfo.path);

      if (!resolvedPath || !this.importGraph.has(resolvedPath)) {
        continue;
      }

      if (recursionStack.has(resolvedPath)) {
        // Found circular dependency
        const cycle = [...path, file, resolvedPath];
        this.addIssue('CIRCULAR_DEPENDENCY', file, importInfo.line,
          `Circular dependency detected: ${cycle.join(' -> ')}`);
        continue;
      }

      if (!visited.has(resolvedPath)) {
        this.detectCircularDependenciesRecursive(
          resolvedPath, visited, recursionStack, [...path, file],
        );
      }
    }

    recursionStack.delete(file);
  }

  resolveImportPathSync(sourceFile, importPath) {
    try {
      const sourceDir = path.dirname(sourceFile);

      if (importPath.startsWith('.')) {
        let resolvedPath = path.resolve(sourceDir, importPath);
        if (!path.extname(resolvedPath)) {
          resolvedPath += '.js';
        }
        return resolvedPath;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  addIssue(type, file, line, message) {
    this.issues.push({
      type,
      file: path.relative(process.cwd(), file),
      line,
      message,
      timestamp: new Date().toISOString(),
    });
  }

  reportResults() {
    console.log('\n📊 Import Dependency Check Results:');
    console.log(`   Files Scanned: ${this.scannedFiles.size}`);
    console.log(`   Issues Found: ${this.issues.length}`);

    if (this.issues.length === 0) {
      console.log('✅ No import dependency issues detected');
      return;
    }

    // Group issues by type
    const issuesByType = this.issues.reduce((acc, issue) => {
      acc[issue.type] = acc[issue.type] || [];
      acc[issue.type].push(issue);
      return acc;
    }, {});

    for (const [type, issues] of Object.entries(issuesByType)) {
      console.log(`\n❌ ${type} (${issues.length} issues):`);
      for (const issue of issues) {
        const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;
        console.log(`   ${location} - ${issue.message}`);
      }
    }

    // Save detailed report
    this.saveReport();
  }

  async saveReport() {
    const report = {
      timestamp: new Date().toISOString(),
      scan_summary: {
        files_scanned: this.scannedFiles.size,
        issues_found: this.issues.length,
        issue_types: [...new Set(this.issues.map(i => i.type))],
      },
      issues: this.issues,
      scanned_files: [...this.scannedFiles],
    };

    const artifactsDir = path.join(process.cwd(), 'artifacts');
    await fs.mkdir(artifactsDir, { recursive: true });

    const reportPath = path.join(artifactsDir, 'import-dependency-check.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    console.log(`\n📄 Detailed report saved: ${path.relative(process.cwd(), reportPath)}`);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const checker = new ImportDependencyChecker();

  checker.checkProject().then(success => {
    if (success) {
      console.log('\n✅ Import dependency check passed');
      process.exit(0);
    } else {
      console.log('\n❌ Import dependency check failed');
      process.exit(1);
    }
  }).catch(error => {
    console.error('Import dependency checker failed:', error);
    process.exit(1);
  });
}

export default ImportDependencyChecker;
