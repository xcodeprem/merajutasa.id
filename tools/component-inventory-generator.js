#!/usr/bin/env node
/**
 * Component Inventory Generator
 * Scans infrastructure directory and documentation to create comprehensive
 * component inventory with all required fields for dependency mapping
 */

import { promises as fs } from 'fs';
import path from 'path';
import { stableStringify } from './lib/json-stable.js';

const INFRASTRUCTURE_DIR = 'infrastructure';
const DOCS_IMPLEMENTATION_DIR = 'docs/implementation';
const OUTPUT_DIR = 'docs/architecture';

class ComponentInventoryGenerator {
  constructor() {
    this.components = [];
    this.processedFiles = new Set();
  }

  async generateInventory() {
    console.log('🔍 Scanning infrastructure components...');

    try {
      // Scan infrastructure directory
      await this.scanInfrastructureDirectory();

      // Scan documentation for additional metadata
      await this.scanImplementationDocs();

      // Generate output files
      await this.generateOutputFiles();

      console.log(`✅ Generated component inventory with ${this.components.length} components`);
      return true;
    } catch (error) {
      console.error('❌ Component inventory generation failed:', error.message);
      return false;
    }
  }

  async scanInfrastructureDirectory() {
    const files = await this.findJavaScriptFiles(INFRASTRUCTURE_DIR);

    for (const filePath of files) {
      if (this.processedFiles.has(filePath)) {continue;}

      const component = await this.extractComponentInfo(filePath);
      if (component) {
        this.components.push(component);
        this.processedFiles.add(filePath);
      }
    }
  }

  async findJavaScriptFiles(directory) {
    const files = [];

    async function scan(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          await scan(fullPath);
        } else if (entry.isFile() && fullPath.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    }

    await scan(directory);
    return files;
  }

