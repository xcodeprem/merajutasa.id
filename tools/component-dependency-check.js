#!/usr/bin/env node
/**
 * component-dependency-check.js
 * Validates component dependencies from config/component-registry.json
 * Enforces maxCycles: 0 policy (no circular dependencies allowed)
 */

import { promises as fs } from 'fs';
import path from 'path';
import { stableStringify } from './lib/json-stable.js';

class ComponentDependencyChecker {
  constructor() {
    this.components = new Map();
    this.dependencyGraph = new Map();
    this.issues = [];
  }

  async checkComponents() {
    console.log('🔍 Checking component dependencies...');
    
    try {
      await this.loadComponentRegistry();
      await this.buildDependencyGraph();
      await this.detectCircularDependencies();
      await this.validateDependencies();
      await this.generateOutput();
      
      return this.reportResults();
    } catch (error) {
      console.error('❌ Component dependency check failed:', error.message);
      process.exit(1);
    }
  }

  async loadComponentRegistry() {
    const registryPath = 'config/component-registry.json';
    
    try {
      const content = await fs.readFile(registryPath, 'utf8');
      const registry = JSON.parse(content);
      
      if (!registry.components || !Array.isArray(registry.components)) {
        throw new Error('Invalid component registry format');
      }
      
      for (const component of registry.components) {
        this.components.set(component.id, component);
      }
      
      console.log(`✅ Loaded ${this.components.size} components from registry`);
    } catch (error) {
      throw new Error(`Failed to load component registry: ${error.message}`);
    }
  }

  async buildDependencyGraph() {
    for (const [id, component] of this.components) {
      const dependencies = component.dependsOn || component.dependencies || [];
      this.dependencyGraph.set(id, new Set(dependencies));
      
      // Validate that all dependencies exist in registry
      for (const depId of dependencies) {
        if (!this.components.has(depId)) {
          this.addIssue('MISSING_DEPENDENCY', id, `Dependency "${depId}" not found in component registry`);
        }
      }
    }
  }

  async detectCircularDependencies() {
    console.log('🔄 Detecting circular dependencies (maxCycles: 0)...');
    
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];
    
    const detectCycle = (componentId, path = []) => {
      if (recursionStack.has(componentId)) {
        // Found a circular dependency
        const cycleStart = path.indexOf(componentId);
        const cycle = path.slice(cycleStart).concat([componentId]);
        cycles.push(cycle);
        this.addIssue('CIRCULAR_DEPENDENCY', componentId, 
          `Circular dependency detected: ${cycle.join(' → ')}`);
        return;
      }
      
      if (visited.has(componentId)) {
        return;
      }

      visited.add(componentId);
      recursionStack.add(componentId);
      path.push(componentId);
      
      const dependencies = this.dependencyGraph.get(componentId) || new Set();
      for (const depId of dependencies) {
        detectCycle(depId, [...path]);
      }

      recursionStack.delete(componentId);
      path.pop();
    };

    // Check each component for cycles
    for (const componentId of this.components.keys()) {
      if (!visited.has(componentId)) {
        detectCycle(componentId);
      }
    }
    
    if (cycles.length > 0) {
      console.error(`❌ Found ${cycles.length} circular dependencies - Policy violation (maxCycles: 0)`);
      cycles.forEach((cycle, index) => {
        console.error(`   Cycle ${index + 1}: ${cycle.join(' → ')}`);
      });
    } else {
      console.log('✅ No circular dependencies detected');
    }
    
