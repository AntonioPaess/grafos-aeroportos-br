"use client";

import { useState } from "react";
import { Algorithm, BFSResult, DFSResult } from "../lib/types";
import { Graph } from "../lib/graph";
import { bfs, dfs, dijkstra, bellmanFord, reconstructPath } from "../lib/algorithms";
import { AIRPORTS, AIRPORT_MAP } from "../lib/data";

interface AlgorithmPanelProps {
  graph: Graph;
  onPathChange: (path: string[] | null, nodes: Set<string>) => void;
  source: string;
  setSource: (s: string) => void;
  target: string;
  setTarget: (s: string) => void;
}

interface AlgoResult {
  type: "path" | "bfs" | "dfs";
  algorithm: string;
  elapsed: number;
  path?: string[];
  cost?: number;
  hops?: number;
  bfsLevels?: number;
  dfsData?: DFSResult;
  bfsData?: BFSResult;
  hasCycle?: boolean;
  hasNegativeCycle?: boolean;
}

const ALGO_DESCRIPTIONS: Record<Algorithm, { title: string; description: string; color: string }> = {
  BFS: {
    title: "Busca em Largura",
    description: "Explora vértices camada por camada. Encontra o caminho com menos saltos.",
    color: "from-sky-600 to-blue-700",
  },
  DFS: {
    title: "Busca em Profundidade",
    description: "Explora o máximo possível antes de retroceder. Detecta ciclos no grafo.",
    color: "from-violet-600 to-purple-700",
  },
  Dijkstra: {
    title: "Algoritmo de Dijkstra",
    description: "Caminho de menor custo com pesos não-negativos. Usa fila de prioridade.",
    color: "from-emerald-600 to-green-700",
  },
  "Bellman-Ford": {
    title: "Bellman-Ford",
    description: "Caminho mínimo com suporte a pesos negativos. Detecta ciclos negativos.",
    color: "from-orange-600 to-amber-700",
  },
};

const ALGOS: Algorithm[] = ["BFS", "DFS", "Dijkstra", "Bellman-Ford"];

