#!/usr/bin/env node
/**
 * failure-impact-matrix-generator.js
 * Generates failure impact matrix from dependency data
 * Maps components vs impact and identifies critical paths and blast radius
 */

import { promises as fs } from 'fs';
import path from 'path';
import { stableStringify } from './lib/json-stable.js';

class FailureImpactMatrixGenerator {
  constructor() {
    this.components = new Map();
    this.dependencies = null;
    this.inventory = new Map();
    this.impactMatrix = new Map();
    this.criticalPaths = [];
    this.slaAffectingDeps = [];
    this.blastRadius = new Map();
  }

  async generate() {
    console.log('🎯 Generating failure impact matrix...');

    try {
      await this.loadDependencyMatrix();
      await this.loadComponentInventory();
      await this.analyzeCriticalPaths();
      await this.calculateBlastRadius();
      await this.identifySLAAffectingDeps();
      await this.buildImpactMatrix();
      await this.generateMarkdownReport();

      console.log('✅ Failure impact matrix generated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failure impact matrix generation failed:', error.message);
      throw error;
    }
  }

  async loadDependencyMatrix() {
    const dependenciesPath = 'docs/architecture/dependencies.json';

    try {
      const content = await fs.readFile(dependenciesPath, 'utf8');
      this.dependencies = JSON.parse(content);

      // Load components from dependency matrix
      for (const node of this.dependencies.nodes) {
        this.components.set(node.id, {
          id: node.id,
          name: node.name,
          type: node.type,
          category: node.category,
          criticality: node.criticality,
          dependencies: node.dependencies || [],
          dependents: node.dependents || [],
        });
      }

      console.log(`✅ Loaded ${this.components.size} components from dependency matrix`);
    } catch (error) {
      throw new Error(`Failed to load dependency matrix: ${error.message}`);
    }
  }

  async loadComponentInventory() {
    const inventoryPath = 'docs/architecture/component-inventory.json';

    try {
      const content = await fs.readFile(inventoryPath, 'utf8');
      const inventory = JSON.parse(content);

      // Index inventory by ID for quick lookup
      for (const component of inventory.components) {
        this.inventory.set(component.id, component);
      }

      console.log(`✅ Loaded ${this.inventory.size} components from inventory`);
    } catch (error) {
      console.warn(`⚠️  Could not load component inventory: ${error.message}`);
    }
  }

  async analyzeCriticalPaths() {
    console.log('🔍 Analyzing critical paths...');

    // Use existing critical path analysis from dependency matrix
    if (this.dependencies.analysis && this.dependencies.analysis.critical_path) {
      this.criticalPaths = this.dependencies.analysis.critical_path;
    }

    // Enhanced critical path analysis based on dependency depth and impact
    const pathAnalysis = new Map();

    for (const [componentId, component] of this.components) {
      const pathScore = this.calculatePathScore(componentId);
      const impactLevel = this.getComponentFailureImpact(componentId);

      pathAnalysis.set(componentId, {
        id: componentId,
        name: component.name,
        pathScore,
        impactLevel,
        dependentCount: component.dependents.length,
        dependencyCount: component.dependencies.length,
        isCritical: pathScore >= 10 || impactLevel === 'critical',
      });
    }

    // Sort by criticality score
    this.criticalPaths = Array.from(pathAnalysis.values())
      .filter(p => p.isCritical)
      .sort((a, b) => b.pathScore - a.pathScore);

    console.log(`✅ Identified ${this.criticalPaths.length} critical paths`);
  }

  calculatePathScore(componentId) {
    const component = this.components.get(componentId);
    if (!component) {return 0;}

    // Score based on dependents (blast radius) and dependencies (complexity)
    const dependentWeight = component.dependents.length * 3;
    const dependencyWeight = component.dependencies.length * 1;
    const criticalityWeight = component.criticality === 'critical' ? 10 :
      component.criticality === 'high' ? 5 :
        component.criticality === 'medium' ? 2 : 1;

    return dependentWeight + dependencyWeight + criticalityWeight;
  }

  getComponentFailureImpact(componentId) {
    // First check inventory for failure impact
    const inventoryComponent = this.inventory.get(componentId);
    if (inventoryComponent && inventoryComponent.failureImpact) {
      return inventoryComponent.failureImpact;
    }

    // Fallback to dependency matrix criticality
    const component = this.components.get(componentId);
    return component ? component.criticality : 'medium';
  }

  async calculateBlastRadius() {
    console.log('💥 Calculating blast radius...');

    for (const [componentId, component] of this.components) {
      const radius = this.calculateComponentBlastRadius(componentId);
      this.blastRadius.set(componentId, radius);
    }

    console.log(`✅ Calculated blast radius for ${this.blastRadius.size} components`);
  }

