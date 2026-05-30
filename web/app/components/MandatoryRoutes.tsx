"use client";

import { useState } from "react";
import { Graph } from "../lib/graph";
import { dijkstra, reconstructPath } from "../lib/algorithms";
import { ROTAS_OBRIGATORIAS, AIRPORT_MAP, REGION_COLORS } from "../lib/data";

interface MandatoryRoutesProps {
  graph: Graph;
  onRouteSelect: (path: string[] | null, nodes: Set<string>) => void;
}

interface RouteResult {
  origem: string;
  destino: string;
  path: string[] | null;
  cost: number;
}

export default function MandatoryRoutes({ graph, onRouteSelect }: MandatoryRoutesProps) {
  const [selected, setSelected] = useState<number | null>(null);

  const results: RouteResult[] = ROTAS_OBRIGATORIAS.map(({ origem, destino }) => {
    const { dist, prev } = dijkstra(graph, origem);
    const path = reconstructPath(prev, origem, destino);
    return { origem, destino, path, cost: dist[destino] ?? Infinity };
  });

  function handleSelect(i: number) {
    if (selected === i) { setSelected(null); onRouteSelect(null, new Set()); return; }
    setSelected(i);
    const r = results[i];
    onRouteSelect(r.path, new Set(r.path ?? []));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>
        7 pares obrigatórios do projeto. Caminho mínimo calculado com{" "}
        <span className="font-medium" style={{ color: "#34d399" }}>Dijkstra</span>. Clique para destacar no mapa.
      </p>

      <div className="grid grid-cols-1 gap-2">
        {results.map((r, i) => {
          const fromAp = AIRPORT_MAP.get(r.origem);
          const toAp = AIRPORT_MAP.get(r.destino);
          const isSelected = selected === i;

          return (
            <button
              key={i}
              onClick={() => handleSelect(i)}
              className="w-full text-left rounded-xl p-4 transition-all"
              style={{
                background: isSelected ? "rgba(245,158,11,0.08)" : "var(--bg-muted)",
                border: `1px solid ${isSelected ? "rgba(245,158,11,0.5)" : "var(--border)"}`,
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: REGION_COLORS[fromAp?.regiao ?? ""] ?? "#94a3b8" }} />
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>{r.origem}</span>
                  </div>
                  <span style={{ color: "#f59e0b" }}>✈</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: REGION_COLORS[toAp?.regiao ?? ""] ?? "#94a3b8" }} />
                    <span className="font-mono font-bold text-sm" style={{ color: "var(--fg)" }}>{r.destino}</span>
                  </div>
                  <span className="text-sm hidden sm:inline" style={{ color: "var(--fg-muted)" }}>
                    {fromAp?.cidade} → {toAp?.cidade}
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-card)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
                    custo {r.cost === Infinity ? "∞" : r.cost.toFixed(1)}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "var(--bg-card)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
                    {r.path ? r.path.length - 1 : "?"} escalas
                  </span>
                </div>
              </div>

              {isSelected && r.path && (
                <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(245,158,11,0.2)" }}>
                  <div className="text-xs mb-2" style={{ color: "var(--fg-dim)" }}>Caminho mínimo (Dijkstra)</div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {r.path.map((node, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded text-xs font-mono font-bold"
                          style={{ background: "var(--bg-card)", color: "var(--fg)", border: "1px solid var(--border)" }}>
                          {node}
                        </span>
                        {j < r.path!.length - 1 && <span className="text-xs" style={{ color: "#f59e0b" }}>→</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
