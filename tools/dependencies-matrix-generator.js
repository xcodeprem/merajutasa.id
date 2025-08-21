#!/usr/bin/env node
/**
 * dependencies-matrix-generator.js
 * Generates machine-readable dependency matrix (docs/architecture/dependencies.json)
 * Combines data from component registry and component inventory for criticality
 */

import { promises as fs } from 'fs';
import path from 'path';
import { stableStringify } from './lib/json-stable.js';

class DependencyMatrixGenerator {
  constructor() {
    this.components = new Map();
    this.inventory = new Map();
    this.dependencyGraph = new Map();
    this.issues = [];
  }

  async generate() {
    console.log('🔧 Generating machine-readable dependency matrix...');
    
    try {
      await this.loadComponentRegistry();
      await this.loadComponentInventory();
      await this.buildDependencyGraph();
      await this.detectCircularDependencies();
      await this.generateDependenciesJson();
      
      console.log('✅ Dependencies matrix generated successfully');
      return true;
    } catch (error) {
      console.error('❌ Dependency matrix generation failed:', error.message);
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

  async loadComponentInventory() {
    const inventoryPath = 'docs/architecture/component-inventory.json';
    
    try {
      const content = await fs.readFile(inventoryPath, 'utf8');
      const inventory = JSON.parse(content);
      
      if (!inventory.components || !Array.isArray(inventory.components)) {
        throw new Error('Invalid component inventory format');
      }
      
      for (const component of inventory.components) {
        this.inventory.set(component.id, component);
      }
      
      console.log(`✅ Loaded ${this.inventory.size} components from inventory`);
    } catch (error) {
      console.warn(`⚠️  Could not load component inventory: ${error.message}`);
      // Continue without inventory data - use default criticality
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
    console.log('🔄 Detecting circular dependencies...');
    
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
    
    for (const componentId of this.components.keys()) {
      if (!visited.has(componentId)) {
        detectCycle(componentId);
      }
    }
    
    if (cycles.length === 0) {
      console.log('✅ No circular dependencies detected');
    } else {
      console.log(`⚠️  Found ${cycles.length} circular dependencies`);
    }
  }

  getCriticality(componentId) {
    const inventoryComponent = this.inventory.get(componentId);
    if (inventoryComponent && inventoryComponent.failureImpact) {
      return inventoryComponent.failureImpact;
    }
    
    // Fallback: determine from component registry data
    const component = this.components.get(componentId);
    if (!component) return 'medium';
    
    // Simple heuristics
    if (component.name && component.name.toLowerCase().includes('gateway')) return 'critical';
    if (component.name && component.name.toLowerCase().includes('auth')) return 'critical';
    if (component.name && component.name.toLowerCase().includes('database')) return 'critical';
    
    return 'medium';
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
        const fromCriticality = this.getCriticality(from);
        const toCriticality = this.getCriticality(to);
        
        // Edge criticality is the highest of source and target
        const edgeCriticality = this.getHighestCriticality(fromCriticality, toCriticality);
        
        edges.push({ 
          from, 
          to, 
          type: 'dependency',
          criticality: edgeCriticality
        });
      }
    }
    return edges;
  }

  getHighestCriticality(c1, c2) {
    const levels = { critical: 4, high: 3, medium: 2, low: 1 };
    const level1 = levels[c1] || 2;
    const level2 = levels[c2] || 2;
    const maxLevel = Math.max(level1, level2);
    
    for (const [crit, level] of Object.entries(levels)) {
      if (level === maxLevel) return crit;
    }
    return 'medium';
  }

  findCriticalPath() {
    // Find the longest dependency chain
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
    const isolated = [];
    for (const componentId of this.components.keys()) {
      const dependencies = this.dependencyGraph.get(componentId) || new Set();
      const dependents = this.calculateDependents(componentId);
      
      if (dependencies.size === 0 && dependents.length === 0) {
        isolated.push(componentId);
      }
    }
    return isolated;
  }

  findHighlyDependentComponents() {
    const threshold = 3; // Components with more than 3 dependents
    const highlyDependent = [];
    
    for (const componentId of this.components.keys()) {
      const dependents = this.calculateDependents(componentId);
      if (dependents.length > threshold) {
        highlyDependent.push(componentId);
      }
    }
    
    return highlyDependent;
  }

  async generateDependenciesJson() {
    // Ensure docs/architecture directory exists
    await fs.mkdir('docs/architecture', { recursive: true });
    
    const totalDependencies = Array.from(this.dependencyGraph.values())
      .reduce((sum, deps) => sum + deps.size, 0);
    
    const dependenciesData = {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      metadata: {
        total_components: this.components.size,
        total_dependencies: totalDependencies,
        circular_dependencies: this.issues.filter(i => i.type === 'CIRCULAR_DEPENDENCY').length,
        source: 'config/component-registry.json',
        generator: 'dependencies-matrix-generator'
      },
      nodes: Array.from(this.components.values()).map(component => ({
        id: component.id,
        name: component.name,
        type: component.type || 'service',
        category: component.category || 'unknown',
        criticality: this.getCriticality(component.id),
        dependencies: component.dependsOn || component.dependencies || [],
        dependents: this.calculateDependents(component.id)
      })),
      edges: this.generateEdges(),
      analysis: {
        circular_dependencies: this.issues.filter(i => i.type === 'CIRCULAR_DEPENDENCY').map(i => i.message),
        critical_path: this.findCriticalPath(),
        isolated_components: this.findIsolatedComponents(),
        highly_dependent: this.findHighlyDependentComponents()
      }
    };
    
    await fs.writeFile('docs/architecture/dependencies.json', stableStringify(dependenciesData, null, 2));
    console.log('📄 Generated docs/architecture/dependencies.json');
    
    // Validate against schema if possible
    await this.validateSchema('docs/architecture/dependencies.json');
  }

  async validateSchema(filePath) {
    try {
      const schemaPath = 'schemas/architecture/dependencies-v1.schema.json';
      const schemaExists = await fs.access(schemaPath).then(() => true).catch(() => false);
      
      if (schemaExists) {
        // Import schema validation
        const { default: Ajv } = await import('ajv');
        const addFormats = await import('ajv-formats');
        
        const ajv = new Ajv({ allErrors: true, strict: false });
        addFormats.default(ajv);
        
        const schemaContent = await fs.readFile(schemaPath, 'utf8');
        const schema = JSON.parse(schemaContent);
        const validate = ajv.compile(schema);
        
        const dataContent = await fs.readFile(filePath, 'utf8');
        const data = JSON.parse(dataContent);
        
        const valid = validate(data);
        if (valid) {
          console.log('✅ Schema validation passed');
        } else {
          console.warn('⚠️  Schema validation failed:');
          validate.errors?.forEach(error => {
            console.warn(`  - ${error.instancePath}: ${error.message}`);
          });
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not validate schema: ${error.message}`);
    }
  }

  addIssue(type, componentId, message) {
    this.issues.push({ type, componentId, message });
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const generator = new DependencyMatrixGenerator();
  await generator.generate();
}

export { DependencyMatrixGenerator };