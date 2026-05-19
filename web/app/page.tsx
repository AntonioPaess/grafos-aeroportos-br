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

const BrazilAirportMap = dynamic(() => import("./components/BrazilAirportMap"), { ssr: false });

type Dataset = "parte1" | "parte2";
const TABS_P1 = ["Mapa", "Algoritmos", "Métricas", "Análises", "Rotas Obrigatórias"] as const;
type Tab = (typeof TABS_P1)[number] | "Facebook";

export default function Home() {
  const graph = useMemo(() => buildGraph(ADJACENCIAS), []);
  const edges = useMemo(() => graph.edges(), [graph]);

  const [dataset, setDataset] = useState<Dataset>("parte1");
  const [activeTab, setActiveTab] = useState<Tab>("Mapa");
  const [highlightedPath, setHighlightedPath] = useState<string[] | null>(null);
  const [highlightedNodes, setHighlightedNodes] = useState<Set<string>>(new Set());
  const [source, setSource] = useState("GRU");
  const [target, setTarget] = useState("REC");

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
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-xl">✈</div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Rede de Aeroportos BR</h1>
              <p className="text-xs text-slate-500">Teoria dos Grafos · Cesar School</p>
            </div>
          </div>

          {/* Dataset switcher */}
          <div className="flex items-center gap-1 bg-slate-800/60 rounded-xl p-1 border border-slate-700/50">
            <button
              onClick={() => switchDataset("parte1")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isParte1 ? "bg-sky-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Parte 1 — Aeroportos BR
            </button>
            <button
              onClick={() => switchDataset("parte2")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isParte1 ? "bg-violet-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Parte 2 — Facebook Ego
            </button>
          </div>

          {isParte1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">20 aeroportos</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">41 rotas</span>
              <span className="text-xs bg-emerald-900/60 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/60">5 regiões</span>
            </div>
          )}
          {!isParte1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">4.039 usuários</span>
              <span className="text-xs bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700/60">88.234 amizades</span>
              <span className="text-xs bg-violet-900/60 text-violet-400 px-2.5 py-1 rounded-full border border-violet-800/60">SNAP Dataset</span>
            </div>
          )}
        </div>
      </header>

      {/* Parte 2 — full width panel */}
      {!isParte1 && (
        <main className="flex-1 max-w-screen-2xl mx-auto w-full px-6 py-6">
          <FacebookPanel />
        </main>
      )}

      {/* Parte 1 — sidebar + main */}
      {isParte1 && (
        <div className="flex flex-1 max-w-screen-2xl mx-auto w-full px-6 py-5 gap-5">
          {/* Left sidebar */}
          <aside className="w-72 flex-shrink-0 flex flex-col gap-4">
            <nav className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-1.5 flex flex-col gap-0.5">
              {TABS_P1.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab
                      ? "bg-sky-600 text-white shadow-lg"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
                  }`}
                >
                  {tab === "Mapa" && "🗺 "}
                  {tab === "Algoritmos" && "⚡ "}
                  {tab === "Métricas" && "📊 "}
                  {tab === "Análises" && "📈 "}
                  {tab === "Rotas Obrigatórias" && "🛣 "}
                  {tab}
                </button>
              ))}
            </nav>

            {(activeTab === "Mapa" || activeTab === "Algoritmos") && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-4 flex-1 overflow-y-auto">
                <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 inline-block" />
                  Algoritmos
                </h2>
                <AlgorithmPanel
                  graph={graph}
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
              <div className="flex-1 rounded-2xl overflow-hidden" style={{ minHeight: 620 }}>
                <BrazilAirportMap
                  airports={AIRPORTS}
                  edges={edges}
                  highlightedPath={highlightedPath}
                  highlightedNodes={highlightedNodes}
                  selectedSource={source}
                  selectedTarget={target}
                  onAirportClick={(iata) => {
                    if (iata === source) return;
                    setTarget(iata);
                  }}
                />
              </div>
            )}

            {activeTab === "Algoritmos" && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1">Algoritmos de Grafos</h2>
                <p className="text-sm text-slate-400 mb-5">
                  Selecione o algoritmo e os aeroportos no painel lateral, depois veja o resultado aqui e no mapa.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { name: "BFS — Busca em Largura", color: "border-sky-700/60 bg-sky-900/20", desc: "Explora nível por nível. Garante o caminho com menor número de saltos. Complexidade: O(V + E)." },
                    { name: "DFS — Busca em Profundidade", color: "border-violet-700/60 bg-violet-900/20", desc: "Mergulha o mais fundo possível. Detecta ciclos e componentes. Complexidade: O(V + E)." },
                    { name: "Dijkstra", color: "border-emerald-700/60 bg-emerald-900/20", desc: "Caminho de menor custo com pesos não-negativos. Usa fila de prioridade. Complexidade: O((V + E) log V)." },
                    { name: "Bellman-Ford", color: "border-amber-700/60 bg-amber-900/20", desc: "Suporta pesos negativos e detecta ciclos negativos. Complexidade: O(V · E)." },
                  ].map((alg) => (
                    <div key={alg.name} className={`rounded-xl border p-4 ${alg.color}`}>
                      <div className="font-semibold text-white mb-1 text-sm">{alg.name}</div>
                      <div className="text-xs text-slate-400 leading-relaxed">{alg.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "Métricas" && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1">Métricas da Rede</h2>
                <p className="text-sm text-slate-400 mb-5">
                  Medidas estruturais do grafo. A densidade indica o quão conectada é a rede em relação ao máximo possível.
                </p>
                <MetricsCards graph={graph} />
              </div>
            )}

            {activeTab === "Análises" && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1">Análises Estatísticas</h2>
                <p className="text-sm text-slate-400 mb-6">
                  Visualizações que revelam a estrutura da rede, identificam hubs e comparam conectividade entre regiões.
                </p>
                <ChartsSection graph={graph} />
              </div>
            )}

            {activeTab === "Rotas Obrigatórias" && (
              <div className="bg-slate-900/60 border border-slate-700/50 rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-white mb-1">Caminhos Obrigatórios</h2>
                <p className="text-sm text-slate-400 mb-5">
                  7 pares definidos no projeto. Caminho mínimo calculado com Dijkstra. Clique em uma rota para visualizá-la no mapa interativo.
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