  async extractComponentInfo(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const relativePath = path.relative('.', filePath);

      // Extract basic info from file path and content
      const pathParts = filePath.split(path.sep);
      const fileName = path.basename(filePath, '.js');
      const category = pathParts[1] || 'unknown';
      const subcategory = pathParts[2] || '';

      // Generate component ID from path
      const componentId = this.generateComponentId(filePath);

      // Extract metadata from content
      const metadata = this.parseComponentMetadata(content);

      // Determine component type based on category and content
      const type = this.determineComponentType(category, subcategory, content);

      // Extract ports from configuration
      const ports = this.extractPorts(content);

      // Extract dependencies
      const dependencies = this.extractDependencies(content);

      // Extract health check information
      const healthCheck = this.extractHealthCheck(content);

      // Generate description
      const description = this.generateDescription(content, fileName, category);

      // Determine failure impact
      const failureImpact = this.determineFailureImpact(category, type, dependencies);

      return {
        id: componentId,
        name: this.generateHumanName(fileName, category),
        description: description,
        type: type,
        category: category,
        subcategory: subcategory,
        filePath: relativePath,
        ports: ports,
        requiredUpstreams: dependencies,
        healthCheck: healthCheck,
        failureImpact: failureImpact,
        lastModified: await this.getLastModified(filePath),
        ...metadata,
      };
    } catch (error) {
      console.warn(`⚠️  Could not process ${filePath}: ${error.message}`);
      return null;
    }
  }

  generateComponentId(filePath) {
    const pathParts = filePath.split(path.sep);
    const fileName = path.basename(filePath, '.js');

    // Remove 'infrastructure' from path and create readable ID
    const relevantParts = pathParts.slice(1); // Remove 'infrastructure'
    relevantParts[relevantParts.length - 1] = fileName; // Replace .js with just filename

    return relevantParts.join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-');
  }

  parseComponentMetadata(content) {
    const metadata = {};

    // Extract class name if it's a class-based component
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    if (classMatch) {
      metadata.className = classMatch[1];
    }

    // Extract version if available
    const versionMatch = content.match(/version:\s*['"]([^'"]+)['"]/);
    if (versionMatch) {
      metadata.version = versionMatch[1];
    }

    // Extract author/maintainer if available
    const authorMatch = content.match(/@author\s+(.+)/);
    if (authorMatch) {
      metadata.author = authorMatch[1].trim();
    }

    return metadata;
  }

  determineComponentType(category, subcategory, content) {
    // Map categories to types
    const categoryTypeMap = {
      'api-gateway': 'gateway',
      'auth': 'authentication',
      'monitoring': 'monitoring',
      'observability': 'observability',
      'security': 'security',
      'backup': 'storage',
      'compliance': 'compliance',
      'high-availability': 'infrastructure',
      'integration': 'middleware',
      'performance': 'optimization',
      'cicd': 'automation',
      'kubernetes': 'orchestration',
      'terraform': 'infrastructure',
      'docker': 'containerization',
      'reverse-proxy': 'proxy',
    };

    // Check for specific patterns in content
    if (content.includes('express') || content.includes('fastify')) {
      return 'service';
    }
    if (content.includes('database') || content.includes('db')) {
      return 'database';
    }
    if (content.includes('cache') || content.includes('redis')) {
      return 'cache';
    }
    if (content.includes('queue') || content.includes('worker')) {
      return 'worker';
    }

    return categoryTypeMap[category] || 'service';
  }

  extractPorts(content) {
    const ports = [];

    // Common port patterns - be more specific
    const portPatterns = [
      /port:\s*(?:process\.env\.\w+\s*\|\|\s*)?(\d+)/gi,
      /PORT\s*=\s*(?:process\.env\.\w+\s*\|\|\s*)?(\d+)/gi,
      /listen\(\s*(\d+)/gi,
      /server\.listen\(\s*(\d+)/gi,
      /createServer\([^)]*\)\.listen\(\s*(\d+)/gi,
    ];

    for (const pattern of portPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const port = parseInt(match[1]);
        if (port >= 1000 && port <= 65535 && !ports.includes(port)) {
          ports.push(port);
        }
      }
    }

    // Extract from environment variables
    const envPortPattern = /process\.env\.(\w*PORT\w*)/gi;
    let envMatch;
    while ((envMatch = envPortPattern.exec(content)) !== null) {
      const envVar = envMatch[1];
      if (!ports.some(p => typeof p === 'string' && p.includes(envVar))) {
        ports.push(`env:${envVar}`);
      }
    }

    // Limit to first 10 ports to avoid noise
    return ports.slice(0, 10);
  }

  extractDependencies(content) {
    const dependencies = [];

    // Look for import statements that might indicate dependencies
    const serviceImports = content.match(/from\s+['"](\.\/[^'"]*|\.\.\/[^'"]*)['"]/g);
    if (serviceImports) {
      serviceImports.forEach(imp => {
        const match = imp.match(/from\s+['"]([^'"]+)['"]/);
        if (match) {
          const dep = match[1].replace(/^\.+\//, '').replace(/\.js$/, '');
          if (dep && !dependencies.includes(dep)) {
            dependencies.push(dep);
          }
        }
      });
    }

    // Look for service references
    const serviceRefs = [
      /signer/gi, /chain/gi, /collector/gi, /auth/gi, /database/gi, /redis/gi,
      /gateway/gi, /monitoring/gi, /metrics/gi, /logging/gi,
    ];

    for (const pattern of serviceRefs) {
      if (pattern.test(content) && !dependencies.some(d => pattern.test(d))) {
        dependencies.push(pattern.source.toLowerCase());
      }
    }

    return dependencies.slice(0, 10); // Limit to 10 to avoid noise
  }

  extractHealthCheck(content) {
    // Look for health check patterns - prioritize specific endpoint patterns
    const healthEndpointPatterns = [
      /['"]([^'"]*\/health[^'"]*)['"]/,
      /endpoint:\s*['"]([^'"]*)['"]/,
      /healthEndpoint:\s*['"]([^'"]*)['"]/,
    ];

    for (const pattern of healthEndpointPatterns) {
      const match = content.match(pattern);
      if (match && match[1].length < 50) { // Avoid capturing too much text
        return {
          endpoint: match[1],
          type: 'http',
        };
      }
    }

    // Check for common health check patterns
    if (content.includes('/health') || content.includes('healthCheck')) {
      return {
        endpoint: '/health',
        type: 'http',
      };
    }

    if (content.includes('ping()') || content.includes('status()')) {
      return {
        type: 'method',
        method: content.includes('ping()') ? 'ping' : 'status',
      };
    }

    return {
      type: 'none',
      status: 'no health check implemented',
    };
  }

  generateDescription(content, fileName, category) {
    // Look for JSDoc comments first
    const jsdocMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\n\s*\*\//s);
    if (jsdocMatch) {
      const desc = jsdocMatch[1]
        .replace(/\n\s*\*\s*/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
      if (desc.length > 10) {
        return desc;
      }
    }

    // Look for single-line comment at top
    const commentMatch = content.match(/^\s*\/\*\*?\s*\n?\s*[\*\/]*\s*(.+?)(?:\n|\*\/)/);
    if (commentMatch && commentMatch[1].trim().length > 10) {
      return commentMatch[1].trim();
    }

    // Generate based on filename and category
    const humanName = this.generateHumanName(fileName, category);
    return `${humanName} component providing ${category} functionality`;
  }

  generateHumanName(fileName, category) {
    // Convert kebab-case and snake_case to Title Case
    const name = fileName
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    return name;
  }

  determineFailureImpact(category, type, dependencies) {
    // Critical components that would cause system failure
    const criticalCategories = ['api-gateway', 'auth', 'integration'];
    const criticalTypes = ['gateway', 'authentication', 'database'];

    if (criticalCategories.includes(category) || criticalTypes.includes(type)) {
      return 'critical';
    }

    // High impact if many dependencies
    if (dependencies.length > 5) {
      return 'high';
    }

    // Monitoring and observability are medium impact
    if (['monitoring', 'observability', 'security'].includes(category)) {
      return 'medium';
    }

    // Performance and optimization are low impact
    if (['performance', 'backup', 'optimization'].includes(category)) {
      return 'low';
    }

    return 'medium';
  }

  async getLastModified(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.mtime.toISOString();
    } catch (error) {
      return new Date().toISOString();
    }
  }

  async scanImplementationDocs() {
    // This could be extended to scan documentation for additional metadata
    console.log('📄 Scanning implementation documentation...');
    // For now, we rely primarily on code analysis
  }

  async generateOutputFiles() {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    // Sort components by category then by name
    this.components.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.name.localeCompare(b.name);
    });

    // Generate JSON inventory
    const jsonInventory = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalComponents: this.components.length,
        generator: 'component-inventory-generator',
        version: '1.0.0',
        source: 'infrastructure/ directory scan',
      },
      components: this.components,
    };

    const jsonPath = path.join(OUTPUT_DIR, 'component-inventory.json');
    await fs.writeFile(jsonPath, stableStringify(jsonInventory, null, 2));
    console.log(`✅ Generated: ${jsonPath}`);

    // Generate CSV inventory
    const csvPath = path.join(OUTPUT_DIR, 'component-inventory.csv');
    const csvContent = this.generateCSV();
    await fs.writeFile(csvPath, csvContent);
    console.log(`✅ Generated: ${csvPath}`);

    // Generate summary report
    const summaryPath = path.join(OUTPUT_DIR, 'component-inventory-summary.md');
    const summaryContent = this.generateSummary();
    await fs.writeFile(summaryPath, summaryContent);
    console.log(`✅ Generated: ${summaryPath}`);
  }

  generateCSV() {
    const headers = [
      'ID', 'Name', 'Description', 'Type', 'Category', 'Subcategory',
      'File Path', 'Ports', 'Required Upstreams', 'Health Check Type',
      'Health Check Endpoint', 'Failure Impact', 'Last Modified',
    ];

    const rows = [headers.join(',')];

    for (const component of this.components) {
      // Clean up health check endpoint to avoid CSV issues
      let healthEndpoint = '';
      if (component.healthCheck.endpoint) {
        healthEndpoint = component.healthCheck.endpoint.substring(0, 50); // Limit length
        healthEndpoint = healthEndpoint.replace(/["\n\r]/g, ' '); // Clean quotes and newlines
      } else if (component.healthCheck.method) {
        healthEndpoint = component.healthCheck.method;
      }

      const row = [
        component.id,
        `"${component.name}"`,
        `"${component.description.substring(0, 100)}"`, // Limit description length
        component.type,
        component.category,
        component.subcategory || '',
        component.filePath,
        `"${component.ports.join(';')}"`,
        `"${component.requiredUpstreams.join(';')}"`,
        component.healthCheck.type,
        `"${healthEndpoint}"`,
        component.failureImpact,
        component.lastModified,
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  generateSummary() {
    const categoryStats = {};
    const typeStats = {};
    const impactStats = {};

    for (const component of this.components) {
      categoryStats[component.category] = (categoryStats[component.category] || 0) + 1;
      typeStats[component.type] = (typeStats[component.type] || 0) + 1;
      impactStats[component.failureImpact] = (impactStats[component.failureImpact] || 0) + 1;
    }

    const totalPorts = this.components.reduce((sum, c) => sum + c.ports.length, 0);
    const componentsWithHealthChecks = this.components.filter(c => c.healthCheck.type !== 'none').length;

    return `# Component Inventory Summary

Generated: ${new Date().toISOString()}
Total Components: ${this.components.length}

## Statistics

### By Category
${Object.entries(categoryStats)
    .sort(([,a], [,b]) => b - a)
    .map(([cat, count]) => `- **${cat}**: ${count} components`)
    .join('\n')}

### By Type  
${Object.entries(typeStats)
    .sort(([,a], [,b]) => b - a)
    .map(([type, count]) => `- **${type}**: ${count} components`)
    .join('\n')}

### By Failure Impact
${Object.entries(impactStats)
    .sort(([,a], [,b]) => b - a)
    .map(([impact, count]) => `- **${impact}**: ${count} components`)
    .join('\n')}

## Key Metrics

- **Total Ports Configured**: ${totalPorts}
- **Components with Health Checks**: ${componentsWithHealthChecks}/${this.components.length} (${Math.round(componentsWithHealthChecks/this.components.length*100)}%)
- **Average Dependencies per Component**: ${Math.round(this.components.reduce((sum, c) => sum + c.requiredUpstreams.length, 0) / this.components.length * 10) / 10}

## Files Generated

1. \`component-inventory.json\` - Machine-readable inventory
2. \`component-inventory.csv\` - Spreadsheet-compatible format  
3. \`component-inventory-summary.md\` - This summary report

## Usage

This inventory supports:
- Dependency mapping and analysis
- Critical path identification  
- Failure impact assessment
- Port conflict detection
- Health monitoring orchestration

---

*Generated by component-inventory-generator.js*
`;
  }
}

async function main() {
  const generator = new ComponentInventoryGenerator();
  const success = await generator.generateInventory();

  if (!success) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ComponentInventoryGenerator };
