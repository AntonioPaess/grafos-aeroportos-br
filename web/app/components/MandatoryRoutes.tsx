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
    if (selected === i) {
      setSelected(null);
      onRouteSelect(null, new Set());
      return;
    }
    setSelected(i);
    const r = results[i];
    onRouteSelect(r.path, new Set(r.path ?? []));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-400 leading-relaxed">
        Estas são as 7 rotas definidas como obrigatórias no projeto. O caminho mínimo entre cada par foi calculado com{" "}
        <span className="text-emerald-400 font-medium">Dijkstra</span>. Clique em uma rota para destacá-la no mapa.
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
              className={`w-full text-left rounded-xl border p-4 transition-all ${
                isSelected
                  ? "border-amber-500/60 bg-amber-500/10"
                  : "border-slate-700/50 bg-slate-800/40 hover:border-slate-600 hover:bg-slate-800/70"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                {/* Route */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: REGION_COLORS[fromAp?.regiao ?? ""] ?? "#94a3b8" }}
                    />
                    <span className="font-mono font-bold text-sm text-slate-200">{r.origem}</span>
                  </div>
                  <span className="text-amber-500 text-xs">✈</span>
                  <div className="flex items-center gap-1">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: REGION_COLORS[toAp?.regiao ?? ""] ?? "#94a3b8" }}
                    />
                    <span className="font-mono font-bold text-sm text-slate-200">{r.destino}</span>
                  </div>
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {fromAp?.cidade} → {toAp?.cidade}
                  </span>
                </div>

                {/* Cost badge */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                    custo {r.cost === Infinity ? "∞" : r.cost.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded-full">
                    {r.path ? r.path.length - 1 : "?"} escala{r.path && r.path.length - 1 !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Expanded path */}
              {isSelected && r.path && (
                <div className="mt-3 pt-3 border-t border-amber-500/20">
                  <div className="text-xs text-slate-500 mb-2">Caminho mínimo (Dijkstra)</div>
                  <div className="flex flex-wrap gap-1 items-center">
                    {r.path.map((node, j) => (
                      <span key={j} className="flex items-center gap-1">
                        <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded text-xs font-mono font-bold">
                          {node}
                        </span>
                        {j < r.path!.length - 1 && (
                          <span className="text-amber-500 text-xs">→</span>
                        )}
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
