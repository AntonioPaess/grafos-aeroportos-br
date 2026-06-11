"use client";

import { useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { buildGraph } from "./lib/graph";
import { AIRPORTS, ADJACENCIAS } from "./lib/data";
import AlgorithmPanel from "./components/AlgorithmPanel";
import MetricsCards from "./components/MetricsCards";
import ChartsSection from "./components/ChartsSection";
import MandatoryRoutes from "./components/MandatoryRoutes";
import FacebookPanel from "./components/FacebookPanel";
import GraphFilters, { Filters, defaultFilters } from "./components/GraphFilters";
import InsightsCards from "./components/InsightsCards";

const BrazilAirportMap = dynamic(() => import("./components/BrazilAirportMap"), { ssr: false });

type Dataset = "parte1" | "parte2";
const TABS_P1 = ["Mapa", "Algoritmos", "Métricas", "Insights", "Análises", "Rotas Obrigatórias"] as const;
type Tab = (typeof TABS_P1)[number] | "Facebook";

const TAB_ICONS: Record<string, string> = {
  "Mapa": "🗺",
  "Algoritmos": "⚡",
  "Métricas": "📊",
  "Insights": "💡",
  "Análises": "📈",
  "Rotas Obrigatórias": "🛣",
};

export default function Home() {
  const graph = useMemo(() => buildGraph(ADJACENCIAS), []);

  const [dataset, setDataset] = useState<Dataset>("parte1");
  const [activeTab, setActiveTab] = useState<Tab>("Mapa");
  const [highlightedPath, setHighlightedPath] = useState<string[] | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [source, setSource] = useState("GRU");
  const [target, setTarget] = useState("REC");
  const [filters, setFilters] = useState<Filters>(defaultFilters());

  const filteredAdjacencias = useMemo(() =>
    ADJACENCIAS.filter((e) => {
      const a = AIRPORTS.find((ap) => ap.iata === e.origem);
      const b = AIRPORTS.find((ap) => ap.iata === e.destino);
      if (!a || !b) return false;
      if (!filters.regioes.has(a.regiao) && !filters.regioes.has(b.regiao)) return false;
      if (!filters.tipos.has(e.tipo)) return false;
      if (!e.companhias.some((c) => filters.companhias.has(c))) return false;
      return true;
    }),
    [filters]
  );

  const filteredGraph = useMemo(() => buildGraph(filteredAdjacencias), [filteredAdjacencias]);
  const filteredEdges = useMemo(() => filteredGraph.edges(), [filteredGraph]);

  function handlePathChange(path: string[] | null, nodes: Set<string>) {
    setHighlightedPath(path);
    setHighlightedNodes(nodes);
  }

  function handleRouteSelect(path: string[] | null, nodes: Set<string>) {
    setHighlightedPath(path);
    setHighlightedNodes(nodes);
    setActiveTab("Mapa");
  }

  function switchDataset(d: Dataset) {
    setDataset(d);
    setActiveTab(d === "parte1" ? "Mapa" : "Facebook");
    setHighlightedPath(null);
    setHighlightedNodes(new Set());
  }

  const isParte1 = dataset === "parte1";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="sticky top-0 z-50"
        style={{
          borderBottom: "1px solid var(--border)",
          background: "color-mix(in srgb, var(--bg) 80%, transparent)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✈</span>
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ color: "var(--fg)" }}>
                Rede de Aeroportos BR
              </h1>
              <p className="text-xs" style={{ color: "var(--fg-muted)" }}>Teoria dos Grafos · Cesar School</p>
            </div>
          </div>

          {/* Dataset switcher */}
          <div
            className="flex items-center gap-1 rounded-xl p-1"
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)" }}
          >
            <button
              onClick={() => switchDataset("parte1")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isParte1 ? "#0284c7" : "transparent",
                color: isParte1 ? "white" : "var(--fg-muted)",
              }}
            >
              Parte 1 — Aeroportos BR
            </button>
            <button
              onClick={() => switchDataset("parte2")}
              className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
              style={{
                background: !isParte1 ? "#7c3aed" : "transparent",
                color: !isParte1 ? "white" : "var(--fg-muted)",
              }}
            >
              Parte 2 — Facebook Ego
            </button>
          </div>

          {isParte1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
                {AIRPORTS.length} aeroportos
              </span>
              <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>
                {ADJACENCIAS.length} rotas
              </span>
              <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "rgba(34,197,94,0.1)", color: "#22c55e", border: "1px solid rgba(34,197,94,0.3)" }}>
                5 regiões
              </span>
            </div>
          )}
          {!isParte1 && (
            <div className="flex items-center gap-2">
              <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>4.039 usuários</span>
              <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "var(--bg-muted)", color: "var(--fg-muted)", border: "1px solid var(--border)" }}>88.234 amizades</span>
              <span className="text-sm px-2.5 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)" }}>SNAP Dataset</span>
            </div>
          )}
        </div>
      </header>

      {/* Parte 2 */}
      {!isParte1 && (
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6">
          <FacebookPanel />
        </main>
      )}

      {/* Parte 1 */}
      {isParte1 && (
        <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-6 py-5 gap-5">
          {/* Left sidebar */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
            {/* Navigation */}
            <nav
              className="rounded-2xl p-1.5 flex flex-col gap-0.5"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
            >
              {TABS_P1.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className="w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: activeTab === tab ? "#0284c7" : "transparent",
                    color: activeTab === tab ? "white" : "var(--fg-muted)",
                  }}
                >
                  {TAB_ICONS[tab]} {tab}
                </button>
              ))}
            </nav>

            {/* Filters */}
            <GraphFilters filters={filters} onChange={setFilters} />

            {/* Algorithm panel (on Mapa / Algoritmos tab) */}
            {(activeTab === "Mapa" || activeTab === "Algoritmos") && (
              <div
                className="rounded-2xl p-4 flex-1 overflow-y-auto"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: "var(--fg)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                  Algoritmos
                </h2>
                <AlgorithmPanel
                  graph={filteredGraph}
                  onPathChange={handlePathChange}
                  source={source}
                  setSource={setSource}
                  target={target}
                  setTarget={setTarget}
                />
              </div>
            )}
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 flex flex-col gap-5">
            {activeTab === "Mapa" && (
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ minHeight: 650 }}>
                <BrazilAirportMap
                  airports={AIRPORTS}
                  edges={filteredEdges}
                  filteredAdjacencias={filteredAdjacencias}
                  highlightedPath={highlightedPath}
                  highlightedNodes={highlightedNodes}
                  selectedSource={source}
                  selectedTarget={target}
                  onAirportClick={(iata) => { if (iata !== source) setTarget(iata); }}
                />
              </div>
            )}

            {activeTab === "Algoritmos" && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--fg)" }}>Algoritmos de Grafos</h2>
                <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                  Selecione o algoritmo e os aeroportos no painel lateral e veja o resultado aqui e no mapa.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "BFS — Busca em Largura",       color: "#38bdf8", desc: "Explora nível por nível. Menor número de saltos. O(V + E)." },
                    { name: "DFS — Busca em Profundidade",  color: "#a78bfa", desc: "Mergulha o mais fundo possível. Detecta ciclos. O(V + E)." },
                    { name: "Dijkstra",                      color: "#34d399", desc: "Menor custo com pesos não-negativos. Fila de prioridade. O((V+E)logV)." },
                    { name: "Bellman-Ford",                  color: "#f59e0b", desc: "Suporta pesos negativos. Detecta ciclos negativos. O(V·E)." },
                  ].map((alg) => (
                    <div key={alg.name} className="rounded-xl border p-4"
                      style={{ background: alg.color + "11", border: `1px solid ${alg.color}33` }}>
                      <div className="font-semibold text-sm mb-1" style={{ color: alg.color }}>{alg.name}</div>
                      <div className="text-sm leading-relaxed" style={{ color: "var(--fg-muted)" }}>{alg.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Métricas" && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--fg)" }}>Métricas da Rede</h2>
                <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                  Medidas estruturais do grafo. A densidade indica o quão conectada é a rede em relação ao máximo teórico.
                </p>
                <MetricsCards graph={graph} />
              </div>
            )}

            {activeTab === "Insights" && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--fg)" }}>Insights da Rede</h2>
                <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                  Descobertas calculadas automaticamente do grafo filtrado. Os valores mudam conforme você ajusta os filtros no painel lateral.
                </p>
                <InsightsCards graph={graph} filteredEdges={filteredAdjacencias} />
              </div>
            )}

            {activeTab === "Análises" && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--fg)" }}>Análises Estatísticas</h2>
                <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                  Gráficos dinâmicos que revelam a estrutura da rede. Todos os charts refletem os filtros ativos.
                </p>
                <ChartsSection graph={filteredGraph} filteredEdges={filteredAdjacencias} />
              </div>
            )}

            {activeTab === "Rotas Obrigatórias" && (
              <div
                className="rounded-2xl p-6"
                style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
              >
                <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--fg)" }}>Caminhos Obrigatórios</h2>
                <p className="text-sm mb-5" style={{ color: "var(--fg-muted)" }}>
                  7 pares definidos no projeto. Clique em uma rota para visualizá-la no mapa interativo.
                </p>
                <MandatoryRoutes graph={graph} onRouteSelect={handleRouteSelect} />
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}
