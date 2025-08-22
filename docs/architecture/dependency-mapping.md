# Dependency Mapping

This document describes the component dependency mapping system used to derive startup order and operational guidance.

## Artifacts

- **Machine-readable:** build/deps/graph.json (CI artifact)
- **Dependency matrix:** docs/architecture/dependencies.json (includes criticality)
- **Diagram source:** docs/architecture/dependency-graph.mmd

## How to Update

1. Edit config/component-registry.json
2. Run `npm run deps:all` (or `npm run deps:graph && npm run deps:matrix && npm run deps:svg`)
3. Commit changes to .mmd, dependencies.json, and .svg files

**Note**: Both Mermaid (.mmd) and SVG (.svg) files are committed to the repository for immediate cross-team consumption. The build/deps/graph.json is a CI artifact and should not be committed.

## Policy

- No new circular dependencies (maxCycles: 0)
- Changes to registry require review from Architecture WG

## Component Registry Format

The component registry (`config/component-registry.json`) uses a simple format:

```json
{
  "version": "1.0.0",
  "description": "Component registry description",
  "components": [
    {
      "id": "service-name",
      "name": "Human Readable Name",
      "type": "service|database|cache",
      "category": "core|infrastructure|utility", 
      "dependsOn": ["dependency1", "dependency2"],
      "healthEndpoint": "/service/health",
      "description": "Service description"
    }
  ]
}
```

Where:

- `id`: Unique identifier for the component
- `dependsOn`: Array of component IDs this service depends on (can be empty)
- `dependencies`: Legacy field name (also supported for backward compatibility)

**Field Compatibility:** The dependency checker supports both `dependsOn` (preferred) and `dependencies` (legacy) field names for maximum compatibility.

## Generated Artifacts

### build/deps/graph.json

Machine-readable dependency graph containing:

- `nodes`: Array of all component names
- `edges`: Array of dependency relationships with `from` and `to` properties

### docs/architecture/dependencies.json

Machine-readable dependency matrix for visualization tools containing:

- `nodes`: Array of components with ID, name, type, category, and criticality
- `edges`: Array of dependency relationships with criticality information
- `metadata`: Statistics including total components, dependencies, and circular dependency count
- `analysis`: Critical path analysis, isolated components, and highly dependent components

### docs/architecture/dependency-graph.mmd

Mermaid diagram source showing the dependency relationships with enhanced visual styling:

- Node definitions with human-readable names
- Dependency relationships with directional arrows
- Color-coded styling by component type (gateway, service, database)
- Automatically generated and should not be manually edited

### docs/architecture/dependency-graph.svg

Visual SVG export of the dependency graph for immediate consumption:

- Graphical representation of all components and dependencies
- Color-coded nodes by component type and criticality
- Legend showing component types
- No orphaned nodes or edges
- Automatically generated from dependencies.json

## Validation

The dependency mapping system enforces:

- All dependencies must exist in the registry
- No circular dependencies allowed (maxCycles: 0)
- Topological sorting must be possible

## Integration

The dependency mapping feeds into:

- **Startup order documentation** (docs/operations/startup-order.md)
- **Health check systems** (tools/integrated-health-check.js)
- **Component validation** (tools/component-dependency-check.js)
