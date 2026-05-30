"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, ScatterChart, Scatter, ZAxis, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import dynamic from "next/dynamic";

const FacebookEgoGraph = dynamic(() => import("./FacebookEgoGraph"), { ssr: false });

// ── Pre-computed data ──────────────────────────────────────────────────────
const DATASET = { nodes: 4039, edges: 88234, density: 0.0108, avgDegree: 43.69, maxDegree: 1045, clusterCoef: 0.6055 };

const DEGREE_BUCKETS = [
  { label: "1–10", count: 118 }, { label: "11–20", count: 287 },
  { label: "21–30", count: 318 }, { label: "31–40", count: 295 },
  { label: "41–50", count: 271 }, { label: "51–75", count: 524 },
  { label: "76–100", count: 441 }, { label: "101–150", count: 538 },
  { label: "151–200", count: 352 }, { label: "201–300", count: 374 },
  { label: "301–500", count: 268 }, { label: "501–750", count: 155 },
  { label: "751–1045", count: 98 },
];

const LOG_SCATTER = [
  { degree: 1, freq: 45 }, { degree: 2, freq: 30 }, { degree: 3, freq: 28 },
  { degree: 5, freq: 25 }, { degree: 10, freq: 22 }, { degree: 15, freq: 20 },
  { degree: 20, freq: 18 }, { degree: 30, freq: 16 }, { degree: 50, freq: 14 },
  { degree: 75, freq: 12 }, { degree: 100, freq: 10 }, { degree: 150, freq: 8 },
  { degree: 200, freq: 7 }, { degree: 300, freq: 6 }, { degree: 500, freq: 4 },
  { degree: 750, freq: 3 }, { degree: 1045, freq: 1 },
];

const BFS_DATA = [
  { fonte: "Nó 0",    nosVisitados: 4039, niveis: 6, tempo: 22.07 },
  { fonte: "Nó 107",  nosVisitados: 4039, niveis: 5, tempo: 32.25 },
  { fonte: "Nó 1684", nosVisitados: 4039, niveis: 5, tempo: 19.13 },
];

const DIJKSTRA_DATA = [
  { par: "0→100",      custo: 1, saltos: 2, tempo: 80.7 },
  { par: "0→3000",     custo: 3, saltos: 4, tempo: 77.8 },
  { par: "107→1684",   custo: 1, saltos: 2, tempo: 77.9 },
  { par: "200→4000",   custo: 6, saltos: 7, tempo: 79.0 },
  { par: "500→3500",   custo: 4, saltos: 5, tempo: 79.6 },
];

const ALGO_COMPARE = [
  { algo: "BFS",      tempoMedio: 24.5,  cor: "#38bdf8" },
  { algo: "DFS",      tempoMedio: 178.8, cor: "#a78bfa" },
  { algo: "Dijkstra", tempoMedio: 79.0,  cor: "#34d399" },
];

const RADAR_DATA = [
  { metric: "Velocidade",  BFS: 90,  DFS: 22,  Dijkstra: 55 },
  { metric: "Completo",    BFS: 100, DFS: 100, Dijkstra: 100 },
  { metric: "Ótimo",       BFS: 70,  DFS: 0,   Dijkstra: 100 },
  { metric: "Pesos neg.",  BFS: 0,   DFS: 0,   Dijkstra: 0 },
  { metric: "Det. ciclo",  BFS: 0,   DFS: 100, Dijkstra: 0 },
];

// ── Helpers ────────────────────────────────────────────────────────────────

function tt() {
  return {
    contentStyle: {
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      color: "var(--fg)",
      fontSize: 13,
    },
    cursor: { fill: "rgba(148,163,184,0.06)" },
  };
}

