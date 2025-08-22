import fs from "node:fs";
import path from "node:path";

type Edge = { from: string; to: string };
type Graph = { nodes: string[]; edges: Edge[] };
type Component = { id: string; name?: string; dependsOn?: string[] };
type ComponentRegistry = { version: number; components: Component[] };

const registryPath = process.env.DEP_REGISTRY || "config/component-registry.json";
const outDir = "build/deps";
fs.mkdirSync(outDir, { recursive: true });

const registryData = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as ComponentRegistry;
const components = registryData.components || [];
const nodes = components.map(c => c.id);
const edges: Edge[] = [];

for (const component of components) {
  for (const dep of component.dependsOn ?? []) {
    edges.push({ from: component.id, to: dep });
  }
}

const graph: Graph = { nodes, edges };
fs.writeFileSync(path.join(outDir, "graph.json"), JSON.stringify(graph, null, 2));

// Generate enhanced Mermaid diagram with styling and better labels
const mermaidLines: string[] = [];
mermaidLines.push("graph LR");

// Add component definitions with names
for (const component of components) {
  const displayName = component.name || component.id;
  mermaidLines.push(`  ${component.id}["${displayName}"]`);
}

// Add dependency relationships
for (const edge of edges) {
  mermaidLines.push(`  ${edge.from} --> ${edge.to}`);
}

// Add basic styling
mermaidLines.push("");
mermaidLines.push("  %% Styling");
mermaidLines.push("  classDef service fill:#e1f5fe,stroke:#0277bd,stroke-width:2px");
mermaidLines.push("  classDef database fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px");
mermaidLines.push("  classDef gateway fill:#e8f5e8,stroke:#2e7d32,stroke-width:2px");

// Apply styles based on component types (basic heuristics)
for (const component of components) {
  if (component.id.includes('db') || component.id.includes('database')) {
    mermaidLines.push(`  ${component.id}:::database`);
  } else if (component.id.includes('gateway') || component.id.includes('api')) {
    mermaidLines.push(`  ${component.id}:::gateway`);
  } else {
    mermaidLines.push(`  ${component.id}:::service`);
  }
}

const mermaidContent = mermaidLines.join("\n");
fs.writeFileSync("docs/architecture/dependency-graph.mmd", mermaidContent);

console.log("Generated build/deps/graph.json and docs/architecture/dependency-graph.mmd");