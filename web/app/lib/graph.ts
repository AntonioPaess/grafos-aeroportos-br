import { Adjacencia } from "./types";

export class Graph {
  private adj: Map<string, [string, number][]> = new Map();

  addNode(node: string) {
    if (!this.adj.has(node)) this.adj.set(node, []);
  }

  addEdge(u: string, v: string, w = 1.0) {
    this.addNode(u);
    this.addNode(v);
    this.adj.get(u)!.push([v, w]);
    this.adj.get(v)!.push([u, w]);
  }

  nodes(): string[] {
    return [...this.adj.keys()];
  }

  neighbors(node: string): [string, number][] {
    return this.adj.get(node) ?? [];
  }

  degree(node: string): number {
    return this.neighbors(node).length;
  }

  edges(): [string, string, number][] {
    const seen = new Set<string>();
    const result: [string, string, number][] = [];
    for (const [u, nbrs] of this.adj) {
      for (const [v, w] of nbrs) {
        const key = [u, v].sort().join("-");
        if (!seen.has(key)) {
          seen.add(key);
          result.push([u, v, w]);
        }
      }
    }
    return result;
  }

  order(): number {
    return this.adj.size;
  }

  size(): number {
    return this.edges().length;
  }

  density(): number {
    const n = this.order();
    const m = this.size();
    if (n < 2) return 0;
    return (2 * m) / (n * (n - 1));
  }

  subgraph(nodes: Set<string>): Graph {
    const sub = new Graph();
    for (const n of nodes) sub.addNode(n);
    for (const [u, v, w] of this.edges()) {
      if (nodes.has(u) && nodes.has(v)) sub.addEdge(u, v, w);
    }
    return sub;
  }
}

export function buildGraph(adjacencias: Adjacencia[]): Graph {
  const g = new Graph();
  for (const { origem, destino, peso } of adjacencias) {
    g.addEdge(origem, destino, peso);
  }
  return g;
}