  calculateComponentBlastRadius(componentId, visited = new Set()) {
    if (visited.has(componentId)) {
      return { directImpact: [], cascadingImpact: [], totalImpacted: 0 };
    }

    visited.add(componentId);
    const component = this.components.get(componentId);
    if (!component) {return { directImpact: [], cascadingImpact: [], totalImpacted: 0 };}

    const directImpact = [...component.dependents];
    const cascadingImpact = [];

    // Calculate cascading failures
    for (const dependentId of component.dependents) {
      const cascading = this.calculateComponentBlastRadius(dependentId, new Set(visited));
      cascadingImpact.push(...cascading.directImpact, ...cascading.cascadingImpact);
    }

    // Remove duplicates
    const uniqueCascading = [...new Set(cascadingImpact)];

    return {
      directImpact,
      cascadingImpact: uniqueCascading,
      totalImpacted: directImpact.length + uniqueCascading.length,
    };
  }

  async identifySLAAffectingDeps() {
    console.log('⏱️  Identifying SLA-affecting dependencies...');

    for (const [componentId, component] of this.components) {
      const failureImpact = this.getComponentFailureImpact(componentId);
      const blastRadius = this.blastRadius.get(componentId);

      // SLA-affecting if critical or high impact with significant blast radius
      if (failureImpact === 'critical' ||
          (failureImpact === 'high' && blastRadius.totalImpacted > 2) ||
          component.dependents.length > 3) {

        this.slaAffectingDeps.push({
          id: componentId,
          name: component.name,
          impact: failureImpact,
          blastRadius: blastRadius.totalImpacted,
          affectedComponents: [...blastRadius.directImpact, ...blastRadius.cascadingImpact],
          reason: this.getSLAImpactReason(component, failureImpact, blastRadius),
        });
      }
    }

    // Sort by impact level and blast radius
    this.slaAffectingDeps.sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const impactDiff = impactOrder[b.impact] - impactOrder[a.impact];
      return impactDiff !== 0 ? impactDiff : b.blastRadius - a.blastRadius;
    });

    console.log(`✅ Identified ${this.slaAffectingDeps.length} SLA-affecting dependencies`);
  }

  getSLAImpactReason(component, failureImpact, blastRadius) {
    const reasons = [];

    if (failureImpact === 'critical') {
      reasons.push('Critical component failure causes system outage');
    }

    if (component.dependents.length > 3) {
      reasons.push(`High dependency count (${component.dependents.length} dependents)`);
    }

    if (blastRadius.totalImpacted > 5) {
      reasons.push(`Large blast radius (${blastRadius.totalImpacted} components affected)`);
    }

    if (component.type === 'gateway' || component.id.includes('gateway')) {
      reasons.push('Gateway component - single point of failure');
    }

    return reasons.join('; ');
  }

  async buildImpactMatrix() {
    console.log('📊 Building impact matrix...');

    // Create matrix of component vs impact type
    for (const [componentId, component] of this.components) {
      const failureImpact = this.getComponentFailureImpact(componentId);
      const blastRadius = this.blastRadius.get(componentId);
      const inventoryData = this.inventory.get(componentId);

      this.impactMatrix.set(componentId, {
        id: componentId,
        name: component.name,
        type: component.type,
        category: component.category || 'unknown',
        failureImpact,
        criticality: component.criticality,
        directImpact: blastRadius.directImpact,
        cascadingImpact: blastRadius.cascadingImpact,
        totalImpacted: blastRadius.totalImpacted,
        dependentCount: component.dependents.length,
        dependencyCount: component.dependencies.length,
        pathScore: this.calculatePathScore(componentId),
        slaAffecting: this.slaAffectingDeps.some(sla => sla.id === componentId),
        healthCheck: inventoryData?.healthCheck,
        ports: inventoryData?.ports || [],
      });
    }

    console.log(`✅ Built impact matrix for ${this.impactMatrix.size} components`);
  }

  async generateMarkdownReport() {
    console.log('📝 Generating markdown report...');

    await fs.mkdir('docs/architecture', { recursive: true });

    const report = this.buildMarkdownContent();

    await fs.writeFile('docs/architecture/failure-impact-matrix.md', report);
    console.log('✅ Generated docs/architecture/failure-impact-matrix.md');

    // Also generate JSON for machine consumption
    const jsonData = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      metadata: {
        total_components: this.components.size,
        critical_paths: this.criticalPaths.length,
        sla_affecting_deps: this.slaAffectingDeps.length,
        source: 'docs/architecture/dependencies.json',
        generator: 'failure-impact-matrix-generator',
      },
      critical_paths: this.criticalPaths,
      sla_affecting_dependencies: this.slaAffectingDeps,
      impact_matrix: Array.from(this.impactMatrix.values()),
      blast_radius: Object.fromEntries(this.blastRadius),
    };

    await fs.writeFile('docs/architecture/failure-impact-matrix.json', stableStringify(jsonData, null, 2));
    console.log('✅ Generated docs/architecture/failure-impact-matrix.json');
  }

  buildMarkdownContent() {
    const timestamp = new Date().toISOString();

    return `# Failure Impact Matrix

*Generated: ${timestamp}*

## Overview

This document provides a comprehensive failure impact analysis derived from the component dependency matrix. It identifies critical paths, SLA-affecting dependencies, and blast radius for each component to support incident response and capacity planning.

## Critical Path Analysis

### Critical Components (${this.criticalPaths.length} total)

${this.criticalPaths.map(path =>
    `**${path.name}** (${path.id})
- **Impact Level**: ${path.impactLevel}
- **Path Score**: ${path.pathScore}
- **Dependents**: ${path.dependentCount}
- **Dependencies**: ${path.dependencyCount}`,
  ).join('\n\n')}

## SLA-Affecting Dependencies

### High-Priority Components (${this.slaAffectingDeps.length} total)

${this.slaAffectingDeps.map(sla =>
    `#### ${sla.name} (${sla.id})
- **Impact Level**: ${sla.impact}
- **Blast Radius**: ${sla.blastRadius} components
- **Affected Components**: ${sla.affectedComponents.join(', ') || 'None'}
- **Reason**: ${sla.reason}`,
  ).join('\n\n')}

## Component Failure Impact Matrix

| Component | Type | Failure Impact | Criticality | Direct Impact | Cascading Impact | Total Impacted | SLA Affecting |
|-----------|------|----------------|-------------|---------------|------------------|----------------|---------------|
${Array.from(this.impactMatrix.values())
    .sort((a, b) => {
      const impactOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return (impactOrder[b.failureImpact] || 0) - (impactOrder[a.failureImpact] || 0);
    })
    .map(component =>
      `| ${component.name} | ${component.type} | ${component.failureImpact} | ${component.criticality} | ${component.directImpact.length} | ${component.cascadingImpact.length} | ${component.totalImpacted} | ${component.slaAffecting ? '🚨' : '✅'} |`,
    ).join('\n')}

## Blast Radius Analysis

### Components by Impact Scope

${this.generateBlastRadiusAnalysis()}

## Recovery Prioritization

### Tier 1 - Critical (Immediate Response Required)
${this.getComponentsByTier('critical')}

### Tier 2 - High Impact (Response within 1 hour)
${this.getComponentsByTier('high')}

### Tier 3 - Medium Impact (Response within 4 hours)
${this.getComponentsByTier('medium')}

### Tier 4 - Low Impact (Response within 24 hours)
${this.getComponentsByTier('low')}

## Incident Response Guidelines

### Critical Component Failure
1. **Immediate Actions** (0-5 minutes)
   - Activate incident response team
   - Assess scope using blast radius data
   - Begin failover procedures for affected SLA components

2. **Short-term Response** (5-30 minutes)
   - Isolate failed component
   - Activate backup systems for critical dependencies
   - Notify stakeholders based on SLA impact

3. **Recovery Actions** (30+ minutes)
   - Execute recovery procedures based on criticality tier
   - Monitor cascading effects on dependent components
   - Validate system integrity after recovery

### Capacity Planning Considerations

- **Critical Path Redundancy**: Ensure ${this.criticalPaths.length} critical components have failover
- **Load Balancing**: Distribute load across non-SLA-affecting components where possible
- **Monitoring**: Implement enhanced monitoring for components with blast radius > 3

## Data Sources

- **Dependency Matrix**: \`docs/architecture/dependencies.json\`
- **Component Inventory**: \`docs/architecture/component-inventory.json\`
- **Generated**: ${timestamp}
- **Generator**: \`failure-impact-matrix-generator.js\`

---

*This document is automatically generated from the dependency matrix to ensure consistency. Do not edit manually.*
`;
  }

  generateBlastRadiusAnalysis() {
    const radiusGroups = {
      'High Blast Radius (5+ components)': [],
      'Medium Blast Radius (2-4 components)': [],
      'Low Blast Radius (0-1 components)': [],
    };

    for (const [componentId, radius] of this.blastRadius) {
      const component = this.components.get(componentId);
      if (!component) {continue;}

      const entry = `- **${component.name}** (${componentId}): ${radius.totalImpacted} components`;

      if (radius.totalImpacted >= 5) {
        radiusGroups['High Blast Radius (5+ components)'].push(entry);
      } else if (radius.totalImpacted >= 2) {
        radiusGroups['Medium Blast Radius (2-4 components)'].push(entry);
      } else {
        radiusGroups['Low Blast Radius (0-1 components)'].push(entry);
      }
    }

    return Object.entries(radiusGroups)
      .map(([title, items]) => `#### ${title}\n${items.join('\n') || '- None'}`)
      .join('\n\n');
  }

  getComponentsByTier(tier) {
    const components = Array.from(this.impactMatrix.values())
      .filter(component => component.failureImpact === tier)
      .sort((a, b) => b.totalImpacted - a.totalImpacted);

    if (components.length === 0) {
      return '- None';
    }

    return components
      .map(component => `- **${component.name}** (${component.id}) - Affects ${component.totalImpacted} components`)
      .join('\n');
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new FailureImpactMatrixGenerator();
  await generator.generate();
}

export { FailureImpactMatrixGenerator };
