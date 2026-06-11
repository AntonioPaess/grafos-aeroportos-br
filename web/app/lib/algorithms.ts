import { Graph } from "./graph";
import { BFSResult, DFSResult } from "./types";

export function bfs(graph: Graph, source: string): BFSResult {
  const result: BFSResult = { [source]: { level: 0, parent: null } };
  const queue: string[] = [source];
  while (queue.length > 0) {
    const u = queue.shift()!;
    for (const [v] of graph.neighbors(u)) {
      if (!(v in result)) {
        result[v] = { level: result[u].level + 1, parent: u };
        queue.push(v);
      }
    }
  }
  return result;
}

export function dfs(graph: Graph, source: string): DFSResult {
  const nodes: DFSResult["nodes"] = {};
  const edgeTypes: [string, string, string][] = [];
  let time = 0;

  function visit(start: string) {
    time++;
    nodes[start] = { discovery: time, finish: 0, parent: null };
    const stack: [string, number][] = [[start, 0]];

    while (stack.length > 0) {
      const [u, idx] = stack[stack.length - 1];
      const nbrs = graph.neighbors(u);
      if (idx < nbrs.length) {
        stack[stack.length - 1][1]++;
        const [v] = nbrs[idx];
        if (!(v in nodes)) {
          edgeTypes.push([u, v, "tree"]);
          time++;
          nodes[v] = { discovery: time, finish: 0, parent: u };
          stack.push([v, 0]);
        } else if (nodes[v].finish === 0) {
          if (v !== nodes[u].parent) edgeTypes.push([u, v, "back"]);
        } else if (nodes[v].discovery > nodes[u].discovery) {
          edgeTypes.push([u, v, "forward"]);
        } else {
          edgeTypes.push([u, v, "cross"]);
        }
      } else {
        time++;
        nodes[u].finish = time;
        stack.pop();
      }
    }
  }

  visit(source);
  for (const n of graph.nodes()) {
    if (!(n in nodes)) visit(n);
  }

  return {
    nodes,
    edgeTypes,
    hasCycle: edgeTypes.some(([, , t]) => t === "back"),
  };
}

export function dijkstra(
  graph: Graph,
  source: string
): { dist: Record<string, number>; prev: Record<string, string | null> } {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const visited = new Set<string>();

  for (const n of graph.nodes()) {
    dist[n] = Infinity;
    prev[n] = null;
  }
  dist[source] = 0;

  // Simple priority queue via sorted array (graph is small)
  const heap: [number, string][] = [[0, source]];

  while (heap.length > 0) {
    heap.sort(([a], [b]) => a - b);
    const [d, u] = heap.shift()!;
    if (visited.has(u)) continue;
    visited.add(u);
    if (d > dist[u]) continue;

    for (const [v, w] of graph.neighbors(u)) {
      const nd = d + w;
      if (nd < dist[v]) {
        dist[v] = nd;
        prev[v] = u;
        heap.push([nd, v]);
      }
    }
  }

  return { dist, prev };
}

export function bellmanFord(
  graph: Graph,
  source: string
): { dist: Record<string, number>; prev: Record<string, string | null>; hasNegativeCycle: boolean } {
  const nodes = graph.nodes();
  const dist: Record<string, number> = Object.fromEntries(nodes.map((n) => [n, Infinity]));
  const prev: Record<string, string | null> = Object.fromEntries(nodes.map((n) => [n, null]));
  dist[source] = 0;

  const allEdges = graph.edges();

  for (let i = 0; i < nodes.length - 1; i++) {
    let updated = false;
    for (const [u, v, w] of allEdges) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
        updated = true;
      }
      if (dist[v] + w < dist[u]) {
        dist[u] = dist[v] + w;
        prev[u] = v;
        updated = true;
      }
    }
    if (!updated) break;
  }

  let hasNegativeCycle = false;
  for (const [u, v, w] of allEdges) {
    if (dist[u] + w < dist[v]) { hasNegativeCycle = true; break; }
  }

  return { dist, prev, hasNegativeCycle };
}

export function reconstructPath(
  prev: Record<string, string | null>,
  source: string,
  target: string
): string[] | null {
  if (!(target in prev) || (prev[target] === null && target !== source)) return null;
  const path: string[] = [];
  let current: string | null = target;
  while (current !== null) {
    path.push(current);
    current = prev[current];
  }
  path.reverse();
  if (path[0] !== source) return null;
  return path;
}
