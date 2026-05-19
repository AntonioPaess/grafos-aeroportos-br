"use client";

import { GlobalMetrics, RegionMetrics, EgoNetwork } from "../lib/types";
import { REGION_COLORS } from "../lib/data";
import { Graph } from "../lib/graph";
import { AIRPORTS } from "../lib/data";

interface MetricsCardsProps {
  graph: Graph;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-5`}>
      <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${color}`} />
      <div className="relative">
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="text-sm text-slate-400 mt-0.5">{label}</div>
        {sub && <div className="text-xs text-slate-600 mt-1">{sub}</div>}
      </div>
    </div>
  );
}

export default function MetricsCards({ graph }: MetricsCardsProps) {
  const ordem = graph.order();
  const tamanho = graph.size();
  const densidade = graph.density().toFixed(4);

  const regions: Record<string, Set<string>> = {};
  for (const ap of AIRPORTS) {
    if (!regions[ap.regiao]) regions[ap.regiao] = new Set();
    regions[ap.regiao].add(ap.iata);
  }

  const regionMetrics: RegionMetrics[] = Object.entries(regions).map(([regiao, nodes]) => {
    const sub = graph.subgraph(nodes);
    return {
      regiao,
      ordem: sub.order(),
      tamanho: sub.size(),
      densidade: parseFloat(sub.density().toFixed(4)),
    };
  });

  return (
    <div className="space-y-6">
      {/* Global stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Aeroportos" value={ordem} sub="Vértices do grafo" color="from-sky-600 to-blue-700" />
        <StatCard label="Rotas" value={tamanho} sub="Arestas do grafo" color="from-emerald-600 to-green-700" />
        <StatCard label="Densidade" value={densidade} sub="Saturação da rede" color="from-violet-600 to-purple-700" />
      </div>

      {/* Region breakdown */}
      <div>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Por Região</h3>
        <div className="grid grid-cols-1 gap-2">
          {regionMetrics.map((rm) => (
            <div key={rm.regiao} className="flex items-center gap-3 bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: REGION_COLORS[rm.regiao] ?? "#94a3b8", boxShadow: `0 0 8px ${REGION_COLORS[rm.regiao] ?? "#94a3b8"}66` }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-slate-200">{rm.regiao}</div>
              </div>
              <div className="flex gap-3 text-right">
                <div>
                  <div className="text-sm font-bold text-white">{rm.ordem}</div>
                  <div className="text-xs text-slate-600">nós</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{rm.tamanho}</div>
                  <div className="text-xs text-slate-600">arestas</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{rm.densidade.toFixed(2)}</div>
                  <div className="text-xs text-slate-600">dens.</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