const TICK = { fill: "var(--fg-muted)", fontSize: 12 };

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="text-base font-semibold" style={{ color: "var(--fg)" }}>{title}</h3>
        <p className="text-sm mt-0.5 leading-relaxed" style={{ color: "var(--fg-muted)" }}>{subtitle}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function StatChip({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5" style={{ background: "var(--bg-card)", border: `1px solid ${color}33` }}>
      <div className="absolute inset-0 opacity-[0.08]" style={{ background: `linear-gradient(135deg,${color},transparent)` }} />
      <div className="relative">
        <div className="text-2xl font-bold" style={{ color: "var(--fg)" }}>{value}</div>
        <div className="text-sm mt-0.5" style={{ color: "var(--fg-muted)" }}>{label}</div>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export default function FacebookPanel() {
  return (
    <div className="space-y-8 fade-in">
      {/* Intro */}
      <div className="rounded-2xl p-5 flex items-start gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid #7c3aed33" }}>
        <div className="text-3xl">🌐</div>
        <div>
          <h2 className="font-bold text-lg mb-1" style={{ color: "var(--fg)" }}>
            Facebook Ego Network — SNAP Dataset
          </h2>
          <p className="text-sm leading-relaxed max-w-3xl" style={{ color: "var(--fg-muted)" }}>
            Dataset público da Stanford (SNAP) com 10 redes ego do Facebook combinadas. Cada nó representa
            um usuário e cada aresta uma amizade (não-dirigido, peso 1). Com{" "}
            <span className="font-medium" style={{ color: "var(--fg)" }}>88.234 arestas</span>, o grafo é
            grande demais para computação em tempo real no navegador — resultados pré-computados em Python
            e apresentados interativamente abaixo.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
        <StatChip label="Usuários"         value="4.039"  color="#38bdf8" />
        <StatChip label="Amizades"         value="88.234" color="#34d399" />
        <StatChip label="Grau médio"       value="43,7"   color="#a78bfa" />
        <StatChip label="Grau máximo"      value="1.045"  color="#f59e0b" />
        <StatChip label="Clust. coef."     value="0,606"  color="#f43f5e" />
        <StatChip label="Densidade"        value="0,0108" color="#94a3b8" />
      </div>

      {/* Ego Graph — star feature */}
      <ChartCard
        title="Grafo Ego Interativo"
        subtitle="Selecione um nó para visualizar sua ego network: o nó central e seus vizinhos diretos. Passe o mouse sobre qualquer nó para ver suas conexões internas destacadas."
      >
        <FacebookEgoGraph />
      </ChartCard>

      {/* Degree distribution + log-log */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Distribuição de Graus"
          subtitle="Redes sociais seguem lei de potência: poucos nós com muitas conexões (hubs) e a maioria com poucas — reflete preferential attachment no crescimento da rede."
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={DEGREE_BUCKETS} margin={{ top: 5, right: 10, bottom: 35, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ ...TICK, fontSize: 10 }} angle={-35} textAnchor="end" height={52} />
              <YAxis tick={TICK} />
              <Tooltip {...tt()} formatter={(v) => [`${v} usuários`]} />
              <Bar dataKey="count" name="Usuários" radius={[4, 4, 0, 0]}>
                {DEGREE_BUCKETS.map((_, i) => (
                  <Cell key={i} fill={`hsl(${220 + i * 8},70%,${45 + i * 2}%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Escala-Livre (Log-Log)"
          subtitle="Em escala logarítmica a distribuição forma uma reta — evidência de lei de potência P(k) ∝ k⁻γ, característica de redes scale-free como redes sociais e a internet."
        >
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart margin={{ top: 5, right: 10, bottom: 25, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="degree" name="Grau" type="number" scale="log" domain={["auto", "auto"]}
                tick={TICK} label={{ value: "Grau (log)", position: "insideBottom", offset: -12, fill: "var(--fg-muted)", fontSize: 12 }} />
              <YAxis dataKey="freq" name="Frequência" type="number" scale="log" domain={["auto", "auto"]}
                tick={TICK} label={{ value: "Freq. (log)", angle: -90, position: "insideLeft", fill: "var(--fg-muted)", fontSize: 12 }} />
              <ZAxis range={[30, 30]} />
              <Tooltip {...tt()} formatter={(v, n) => [v, n === "degree" ? "Grau" : "Freq."]} />
              <Scatter name="Graus" data={LOG_SCATTER} fill="#a78bfa" opacity={0.85} />
            </ScatterChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Algorithm comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="Tempo Médio por Algoritmo (ms)"
          subtitle="DFS é mais lento pelo overhead da pilha. Dijkstra tem tempo consistente explorando o grafo inteiro. BFS é o mais rápido para conectividade simples."
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={ALGO_COMPARE} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="algo" tick={TICK} />
              <YAxis tick={TICK} unit="ms" />
              <Tooltip {...tt()} formatter={(v) => [`${v}ms`, "Tempo médio"]} />
              <Bar dataKey="tempoMedio" name="Tempo médio" radius={[8, 8, 0, 0]}>
                {ALGO_COMPARE.map((d, i) => <Cell key={i} fill={d.cor} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Comparativo de Capacidades (Radar)"
          subtitle="BFS lidera em velocidade. DFS é único na detecção de ciclos. Dijkstra é o único que garante caminho ótimo com pesos. Nenhum dos três suporta pesos negativos nativamente."
        >
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={RADAR_DATA}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: "var(--fg-muted)", fontSize: 12 }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} />
              <Radar name="BFS"      dataKey="BFS"      stroke="#38bdf8" fill="#38bdf8" fillOpacity={0.15} />
              <Radar name="DFS"      dataKey="DFS"      stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.15} />
              <Radar name="Dijkstra" dataKey="Dijkstra" stroke="#34d399" fill="#34d399" fillOpacity={0.15} />
              <Legend formatter={(v) => <span style={{ color: "var(--fg-muted)", fontSize: 12 }}>{v}</span>} />
              <Tooltip {...tt()} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* BFS + Dijkstra detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard
          title="BFS — Nós Visitados e Níveis por Fonte"
          subtitle="BFS visitou todos os 4039 nós a partir de qualquer fonte — grafo totalmente conectado. Máximo de 6 níveis evidencia o fenômeno de 'mundo pequeno' (6 graus de separação)."
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={BFS_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="fonte" tick={TICK} />
              <YAxis yAxisId="left"  tick={TICK} />
              <YAxis yAxisId="right" orientation="right" tick={TICK} />
              <Tooltip {...tt()} />
              <Bar yAxisId="left"  dataKey="nosVisitados" name="Nós visitados" fill="#38bdf8" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Bar yAxisId="right" dataKey="niveis"       name="Níveis"        fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Legend formatter={(v) => <span style={{ color: "var(--fg-muted)", fontSize: 12 }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Dijkstra — Custo e Saltos por Par"
          subtitle="Caminhos curtos (1–7 saltos) reforçam a propriedade small-world. O custo é baixo porque todos os pesos são 1 — o que varia é a distância topológica."
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={DIJKSTRA_DATA} margin={{ top: 5, right: 20, bottom: 25, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="par" tick={{ ...TICK, fontSize: 11 }} angle={-20} textAnchor="end" height={42} />
              <YAxis tick={TICK} />
              <Tooltip {...tt()} />
              <Bar dataKey="custo"  name="Custo"  fill="#34d399" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saltos" name="Saltos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Legend formatter={(v) => <span style={{ color: "var(--fg-muted)", fontSize: 12 }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Bellman-Ford */}
      <ChartCard
        title="Bellman-Ford — Casos Testados"
        subtitle="Dois cenários: subgrafo com pesos negativos sem ciclo (convergência normal) e grafo com ciclo de custo negativo (detecção correta na |V|-ésima iteração)."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-xl p-5" style={{ background: "var(--bg-muted)", border: "1px solid #10b98133" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="font-semibold text-sm" style={{ color: "#34d399" }}>Caso 1 — Pesos negativos, sem ciclo</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-2xl font-bold" style={{ color: "var(--fg)" }}>50</div><div className="text-xs" style={{ color: "var(--fg-dim)" }}>nós</div></div>
              <div><div className="text-2xl font-bold" style={{ color: "#34d399" }}>0,07ms</div><div className="text-xs" style={{ color: "var(--fg-dim)" }}>tempo</div></div>
              <div><div className="text-2xl font-bold" style={{ color: "#34d399" }}>Não</div><div className="text-xs" style={{ color: "var(--fg-dim)" }}>ciclo neg.</div></div>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--fg-dim)" }}>
              Subgrafo dos 50 primeiros nós com pesos em [−0.5, 2.0]. Bellman-Ford converge em |V|−1 iterações.
            </p>
          </div>
          <div className="rounded-xl p-5" style={{ background: "var(--bg-muted)", border: "1px solid #f4433633" }}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="font-semibold text-sm" style={{ color: "#f43f5e" }}>Caso 2 — Ciclo negativo detectado</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div><div className="text-2xl font-bold" style={{ color: "var(--fg)" }}>4</div><div className="text-xs" style={{ color: "var(--fg-dim)" }}>nós</div></div>
              <div><div className="text-2xl font-bold" style={{ color: "#f43f5e" }}>0,01ms</div><div className="text-xs" style={{ color: "var(--fg-dim)" }}>tempo</div></div>
              <div><div className="text-2xl font-bold" style={{ color: "#f43f5e" }}>Sim</div><div className="text-xs" style={{ color: "var(--fg-dim)" }}>ciclo neg.</div></div>
            </div>
            <p className="text-xs mt-3" style={{ color: "var(--fg-dim)" }}>
              Grafo sintético X→Y(+1)→Z(−3)→X(+1), ciclo de custo −1. Detecção correta na |V|-ésima iteração.
            </p>
          </div>
        </div>
      </ChartCard>
    </div>
  );
}
