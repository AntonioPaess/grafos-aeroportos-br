"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, Cell, Legend,
} from "recharts";
import { Graph } from "../lib/graph";
import { Adjacencia } from "../lib/types";
import { AIRPORTS, REGION_COLORS, AIRPORT_MAP } from "../lib/data";

interface ChartsSectionProps {
  graph: Graph;
  filteredEdges: Adjacencia[];
}

function ChartCard({ title, explanation, children }: { title: string; explanation: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="text-base font-semibold" style={{ color: "var(--fg)" }}>{title}</h3>
        <p className="text-sm mt-1 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{explanation}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function tooltip() {
  return {
    contentStyle: {
      background: "#0f172a",
      border: "1px solid rgba(148,163,184,0.15)",
      borderRadius: 10,
      color: "#f1f5f9",
      fontSize: 13,
    },
    labelStyle: { color: "#f1f5f9" },
    itemStyle: { color: "#94a3b8" },
    cursor: { fill: "rgba(148,163,184,0.06)" },
  };
}

const TICK = { fill: "#94a3b8", fontSize: 12 };

export default function ChartsSection({ graph, filteredEdges }: ChartsSectionProps) {
  // Degree data (from full graph, sorted)
  const degreeData = AIRPORTS.map((ap) => ({
    iata: ap.iata,
    cidade: ap.cidade,
    grau: graph.degree(ap.iata),
    regiao: ap.regiao,
    color: REGION_COLORS[ap.regiao] ?? "#94a3b8",
  })).sort((a, b) => b.grau - a.grau).slice(0, 20);

  // Region aggregates
  const regions: Record<string, { nodes: string[]; regiao: string }> = {};
  for (const ap of AIRPORTS) {
    if (!regions[ap.regiao]) regions[ap.regiao] = { nodes: [], regiao: ap.regiao };
    regions[ap.regiao].nodes.push(ap.iata);
  }

  const regionData = Object.values(regions).map(({ regiao, nodes }) => {
    const sub = graph.subgraph(new Set(nodes));
    const totalDegree = nodes.reduce((sum, n) => sum + graph.degree(n), 0);
    return {
      regiao,
      ordem: sub.order(),
      tamanho: sub.size(),
      densidade: parseFloat((sub.density() * 100).toFixed(1)),
      grauMedio: parseFloat((totalDegree / nodes.length).toFixed(1)),
      color: REGION_COLORS[regiao],
    };
  });

  // Pie: edges per region from FILTERED edges
  const regionEdgeCounts: Record<string, number> = {};
  for (const e of filteredEdges) {
    const a = AIRPORT_MAP.get(e.origem);
    const b = AIRPORT_MAP.get(e.destino);
    if (a) regionEdgeCounts[a.regiao] = (regionEdgeCounts[a.regiao] ?? 0) + 0.5;
    if (b) regionEdgeCounts[b.regiao] = (regionEdgeCounts[b.regiao] ?? 0) + 0.5;
  }
  const pieData = Object.entries(regionEdgeCounts).map(([name, value]) => ({
    name, value: Math.round(value), color: REGION_COLORS[name] ?? "#94a3b8",
  }));

  // Ego density top 10
  const egoData = AIRPORTS.map((ap) => {
    const neighbors = new Set(graph.neighbors(ap.iata).map(([v]) => v));
    const egoNodes = new Set([ap.iata, ...neighbors]);
    const ego = graph.subgraph(egoNodes);
    return {
      iata: ap.iata,
      grau: graph.degree(ap.iata),
      densidadeEgo: parseFloat(ego.density().toFixed(3)),
      color: REGION_COLORS[ap.regiao],
    };
  }).sort((a, b) => b.grau - a.grau).slice(0, 10);

  // Airline distribution from filtered edges
  const airlineCounts: Record<string, number> = {};
  for (const e of filteredEdges) {
    for (const c of e.companhias) airlineCounts[c] = (airlineCounts[c] ?? 0) + 1;
  }
  const AIRLINE_COLORS_MAP: Record<string, string> = {
    LATAM: "#e11d48", GOL: "#f97316", Azul: "#3b82f6", Passaredo: "#10b981",
  };
  const airlineData = Object.entries(airlineCounts)
    .map(([name, value]) => ({ name, value, color: AIRLINE_COLORS_MAP[name] ?? "#94a3b8" }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Degree ranking */}
      <ChartCard
        title="Ranking por Grau de Conectividade"
        explanation="Aeroportos ordenados pelo número de rotas diretas. GRU e BSB concentram a maior parte das conexões nacionais, funcionando como hubs centrais da malha aérea."
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={degreeData} margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="iata" tick={{ ...TICK, fontSize: 11 }} angle={-45} textAnchor="end" height={55} />
            <YAxis tick={TICK} />
            <Tooltip {...tooltip()} formatter={(value, _, props) => [`${value} rotas`, `${props.payload.iata} — ${props.payload.cidade}`]} />
            <Bar dataKey="grau" radius={[4, 4, 0, 0]}>
              {degreeData.map((entry, i) => <Cell key={i} fill={entry.color} opacity={0.9} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Airline distribution */}
      <ChartCard
        title="Rotas por Companhia Aérea"
        explanation="Distribuição das rotas (filtradas) por companhia. LATAM e GOL dominam os hubs principais; Azul conecta cidades secundárias via Campinas (VCP)."
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={airlineData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={TICK} />
            <YAxis tick={TICK} />
            <Tooltip {...tooltip()} formatter={(v) => [`${v} rotas`]} />
            <Bar dataKey="value" name="Rotas" radius={[6, 6, 0, 0]}>
              {airlineData.map((d, i) => <Cell key={i} fill={d.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Region edge distribution */}
      <ChartCard
        title="Rotas por Região (filtro atual)"
        explanation="Quantidade de rotas de cada região nas arestas filtradas. Reflete como os filtros alteram o peso de cada região na rede."
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pieData} layout="vertical" margin={{ top: 5, right: 35, bottom: 5, left: 70 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={TICK} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ ...TICK, fontSize: 12 }} width={68} />
            <Tooltip {...tooltip()} formatter={(v) => [`${v} rotas`]} />
            <Bar dataKey="value" name="Rotas" radius={[0, 4, 4, 0]}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Ego density */}
      <ChartCard
        title="Densidade da Ego-Rede (Top 10 Hubs)"
        explanation="Alta densidade significa que os vizinhos do aeroporto também se conectam entre si — clusters regionais bem integrados. Hubs de ponte têm densidade baixa pois ligam regiões distintas."
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={egoData} layout="vertical" margin={{ top: 5, right: 35, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
            <XAxis type="number" tick={TICK} domain={[0, 1]} />
            <YAxis type="category" dataKey="iata" tick={{ ...TICK, fontSize: 12 }} width={38} />
            <Tooltip {...tooltip()} formatter={(v) => [`${Number(v).toFixed(3)}`, "Densidade ego"]} />
            <Bar dataKey="densidadeEgo" radius={[0, 4, 4, 0]}>
              {egoData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Region comparison */}
      <ChartCard
        title="Grau Médio por Região"
        explanation="Compara a conectividade média dos aeroportos de cada região. Sudeste lidera pelo peso dos hubs GRU, GIG e CGH. Norte tem menor grau médio mas conexões estratégicas para a Amazônia."
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={regionData} margin={{ top: 5, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="regiao" tick={{ ...TICK, fontSize: 11 }} />
            <YAxis tick={TICK} />
            <Tooltip {...tooltip()} />
            <Bar dataKey="grauMedio" name="Grau médio" radius={[6, 6, 0, 0]}>
              {regionData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Radar */}
      <ChartCard
        title="Perfil de Conectividade Regional"
        explanation="Radar comparando 4 dimensões por região: quantidade de aeroportos, arestas internas, grau médio e densidade. Sudeste domina volume; Norte e Centro-Oeste têm perfil mais esparso."
      >
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={regionData}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis dataKey="regiao" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Radar name="Aeroportos" dataKey="ordem" stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
            <Radar name="Grau médio" dataKey="grauMedio" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} />
            <Radar name="Densidade %" dataKey="densidade" stroke="#34d399" fill="#34d399" fillOpacity={0.15} />
            <Legend formatter={(v) => <span style={{ color: "var(--fg-muted)", fontSize: 12 }}>{v}</span>} />
            <Tooltip {...tooltip()} />
          </RadarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