export default function AlgorithmPanel({
  graph,
  onPathChange,
  source,
  setSource,
  target,
  setTarget,
}: AlgorithmPanelProps) {
  const [algo, setAlgo] = useState<Algorithm>("Dijkstra");
  const [result, setResult] = useState<AlgoResult | null>(null);
  const [loading, setLoading] = useState(false);

  const nodeList = graph.nodes().sort();
  const needsTarget = algo === "Dijkstra" || algo === "Bellman-Ford";

  function run() {
    setLoading(true);
    const t0 = performance.now();

    try {
      if (algo === "BFS") {
        const data = bfs(graph, source);
        const elapsed = performance.now() - t0;
        const levels = Math.max(...Object.values(data).map((v) => v.level));
        const highlighted = new Set(
          Object.entries(data)
            .filter(([, v]) => v.level <= 2)
            .map(([k]) => k)
        );
        setResult({ type: "bfs", algorithm: algo, elapsed, bfsLevels: levels, bfsData: data });
        onPathChange(null, highlighted);
      } else if (algo === "DFS") {
        const data = dfs(graph, source);
        const elapsed = performance.now() - t0;
        setResult({ type: "dfs", algorithm: algo, elapsed, hasCycle: data.hasCycle, dfsData: data });
        onPathChange(null, new Set([source]));
      } else if (algo === "Dijkstra") {
        const { dist, prev } = dijkstra(graph, source);
        const elapsed = performance.now() - t0;
        const path = reconstructPath(prev, source, target);
        const cost = dist[target] ?? Infinity;
        setResult({ type: "path", algorithm: algo, elapsed, path: path ?? [], cost, hops: path ? path.length - 1 : 0 });
        onPathChange(path, new Set(path ?? []));
      } else {
        const { dist, prev, hasNegativeCycle } = bellmanFord(graph, source);
        const elapsed = performance.now() - t0;
        const path = reconstructPath(prev, source, target);
        const cost = dist[target] ?? Infinity;
        setResult({ type: "path", algorithm: algo, elapsed, path: path ?? [], cost, hops: path ? path.length - 1 : 0, hasNegativeCycle });
        onPathChange(path, new Set(path ?? []));
      }
    } finally {
      setLoading(false);
    }
  }

  const info = ALGO_DESCRIPTIONS[algo];

  return (
    <div className="flex flex-col gap-4">
      {/* Algorithm selector */}
      <div className="grid grid-cols-2 gap-2">
        {ALGOS.map((a) => (
          <button
            key={a}
            onClick={() => { setAlgo(a); setResult(null); onPathChange(null, new Set()); }}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all border ${
              algo === a
                ? `bg-gradient-to-r ${ALGO_DESCRIPTIONS[a].color} text-white border-transparent shadow-lg`
                : "bg-slate-800/50 text-slate-400 border-slate-700/50 hover:border-slate-500 hover:text-slate-200"
            }`}
          >
            {a}
          </button>
        ))}
      </div>

      {/* Algorithm description */}
      <div className="rounded-lg p-3" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
        <div className="text-sm font-semibold mb-1" style={{ color: "var(--fg)" }}>{info.title}</div>
        <div className="text-sm" style={{ color: "var(--fg-muted)" }}>{info.description}</div>
      </div>

      {/* Source */}
      <div>
        <label className="block text-sm mb-1.5 font-medium" style={{ color: "var(--fg-muted)" }}>Origem</label>
        <select
          value={source}
          onChange={(e) => { setSource(e.target.value); setResult(null); onPathChange(null, new Set()); }}
          className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
          style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--fg)" }}
        >
          {nodeList.map((n) => {
            const ap = AIRPORT_MAP.get(n);
            return (
              <option key={n} value={n}>
                {n}{ap ? ` — ${ap.cidade}` : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* Target (only for Dijkstra/Bellman-Ford) */}
      {needsTarget && (
        <div>
          <label className="block text-sm mb-1.5 font-medium" style={{ color: "var(--fg-muted)" }}>Destino</label>
          <select
            value={target}
            onChange={(e) => { setTarget(e.target.value); setResult(null); onPathChange(null, new Set()); }}
            className="w-full rounded-lg px-3 py-2 text-sm focus:outline-none"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)", color: "var(--fg)" }}
          >
            {nodeList.map((n) => {
              const ap = AIRPORT_MAP.get(n);
              return (
                <option key={n} value={n}>
                  {n}{ap ? ` — ${ap.cidade}` : ""}
                </option>
              );
            })}
          </select>
        </div>
      )}

      <button
        onClick={run}
        disabled={loading || (needsTarget && source === target)}
        className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all shadow-lg bg-gradient-to-r ${info.color} text-white hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        {loading ? "Executando..." : `Executar ${algo}`}
      </button>

      {/* Results */}
      {result && (
        <div className="rounded-xl p-4 space-y-3" style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold" style={{ color: "var(--fg)" }}>{result.algorithm}</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-card)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
              {result.elapsed.toFixed(2)}ms
            </span>
          </div>

          {result.type === "path" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {result.cost === Infinity ? "∞" : result.cost?.toFixed(1)}
                  </div>
                  <div className="text-xs text-slate-500">Custo total</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-sky-400">{result.hops}</div>
                  <div className="text-xs text-slate-500">Escalas</div>
                </div>
              </div>
              {result.path && result.path.length > 0 ? (
                <div className="bg-slate-900/40 rounded-lg p-3">
                  <div className="text-xs text-slate-500 mb-1.5">Rota completa</div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {result.path.map((node, i) => (
                      <span key={i} className="flex items-center gap-1">
                        <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {node}
                        </span>
                        {i < result.path!.length - 1 && (
                          <span className="text-amber-500 text-xs">→</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-red-400 bg-red-900/20 rounded-lg p-2">
                  Nenhum caminho encontrado
                </div>
              )}
              {result.hasNegativeCycle && (
                <div className="text-xs text-orange-400 bg-orange-900/20 rounded-lg p-2">
                  ⚠ Ciclo negativo detectado
                </div>
              )}
            </>
          )}

          {result.type === "bfs" && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-sky-400">{result.bfsLevels}</div>
                  <div className="text-xs text-slate-500">Níveis</div>
                </div>
                <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                  <div className="text-lg font-bold text-violet-400">
                    {Object.keys(result.bfsData ?? {}).length}
                  </div>
                  <div className="text-xs text-slate-500">Nós visitados</div>
                </div>
              </div>
              <div className="text-xs text-slate-400 bg-slate-900/40 rounded-lg p-2">
                Destaques no mapa: nós até nível 2 a partir de{" "}
                <span className="text-sky-400 font-mono">{source}</span>
              </div>
            </>
          )}

          {result.type === "dfs" && (
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                <div className={`text-lg font-bold ${result.hasCycle ? "text-red-400" : "text-green-400"}`}>
                  {result.hasCycle ? "Sim" : "Não"}
                </div>
                <div className="text-xs text-slate-500">Ciclo detectado</div>
              </div>
              <div className="bg-slate-900/60 rounded-lg p-2.5 text-center">
                <div className="text-lg font-bold text-violet-400">
                  {Object.keys(result.dfsData?.nodes ?? {}).length}
                </div>
                <div className="text-xs text-slate-500">Nós visitados</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
