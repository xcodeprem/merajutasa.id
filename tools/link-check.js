#!/usr/bin/env node

/**
 * Link Check Tool for MerajutASA.id Documentation
 *
 * Validates internal markdown links and generates a comprehensive report.
 * Focuses on:
 * - Relative path validation
 * - Anchor link verification
 * - Cross-reference integrity
 *
 * Usage: node tools/link-check.js [--file=path] [--output=path]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DEFAULT_OUTPUT = 'docs/_reports/link-check.json';
const DOCS_ROOT = path.resolve(__dirname, '..', 'docs');

class LinkChecker {
  constructor(options = {}) {
    this.options = {
      outputFile: options.outputFile || DEFAULT_OUTPUT,
      targetFile: options.targetFile || null,
      verbose: options.verbose || false,
    };

    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalFiles: 0,
        totalLinks: 0,
        validLinks: 0,
        brokenLinks: 0,
        warningLinks: 0,
      },
      files: [],
      errors: [],
      warnings: [],
    };
  }

  log(message, level = 'info') {
    if (this.options.verbose || level === 'error') {
      console.log(`[${level.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Extract markdown links from content
   * Matches: [text](path) and [text](path#anchor)
   */
  extractLinks(content, filePath) {
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const links = [];
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, text, href] = match;
      const lineNumber = content.substring(0, match.index).split('\n').length;

      // Skip external links (http/https) and mailto links
      if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:')) {
        continue;
      }

      links.push({
        text: text.trim(),
        href: href.trim(),
        line: lineNumber,
        fullMatch,
        sourceFile: filePath,
      });
    }

    return links;
  }

  /**
   * Validate a single link
   */
  validateLink(link) {
    const { href, sourceFile } = link;
    const result = {
      ...link,
      status: 'valid',
      message: '',
      resolvedPath: '',
    };

    try {
      // Parse href for file path and anchor
      const [filePath, anchor] = href.split('#');

      // Resolve relative path from source file's directory
      const sourceDir = path.dirname(sourceFile);
      let targetPath;

      if (filePath) {
        // Resolve relative to source file location
        if (filePath.startsWith('/')) {
          // Absolute path from docs root
          targetPath = path.resolve(DOCS_ROOT, filePath.substring(1));
        } else {
          // Relative path from source file
          targetPath = path.resolve(sourceDir, filePath);
        }

        result.resolvedPath = targetPath;

        // Check if target file exists
        if (!fs.existsSync(targetPath)) {
          result.status = 'broken';
          result.message = `File not found: ${targetPath}`;
          return result;
        }

        // If there's an anchor, validate it exists in the target file
        if (anchor) {
          const targetContent = fs.readFileSync(targetPath, 'utf8');
          const anchorId = this.normalizeAnchor(anchor);
          const headings = this.extractHeadings(targetContent);

          const headingFound = headings.some(heading =>
            this.normalizeAnchor(heading) === anchorId,
          );

          if (!headingFound) {
            result.status = 'warning';
            result.message = `Anchor not found: #${anchor} in ${targetPath}`;
          }
        }
      } else if (anchor) {
        // Just an anchor link within same file
        const sourceContent = fs.readFileSync(sourceFile, 'utf8');
        const anchorId = this.normalizeAnchor(anchor);
        const headings = this.extractHeadings(sourceContent);

        const headingFound = headings.some(heading =>
          this.normalizeAnchor(heading) === anchorId,
        );

        if (!headingFound) {
          result.status = 'warning';
          result.message = `Anchor not found: #${anchor} in same file`;
        }
      }

    } catch (error) {
      result.status = 'broken';
      result.message = `Validation error: ${error.message}`;
    }

    return result;
  }

  /**
   * Extract headings from markdown content
   */
  extractHeadings(content) {
    const headingRegex = /^#{1,6}\s+(.+)$/gm;
    const headings = [];
    let match;

    while ((match = headingRegex.exec(content)) !== null) {
      headings.push(match[1].trim());
    }

    return headings;
  }

  /**
   * Normalize anchor text for comparison (GitHub-style)
   */
  normalizeAnchor(text) {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special chars except hyphens
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Process a single markdown file
   */
  processFile(filePath) {
    this.log(`Processing: ${filePath}`);

    const content = fs.readFileSync(filePath, 'utf8');
    const links = this.extractLinks(content, filePath);

    const fileResult = {
      path: path.relative(process.cwd(), filePath),
      totalLinks: links.length,
      validLinks: 0,
      brokenLinks: 0,
      warningLinks: 0,
      links: [],
    };

    // Validate each link
    for (const link of links) {
      const validation = this.validateLink(link);
      fileResult.links.push(validation);

      switch (validation.status) {
      case 'valid':
        fileResult.validLinks++;
        this.results.summary.validLinks++;
        break;
      case 'broken':
        fileResult.brokenLinks++;
        this.results.summary.brokenLinks++;
        this.results.errors.push({
          file: fileResult.path,
          line: validation.line,
          link: validation.href,
          message: validation.message,
        });
        this.log(`BROKEN LINK: ${fileResult.path}:${validation.line} - ${validation.href} (${validation.message})`, 'error');
        break;
      case 'warning':
        fileResult.warningLinks++;
        this.results.summary.warningLinks++;
        this.results.warnings.push({
          file: fileResult.path,
          line: validation.line,
          link: validation.href,
          message: validation.message,
        });
        this.log(`WARNING: ${fileResult.path}:${validation.line} - ${validation.href} (${validation.message})`, 'warn');
        break;
      }
    }

    this.results.summary.totalLinks += fileResult.totalLinks;
    this.results.files.push(fileResult);

    return fileResult;
  }

  /**
   * Find all markdown files to process
   */
  findMarkdownFiles(startPath = DOCS_ROOT) {
    const files = [];

    const traverse = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip node_modules and hidden directories
          if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
            traverse(fullPath);
          }
        } else if (entry.isFile() && entry.name.endsWith('.md')) {
          files.push(fullPath);
        }
      }
    };

    traverse(startPath);
    return files;
  }

  /**
   * Run the link check process
   */
  async run() {
    this.log('Starting link check...');

    let filesToProcess;

    if (this.options.targetFile) {
      // Process specific file
      const targetPath = path.resolve(this.options.targetFile);
      if (!fs.existsSync(targetPath)) {
        throw new Error(`Target file not found: ${targetPath}`);
      }
      filesToProcess = [targetPath];
    } else {
      // Process all markdown files in docs/
      filesToProcess = this.findMarkdownFiles();
    }

    this.results.summary.totalFiles = filesToProcess.length;
    this.log(`Found ${filesToProcess.length} markdown files to process`);

    // Process each file
    for (const filePath of filesToProcess) {
      try {
        this.processFile(filePath);
      } catch (error) {
        this.log(`Error processing ${filePath}: ${error.message}`, 'error');
        this.results.errors.push({
          file: path.relative(process.cwd(), filePath),
          line: 0,
          link: '',
          message: `Processing error: ${error.message}`,
        });
      }
    }

    // Write results
    await this.writeResults();

    // Summary
    const { summary } = this.results;
    this.log('\n=== LINK CHECK SUMMARY ===');
    this.log(`Files processed: ${summary.totalFiles}`);
    this.log(`Total links: ${summary.totalLinks}`);
    this.log(`Valid links: ${summary.validLinks}`);
    this.log(`Broken links: ${summary.brokenLinks}`);
    this.log(`Warning links: ${summary.warningLinks}`);
    this.log(`Report written to: ${this.options.outputFile}`);

    return this.results;
  }

  /**
   * Write results to JSON file
   */
  async writeResults() {
    const outputPath = path.resolve(this.options.outputFile);
    const outputDir = path.dirname(outputPath);

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(this.results, null, 2), 'utf8');
  }
}

// CLI handling
async function main() {
  const args = process.argv.slice(2);
  const options = {};

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      options.targetFile = arg.split('=')[1];
    } else if (arg.startsWith('--output=')) {
      options.outputFile = arg.split('=')[1];
    } else if (arg === '--verbose') {
      options.verbose = true;
    }
  }

  try {
    const checker = new LinkChecker(options);
    const results = await checker.run();

    // Exit with error code if there are broken links
    if (results.summary.brokenLinks > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Link check failed:', error.message);
    process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LinkChecker };
