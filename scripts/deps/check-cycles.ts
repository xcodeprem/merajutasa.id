import fs from "node:fs";

type Edge = { from: string; to: string };
type Graph = { nodes: string[]; edges: Edge[] };

const graph = JSON.parse(fs.readFileSync("build/deps/graph.json", "utf-8")) as Graph;

const adj = new Map<string, string[]>();
graph.nodes.forEach(n => adj.set(n, []));
graph.edges.forEach(e => adj.get(e.from)!.push(e.to));

const visited = new Set<string>();
const stack = new Set<string>();
let hasCycle = false;

function dfs(n: string) {
  if (stack.has(n)) { hasCycle = true; return; }
  if (visited.has(n)) return;
  visited.add(n);
  stack.add(n);
  for (const m of adj.get(n) ?? []) dfs(m);
  stack.delete(n);
}

graph.nodes.forEach(dfs);

if (hasCycle) {
  console.error("Dependency cycle detected");
  process.exit(1);
} else {
  console.log("No cycles detected.");
}