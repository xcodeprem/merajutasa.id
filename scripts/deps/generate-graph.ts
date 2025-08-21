import fs from "node:fs";
import path from "node:path";

type Edge = { from: string; to: string };
type Graph = { nodes: string[]; edges: Edge[] };

const registryPath = process.env.DEP_REGISTRY || "config/component-registry.json";
const outDir = "build/deps";
fs.mkdirSync(outDir, { recursive: true });

const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Record<string, { dependsOn?: string[] }>;
const nodes = Object.keys(registry);
const edges: Edge[] = [];

for (const [svc, meta] of Object.entries(registry)) {
  for (const dep of meta.dependsOn ?? []) edges.push({ from: svc, to: dep });
}

const graph: Graph = { nodes, edges };
fs.writeFileSync(path.join(outDir, "graph.json"), JSON.stringify(graph, null, 2));

const mermaidLines = new Set<string>();
mermaidLines.add("graph LR");
nodes.forEach(n => mermaidLines.add(`  ${n}`));
edges.forEach(e => mermaidLines.add(`  ${e.from} --> ${e.to}`));
fs.writeFileSync("docs/architecture/dependency-graph.mmd", [...mermaidLines].join("\n"));

console.log("Generated build/deps/graph.json and docs/architecture/dependency-graph.mmd");