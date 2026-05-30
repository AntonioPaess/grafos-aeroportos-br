"use client";

import { useMemo } from "react";
import { Graph } from "../lib/graph";
import { AIRPORTS, ADJACENCIAS, AIRLINE_COLORS, REGION_COLORS, AIRPORT_MAP } from "../lib/data";
import { Adjacencia } from "../lib/types";

interface Props {
  graph: Graph;
  filteredEdges: Adjacencia[];
}

interface Insight {
  icon: string;
  title: string;
  value: string;
  detail: string;
  color: string;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function InsightsCards({ graph, filteredEdges }: Props) {
  const insights = useMemo<Insight[]>(() => {
    const list: Insight[] = [];

    // 1. Hub mais conectado (maior grau)
    let maxDegree = 0;
    let topHub = "";
    for (const ap of AIRPORTS) {
      const d = graph.degree(ap.iata);
      if (d > maxDegree) { maxDegree = d; topHub = ap.iata; }
    }
    const topHubAp = AIRPORT_MAP.get(topHub);
    if (topHubAp) {
      const regColor = REGION_COLORS[topHubAp.regiao] ?? "#94a3b8";
      list.push({
        icon: "✈",
        title: "Hub mais conectado",
        value: `${topHub} — ${topHubAp.cidade}`,
        detail: `${maxDegree} rotas diretas · ${topHubAp.regiao}`,
        color: regColor,
      });
    }

    // 2. Rota mais longa (nas arestas filtradas)
    let maxDist = 0;
    let longestEdge: Adjacencia | null = null;
    for (const e of filteredEdges) {
      if (e.distancia_km > maxDist) { maxDist = e.distancia_km; longestEdge = e; }
    }
    if (longestEdge) {
      const compColor = AIRLINE_COLORS[longestEdge.companhias[0]] ?? "#94a3b8";
      list.push({
        icon: "📏",
        title: "Rota mais longa",
        value: `${longestEdge.origem} → ${longestEdge.destino}`,
        detail: `${longestEdge.distancia_km.toLocaleString("pt-BR")} km · ${longestEdge.companhias.join(", ")}`,
        color: compColor,
      });
    }

    // 3. Companhia com mais rotas (nas arestas filtradas)
    const airlinesCount: Record<string, number> = {};
    for (const e of filteredEdges) {
      for (const c of e.companhias) airlinesCount[c] = (airlinesCount[c] ?? 0) + 1;
    }
    const topAirline = Object.entries(airlinesCount).sort((a, b) => b[1] - a[1])[0];
    if (topAirline) {
      list.push({
        icon: "🏆",
        title: "Maior malha aérea",
        value: topAirline[0],
        detail: `${topAirline[1]} rotas no filtro atual`,
        color: AIRLINE_COLORS[topAirline[0]] ?? "#94a3b8",
      });
    }

    // 4. Região mais isolada (menor grau médio)
    const regionDegrees: Record<string, number[]> = {};
    for (const ap of AIRPORTS) {
      if (!regionDegrees[ap.regiao]) regionDegrees[ap.regiao] = [];
      regionDegrees[ap.regiao].push(graph.degree(ap.iata));
    }
    let minAvg = Infinity;
    let isolatedRegion = "";
    for (const [reg, degrees] of Object.entries(regionDegrees)) {
      const avg = degrees.reduce((a, b) => a + b, 0) / degrees.length;
      if (avg < minAvg) { minAvg = avg; isolatedRegion = reg; }
    }
    if (isolatedRegion) {
      list.push({
        icon: "🏝",
        title: "Região mais isolada",
        value: isolatedRegion,
        detail: `Grau médio: ${minAvg.toFixed(1)} rotas/aeroporto`,
        color: REGION_COLORS[isolatedRegion] ?? "#94a3b8",
      });
    }

    // 5. Diâmetro estimado (BFS a partir do hub mais conectado)
    const bfsResult = simpleBFS(topHub, graph);
    const maxLevel = Math.max(...Object.values(bfsResult));
    list.push({
      icon: "🌐",
      title: "Diâmetro da rede",
      value: `${maxLevel} saltos`,
      detail: `Máx. conexões a partir de ${topHub}`,
      color: "#38bdf8",
    });

    // 6. Aeroporto com maior alcance geográfico
    let maxGeoSpread = 0;
    let geoHub = "";
    for (const ap of AIRPORTS) {
      const neighbors = graph.neighbors(ap.iata).map(([v]) => v);
      if (neighbors.length < 2) continue;
      let total = 0;
      for (const n of neighbors) {
        const nb = AIRPORT_MAP.get(n);
        if (nb) total += haversine(ap.lat, ap.lon, nb.lat, nb.lon);
      }
      if (total > maxGeoSpread) { maxGeoSpread = total; geoHub = ap.iata; }
    }
    if (geoHub) {
      const geoAp = AIRPORT_MAP.get(geoHub)!;
      list.push({
        icon: "🗺",
        title: "Maior alcance geográfico",
        value: `${geoHub} — ${geoAp.cidade}`,
        detail: `${Math.round(maxGeoSpread / 1000)}k km cobertos nas rotas diretas`,
        color: REGION_COLORS[geoAp.regiao] ?? "#94a3b8",
      });
    }

    return list;
  }, [graph, filteredEdges]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 fade-in">
      {insights.map((ins, i) => (
        <div
          key={i}
          className="relative overflow-hidden rounded-xl p-4"
          style={{
            background: "var(--bg-card)",
            border: `1px solid ${ins.color}33`,
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{ background: `linear-gradient(135deg,${ins.color},transparent)` }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg leading-none">{ins.icon}</span>
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: ins.color }}>
                {ins.title}
              </span>
            </div>
            <div className="text-base font-bold leading-snug" style={{ color: "var(--fg)" }}>
              {ins.value}
            </div>
            <div className="text-xs mt-1" style={{ color: "var(--fg-muted)" }}>
              {ins.detail}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function simpleBFS(start: string, graph: Graph): Record<string, number> {
  const dist: Record<string, number> = { [start]: 0 };
  const queue = [start];
  while (queue.length) {
    const node = queue.shift()!;
    for (const [nb] of graph.neighbors(node)) {
      if (dist[nb] === undefined) {
        dist[nb] = dist[node] + 1;
        queue.push(nb);
      }
    }
  }
  return dist;
}
