"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, Radar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { Graph } from "../lib/graph";
import { AIRPORTS, REGION_COLORS } from "../lib/data";

interface ChartsSectionProps {
  graph: Graph;
}

function ChartCard({ title, explanation, children }: { title: string; explanation: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-slate-700/40">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400 mt-1 leading-relaxed">{explanation}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const CUSTOM_TOOLTIP_STYLE = {
  backgroundColor: "#0f172a",
  border: "1px solid #334155",
  borderRadius: 10,
  color: "#e2e8f0",
  fontSize: 12,
};

export default function ChartsSection({ graph }: ChartsSectionProps) {
  // Degree data
  const degreeData = AIRPORTS.map((ap) => ({
    iata: ap.iata,
    cidade: ap.cidade,
    grau: graph.degree(ap.iata),
    regiao: ap.regiao,
    color: REGION_COLORS[ap.regiao] ?? "#94a3b8",
  })).sort((a, b) => b.grau - a.grau);

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

  // Pie chart: distribution of connections per region
  const pieData = regionData.map((r) => ({
    name: r.regiao,
    value: r.tamanho,
    color: REGION_COLORS[r.regiao],
  }));

  // Ego network data (top 8 airports by ego density)
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Degree ranking */}
      <ChartCard
        title="Ranking por Grau de Conectividade"
        explanation="O grau de um aeroporto indica quantas rotas diretas ele possui. Hubs como GRU (São Paulo) e BSB (Brasília) concentram a maior parte das conexões nacionais, funcionando como pontos centrais da malha aérea brasileira."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={degreeData} margin={{ top: 5, right: 10, bottom: 30, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              dataKey="iata"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={CUSTOM_TOOLTIP_STYLE}
              formatter={(value, _, props) => [
                `${value} rotas`,
                `${props.payload.iata} — ${props.payload.cidade}`,
              ]}
            />
            <Bar dataKey="grau" radius={[4, 4, 0, 0]}>
              {degreeData.map((entry, i) => (
                <Cell key={i} fill={entry.color} opacity={0.9} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Region comparison */}
      <ChartCard
        title="Conectividade por Região"
        explanation="Compara o grau médio de conectividade de cada região. O Sudeste possui os hubs de maior capacidade, enquanto o Norte tem menor densidade mas conexões estratégicas para localidades remotas da Amazônia."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={regionData} margin={{ top: 5, right: 10, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="regiao" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
            <Bar dataKey="grauMedio" name="Grau médio" radius={[6, 6, 0, 0]}>
              {regionData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Pie chart */}
      <ChartCard
        title="Distribuição de Rotas por Região"
        explanation="Mostra a proporção de rotas internas de cada região no total da malha. O Sudeste e o Nordeste dominam em quantidade de conexões, reflexo da densidade populacional e do volume de tráfego aéreo nacional."
      >
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
              nameKey="name"
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.color} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={CUSTOM_TOOLTIP_STYLE}
              formatter={(v) => [`${v} rotas internas`]}
            />
            <Legend
              formatter={(value) => <span style={{ color: "#94a3b8", fontSize: 12 }}>{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Ego network density */}
      <ChartCard
        title="Densidade da Ego-Rede (Top 10 Hubs)"
        explanation="A ego-rede de um aeroporto inclui ele próprio e todos os seus vizinhos diretos. Alta densidade significa que os vizinhos também se conectam entre si — indicando clusters regionais bem integrados vs. hubs que servem como pontes entre regiões distintas."
      >
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={egoData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis type="number" tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 1]} />
            <YAxis type="category" dataKey="iata" tick={{ fill: "#94a3b8", fontSize: 11 }} width={35} />
            <Tooltip
              contentStyle={CUSTOM_TOOLTIP_STYLE}
              formatter={(v) => [`${Number(v).toFixed(3)}`, "Densidade ego"]}
            />
            <Bar dataKey="densidadeEgo" radius={[0, 4, 4, 0]}>
              {egoData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