    return cycles;
  }

  async validateDependencies() {
    // Additional validation rules can be added here
    console.log('🔍 Validating dependency constraints...');
    
    for (const [id, component] of this.components) {
      // Check for self-dependencies
      const dependencies = component.dependencies || [];
      if (dependencies.includes(id)) {
        this.addIssue('SELF_DEPENDENCY', id, 'Component cannot depend on itself');
      }
      
      // Validate health endpoints are defined
      if (!component.healthEndpoint) {
        this.addIssue('MISSING_HEALTH_ENDPOINT', id, 'Component missing health endpoint');
      }
    }
  }

  async generateOutput() {
    // Ensure build/deps directory exists
    await fs.mkdir('build/deps', { recursive: true });
    
    // Generate machine-readable graph.json
    const graphData = {
      metadata: {
        version: '1.0.0',
        generatedAt: new Date().toISOString(),
        source: 'config/component-registry.json',
        generator: 'component-dependency-check',
        totalComponents: this.components.size,
        totalDependencies: Array.from(this.dependencyGraph.values()).reduce((sum, deps) => sum + deps.size, 0),
        circularDependencies: this.issues.filter(i => i.type === 'CIRCULAR_DEPENDENCY').length,
        maxCycles: 0
      },
      nodes: Array.from(this.components.values()).map(component => ({
        id: component.id,
        name: component.name,
        type: component.type,
        category: component.category,
        dependencies: component.dependencies || [],
        dependents: this.calculateDependents(component.id)
      })),
      edges: this.generateEdges(),
      startupPhases: this.calculateStartupPhases(),
      analysis: {
        circularDependencies: this.issues.filter(i => i.type === 'CIRCULAR_DEPENDENCY').map(i => i.message),
        criticalPath: this.findCriticalPath(),
        isolatedComponents: this.findIsolatedComponents(),
        highlyDependent: this.findHighlyDependentComponents(),
        leafComponents: this.findLeafComponents()
      }
    };
    
    await fs.writeFile('build/deps/graph.json', stableStringify(graphData, null, 2));
    console.log('📄 Generated build/deps/graph.json');
  }

  calculateDependents(componentId) {
    const dependents = [];
    for (const [id, deps] of this.dependencyGraph) {
      if (deps.has(componentId)) {
        dependents.push(id);
      }
    }
    return dependents;
  }

  generateEdges() {
    const edges = [];
    for (const [from, dependencies] of this.dependencyGraph) {
      for (const to of dependencies) {
        edges.push({ from, to, type: 'dependency' });
      }
    }
    return edges;
  }

  calculateStartupPhases() {
    const phases = {};
    const processed = new Set();
    let phase = 0;
    
    while (processed.size < this.components.size) {
      const phaseComponents = [];
      
      for (const [id, dependencies] of this.dependencyGraph) {
        if (!processed.has(id)) {
          const allDepsProcessed = Array.from(dependencies).every(dep => processed.has(dep));
          if (allDepsProcessed) {
            phaseComponents.push(id);
          }
        }
      }
      
      if (phaseComponents.length === 0) {
        // Circular dependency or orphaned components
        for (const id of this.components.keys()) {
          if (!processed.has(id)) {
            phaseComponents.push(id);
          }
        }
      }
      
      phases[`phase-${phase}`] = phaseComponents;
      phaseComponents.forEach(id => processed.add(id));
      phase++;
    }
    
    return phases;
  }

  findCriticalPath() {
    // Simple critical path: longest dependency chain
    let longestPath = [];
    
    const dfs = (componentId, path = []) => {
      if (path.includes(componentId)) return; // Avoid cycles
      
      const newPath = [...path, componentId];
      const dependencies = this.dependencyGraph.get(componentId) || new Set();
      
      if (dependencies.size === 0) {
        if (newPath.length > longestPath.length) {
          longestPath = newPath;
        }
      } else {
        for (const depId of dependencies) {
          dfs(depId, newPath);
        }
      }
    };
    
    for (const componentId of this.components.keys()) {
      dfs(componentId);
    }
    
    return longestPath;
  }

  findIsolatedComponents() {
    return Array.from(this.components.keys()).filter(id => {
      const deps = this.dependencyGraph.get(id) || new Set();
      const dependents = this.calculateDependents(id);
      return deps.size === 0 && dependents.length === 0;
    });
  }

  findHighlyDependentComponents() {
    return Array.from(this.components.keys())
      .map(id => ({ id, dependents: this.calculateDependents(id).length }))
      .filter(item => item.dependents >= 3)
      .sort((a, b) => b.dependents - a.dependents)
      .map(item => item.id);
  }

  findLeafComponents() {
    return Array.from(this.components.keys()).filter(id => {
      const dependents = this.calculateDependents(id);
      return dependents.length === 0;
    });
  }

  addIssue(type, componentId, message) {
    this.issues.push({ type, componentId, message });
  }

  reportResults() {
    console.log('\n📊 Component Dependency Check Results:');
    console.log(`   Components: ${this.components.size}`);
    console.log(`   Issues: ${this.issues.length}`);
    
    if (this.issues.length > 0) {
      console.log('\n❌ Issues found:');
      this.issues.forEach(issue => {
        console.log(`   ${issue.type}: ${issue.componentId} - ${issue.message}`);
      });
    }
    
    const hasCircularDeps = this.issues.some(i => i.type === 'CIRCULAR_DEPENDENCY');
    if (hasCircularDeps) {
      console.error('\n❌ POLICY VIOLATION: Circular dependencies detected (maxCycles: 0)');
      process.exit(1);
    }
    
    if (this.issues.length === 0) {
      console.log('✅ All component dependency checks passed');
    }
    
    return this.issues.length === 0;
  }
}

async function main() {
  const checker = new ComponentDependencyChecker();
  const success = await checker.checkComponents();
  
  if (!success) {
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ComponentDependencyChecker };