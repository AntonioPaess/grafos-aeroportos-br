"use client";

import { RegionMetrics } from "../lib/types";
import { REGION_COLORS } from "../lib/data";
import { Graph } from "../lib/graph";
import { AIRPORTS } from "../lib/data";

interface MetricsCardsProps {
  graph: Graph;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="absolute inset-0 opacity-[0.08]" style={{ background: `linear-gradient(135deg,${color},transparent)` }} />
      <div className="relative">
        <div className="text-3xl font-bold" style={{ color: "var(--fg)" }}>{value}</div>
        <div className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>{label}</div>
        {sub && <div className="text-xs mt-0.5" style={{ color: "var(--fg-dim)" }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function MetricsCards({ graph }: MetricsCardsProps) {
  const ordem = graph.order();
  const tamanho = graph.size();
  const densidade = graph.density().toFixed(4);

  const degrees = AIRPORTS.map((ap) => graph.degree(ap.iata));
  const avgDegree = (degrees.reduce((a, b) => a + b, 0) / degrees.length).toFixed(1);
  const maxDegree = Math.max(...degrees);

  const regions: Record<string, Set<string>> = {};
  for (const ap of AIRPORTS) {
    if (!regions[ap.regiao]) regions[ap.regiao] = new Set();
    regions[ap.regiao].add(ap.iata);
  }

  const regionMetrics: RegionMetrics[] = Object.entries(regions).map(([regiao, nodes]) => {
    const sub = graph.subgraph(nodes);
    return { regiao, ordem: sub.order(), tamanho: sub.size(), densidade: parseFloat(sub.density().toFixed(4)) };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard label="Aeroportos" value={ordem} sub="Vértices" color="#38bdf8" />
        <StatCard label="Rotas" value={tamanho} sub="Arestas" color="#34d399" />
        <StatCard label="Grau médio" value={avgDegree} sub="Por aeroporto" color="#a78bfa" />
        <StatCard label="Grau máximo" value={maxDegree} sub="Hub principal" color="#f59e0b" />
        <StatCard label="Densidade" value={densidade} sub="Saturação" color="#f43f5e" />
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--fg-dim)" }}>Por Região</h3>
        <div className="grid grid-cols-1 gap-2">
          {regionMetrics.map((rm) => {
            const color = REGION_COLORS[rm.regiao] ?? "#94a3b8";
            const total = graph.size();
            const pct = total > 0 ? (rm.tamanho / total) * 100 : 0;
            return (
              <div key={rm.regiao} className="flex items-center gap-3 rounded-xl p-3"
                style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}>
                <div className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: color, boxShadow: `0 0 8px ${color}66` }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ color: "var(--fg)" }}>{rm.regiao}</div>
                  <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, opacity: 0.8 }} />
                  </div>
                </div>
                <div className="flex gap-3 text-right">
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>{rm.ordem}</div>
                    <div className="text-xs" style={{ color: "var(--fg-dim)" }}>aer.</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>{rm.tamanho}</div>
                    <div className="text-xs" style={{ color: "var(--fg-dim)" }}>rotas</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold" style={{ color: "var(--fg)" }}>{rm.densidade.toFixed(2)}</div>
                    <div className="text-xs" style={{ color: "var(--fg-dim)" }}>dens.</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
