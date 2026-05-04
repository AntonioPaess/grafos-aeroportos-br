"""Gera o PDF do projeto usando matplotlib (sem dependencias extras)."""
from __future__ import annotations

import os
import textwrap

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.backends.backend_pdf import PdfPages
import matplotlib.image as mpimg


OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "out")
PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "Projeto_Grafos_Aeroportos_BR.pdf")


def _text_page(pdf: PdfPages, title: str, lines: list[str], fontsize: float = 10) -> None:
    fig, ax = plt.subplots(figsize=(8.27, 11.69))
    ax.axis("off")
    y = 0.95
    ax.text(0.05, y, title, fontsize=14, fontweight="bold", va="top", transform=ax.transAxes)
    y -= 0.05

    for line in lines:
        if line.startswith("## "):
            y -= 0.015
            ax.text(0.05, y, line[3:], fontsize=12, fontweight="bold", va="top", transform=ax.transAxes)
            y -= 0.03
        elif line.startswith("### "):
            y -= 0.01
            ax.text(0.05, y, line[4:], fontsize=11, fontweight="bold", va="top", transform=ax.transAxes)
            y -= 0.025
        elif line.startswith("| "):
            ax.text(0.05, y, line, fontsize=8, fontfamily="monospace", va="top", transform=ax.transAxes)
            y -= 0.018
        elif line.startswith("```"):
            continue
        elif line == "":
            y -= 0.01
        else:
            wrapped = textwrap.wrap(line, width=95)
            for wl in wrapped:
                ax.text(0.05, y, wl, fontsize=fontsize, va="top", transform=ax.transAxes)
                y -= 0.02

        if y < 0.05:
            pdf.savefig(fig)
            plt.close(fig)
            fig, ax = plt.subplots(figsize=(8.27, 11.69))
            ax.axis("off")
            y = 0.95

    pdf.savefig(fig)
    plt.close(fig)


def _image_page(pdf: PdfPages, img_path: str, caption: str) -> None:
    if not os.path.exists(img_path):
        return
    fig, ax = plt.subplots(figsize=(8.27, 11.69))
    ax.axis("off")
    img = mpimg.imread(img_path)
    ax.imshow(img, aspect="auto")
    ax.set_title(caption, fontsize=12, fontweight="bold", pad=10)
    fig.tight_layout()
    pdf.savefig(fig)
    plt.close(fig)


def generate_pdf() -> None:
    os.makedirs(os.path.dirname(PDF_PATH), exist_ok=True)

    with PdfPages(PDF_PATH) as pdf:
        # --- CAPA ---
        fig, ax = plt.subplots(figsize=(8.27, 11.69))
        ax.axis("off")
        ax.text(0.5, 0.65, "Rede de Aeroportos do Brasil", fontsize=22, fontweight="bold",
                ha="center", va="center", transform=ax.transAxes)
        ax.text(0.5, 0.58, "Comparacao de Algoritmos em Grafos", fontsize=16,
                ha="center", va="center", transform=ax.transAxes, color="#555555")
        ax.text(0.5, 0.48, "Projeto Final — Teoria dos Grafos + AVD", fontsize=13,
                ha="center", va="center", transform=ax.transAxes)
        ax.text(0.5, 0.43, "Cesar School — 2025.1", fontsize=12,
                ha="center", va="center", transform=ax.transAxes, color="#777777")
        ax.text(0.5, 0.33, "Equipe:", fontsize=12, fontweight="bold",
                ha="center", va="center", transform=ax.transAxes)
        ax.text(0.5, 0.28, "Antonio Paes  |  Galileu Moares  |  Marco Maciel  |  Jose Henrique", fontsize=11,
                ha="center", va="center", transform=ax.transAxes)
        pdf.savefig(fig)
        plt.close(fig)

        # --- MANUAL DE USO ---
        _text_page(pdf, "1. Manual de Uso", [
            "## Instalacao",
            "",
            "python3 -m venv venv",
            "source venv/bin/activate",
            "pip install -r requirements.txt",
            "",
            "## Execucao — Parte 1",
            "",
            "# Gerar todas as saidas:",
            "python -m src.cli --dataset ./data/aeroportos_data.csv --all --out ./out/",
            "",
            "# Algoritmo especifico (exemplo BFS):",
            "python -m src.cli --dataset ./data/aeroportos_data.csv --alg BFS --source REC --out ./out/",
            "",
            "# Dijkstra com destino:",
            "python -m src.cli --dataset ./data/aeroportos_data.csv --alg DIJKSTRA --source REC --target POA --out ./out/",
            "",
            "## Execucao — Parte 2",
            "",
            "python -m src.cli --dataset ./data/dataset_parte2/ --parte2 --out ./out/",
            "",
            "## App Streamlit (Bonus)",
            "",
            "streamlit run src/app.py",
            "",
            "Permite selecionar dataset, algoritmo, origem e destino de forma interativa.",
            "",
            "## Testes",
            "",
            "pytest tests/ -v",
            "# 14 testes passando (BFS, DFS, Dijkstra, Bellman-Ford)",
        ])

        # --- DOCUMENTACAO TECNICA ---
        _text_page(pdf, "2. Documentacao Tecnica", [
            "## 2.1 Estrutura do Grafo",
            "",
            "O grafo utiliza lista de adjacencia implementada como dict[str, list[tuple[str, float]]].",
            "Cada no (aeroporto) mapeia para uma lista de tuplas (vizinho, peso).",
            "O grafo eh nao-direcionado: ao adicionar uma aresta (u, v), a aresta (v, u) eh criada automaticamente.",
            "",
            "## 2.2 Construcao das Arestas",
            "",
            "As 41 arestas foram construidas seguindo tres criterios:",
            "",
            "1. Conexoes regionais (22 arestas): aeroportos da mesma regiao conectados por proximidade.",
            "2. Conexoes via hubs (17 arestas): GRU e BSB conectados a pelo menos um aeroporto de cada regiao.",
            "3. Conexoes inter-regionais diretas (3 arestas): THE-BEL, CGH-CWB, VIX-SSA.",
            "",
            "## 2.3 Formula de Pesos",
            "",
            "peso = 1.0 + penalidade_regiao + penalidade_hub",
            "",
            "- penalidade_regiao = 1.0 se regioes diferentes; 0.0 caso contrario",
            "- penalidade_hub = 0.5 se nenhum dos dois eh hub (GRU/BSB); 0.0 caso contrario",
            "",
            "| Tipo de conexao         | Peso |",
            "| Regional (mesma regiao) | 1.0  |",
            "| Hub (GRU/BSB)           | 2.0  |",
            "| Inter-regional sem hub  | 2.5  |",
            "",
            "Justificativa: a formula reflete o custo real de voos — conexoes regionais sao mais",
            "baratas e frequentes, voos via hub tem custo moderado, e inter-regionais sem hub sao as mais caras.",
            "",
            "## 2.4 Algoritmos Implementados",
            "",
            "BFS: usa collections.deque como fila FIFO. Explora nos camada por camada.",
            "",
            "DFS: implementacao iterativa com stack explicito. Registra tempos de descoberta e",
            "finalizacao, classifica arestas em tree, back, forward e cross. Detecta ciclos.",
            "",
            "Dijkstra: usa heapq como fila de prioridade. Encontra caminhos minimos com pesos >= 0.",
            "Rejeita pesos negativos com ValueError.",
            "",
            "Bellman-Ford: V-1 iteracoes de relaxacao + verificacao de ciclo negativo.",
            "Unico algoritmo que suporta pesos negativos.",
            "",
            "| Algoritmo    | Complexidade     | Pesos Neg. | Detecta Ciclo |",
            "| BFS          | O(V + E)         | Nao        | Nao           |",
            "| DFS          | O(V + E)         | Nao        | Sim           |",
            "| Dijkstra     | O((V+E) log V)   | Nao        | Nao           |",
            "| Bellman-Ford | O(V * E)         | Sim        | Sim (neg.)    |",
        ])

        # --- METRICAS ---
        _text_page(pdf, "3. Metricas do Grafo", [
            "## 3.1 Metricas Globais",
            "",
            "| Metrica    | Valor  |",
            "| Ordem (|V|)| 20     |",
            "| Tamanho(|E|)| 41    |",
            "| Densidade  | 0.2158 |",
            "",
            "## 3.2 Metricas por Regiao",
            "",
            "| Regiao        | Ordem | Tamanho | Densidade |",
            "| Centro-Oeste  | 2     | 1       | 1.0000    |",
            "| Nordeste      | 6     | 8       | 0.5333    |",
            "| Norte         | 4     | 4       | 0.6667    |",
            "| Sudeste       | 5     | 6       | 0.6000    |",
            "| Sul           | 3     | 3       | 1.0000    |",
            "",
            "## 3.3 Aeroportos Mais Conectados",
            "",
            "| Aeroporto | Grau |",
            "| GRU       | 12   |",
            "| BSB       | 11   |",
            "| SSA       | 6    |",
            "| REC       | 5    |",
            "| FOR       | 5    |",
            "",
            "## 3.4 Rotas Calculadas (Dijkstra)",
            "",
            "| Origem | Destino | Custo | Caminho               |",
            "| REC    | POA     | 4.0   | REC -> GRU -> POA     |",
            "| MAO    | GRU     | 2.0   | MAO -> GRU            |",
            "| FOR    | FLN     | 5.0   | FOR -> BSB -> CWB -> FLN |",
            "| BEL    | CNF     | 3.0   | BEL -> GRU -> CNF     |",
            "| NAT    | CWB     | 5.0   | NAT -> FOR -> BSB -> CWB |",
            "| RBR    | GIG     | 5.0   | RBR -> PVH -> BEL -> GRU -> GIG |",
            "| THE    | POA     | 5.0   | THE -> FOR -> GRU -> POA |",
        ])

        # --- VISUALIZACOES COM NOTAS ANALITICAS ---
        viz_notes = [
            ("viz_distribuicao_graus.png", "Distribuicao de Graus dos Aeroportos", [
                "O que mostra: histograma da frequencia de graus dos 20 aeroportos.",
                "Insight: distribuicao assimetrica — maioria tem grau baixo (1-5), GRU (12) e BSB (11)",
                "sao outliers, refletindo uma rede hub-and-spoke tipica de aviacao.",
                "Tipo de grafico: histograma — padrao para distribuicoes de frequencia.",
            ]),
            ("viz_ranking_conectados.png", "Ranking de Aeroportos por Grau", [
                "O que mostra: barras ordenadas por grau decrescente, mais conectado em vermelho.",
                "Insight: GRU lidera com grau 12 (60% dos aeroportos), seguido de BSB (11).",
                "Queda acentuada apos os hubs — o 3o (SSA, 6) tem metade do grau de GRU.",
                "Tipo de grafico: barras ordenadas — ideal para ranking e comparacao.",
            ]),
            ("viz_comparacao_regioes.png", "Comparacao entre Regioes", [
                "O que mostra: arestas intra-regionais e densidade por regiao, lado a lado.",
                "Insight: Sul e Centro-Oeste tem densidade 1.0 (todos conectados entre si),",
                "mas poucos aeroportos. Nordeste tem mais arestas (8) mas menor densidade (0.53).",
                "Tipo de grafico: barras agrupadas — permite comparacao direta em duas metricas.",
            ]),
            ("viz_bfs_camadas.png", "BFS em Camadas a partir de REC", [
                "O que mostra: arvore BFS com nos organizados por nivel.",
                "Insight: todos os aeroportos alcancaveis em no maximo 3 niveis a partir de REC.",
                "Nivel 1 inclui vizinhos diretos (SSA, NAT, JPA, GRU, BSB), nivel 2 alcanca quase tudo via hubs.",
                "Tipo de grafico: layout hierarquico em camadas — representa a estrutura de niveis da BFS.",
            ]),
        ]

        for img_file, caption, notes in viz_notes:
            _image_page(pdf, os.path.join(OUT_DIR, img_file), caption)
            _text_page(pdf, f"Nota Analitica — {caption}", notes, fontsize=10)

        # Nota sobre visualizacoes interativas
        _text_page(pdf, "Notas — Visualizacoes Interativas (HTML)", [
            "## Grafo Interativo (grafo_interativo.html)",
            "",
            "O que mostra: grafo completo com cores por regiao, tooltips (grau, regiao, densidade ego),",
            "caixa de busca por IATA e destaque dos caminhos obrigatorios em vermelho.",
            "Insight: GRU e BSB se destacam pelo tamanho dos nos. Regioes formam clusters visiveis.",
            "Tipo: rede interativa (pyvis) — permite exploracao livre, zoom e tooltips.",
            "",
            "## Arvore de Percurso (arvore_percurso.html)",
            "",
            "O que mostra: subgrafo com caminhos REC->POA (vermelho) e MAO->GRU (azul).",
            "Insight: ambos passam por GRU, confirmando sua centralidade.",
            "Tipo: rede interativa com cores por caminho — contrasta os dois percursos.",
            "",
            "## Subgrafo dos Hubs (viz_hubs_subgrafo.html)",
            "",
            "O que mostra: subgrafo dos 6 aeroportos com maior grau e seus vizinhos.",
            "Insight: visualiza a 'espinha dorsal' da rede — GRU e BSB como nucleo central.",
            "Tipo: rede interativa — revela a topologia dos nos mais influentes.",
        ])

        # --- PARTE 2 ---
        _text_page(pdf, "4. Parte 2 — Dataset Maior (Facebook Ego)", [
            "## 4.1 Descricao do Dataset",
            "",
            "| Metrica  | Valor                    |",
            "| Nome     | Facebook Ego (SNAP)      |",
            "| Nos      | 4.039                    |",
            "| Arestas  | 88.234                   |",
            "| Tipo     | Nao-direcionado          |",
            "| Descricao| Rede social — circulos de amizade |",
            "",
            "## 4.2 Resultados — BFS (3 fontes)",
            "",
            "| Fonte | Nos visitados | Niveis | Tempo   |",
            "| 0     | 4039          | 6      | 22.1ms  |",
            "| 107   | 4039          | 5      | 32.3ms  |",
            "| 1684  | 4039          | 5      | 19.1ms  |",
            "",
            "Todos os nos foram alcancados. Diametro maximo de 6 niveis — consistente com",
            "'6 graus de separacao' em redes sociais.",
            "",
            "## 4.3 Resultados — DFS (3 fontes)",
            "",
            "| Fonte | Ciclo | Tempo    |",
            "| 0     | Sim   | 160.3ms  |",
            "| 107   | Sim   | 200.3ms  |",
            "| 1684  | Sim   | 175.7ms  |",
            "",
            "Ciclos detectados em todas as fontes — esperado em rede social densa.",
            "",
            "## 4.4 Resultados — Dijkstra (5 pares)",
            "",
            "| Origem | Destino | Custo | Saltos | Tempo   |",
            "| 0      | 100     | 1.0   | 2      | 80.7ms  |",
            "| 0      | 3000    | 3.0   | 4      | 77.8ms  |",
            "| 107    | 1684    | 1.0   | 2      | 77.9ms  |",
            "| 200    | 4000    | 6.0   | 7      | 79.0ms  |",
            "| 500    | 3500    | 4.0   | 5      | 79.6ms  |",
            "",
            "## 4.5 Resultados — Bellman-Ford",
            "",
            "Caso 1: Subgrafo com 50 nos e pesos negativos (sem ciclo negativo).",
            "  Resultado: ciclo_negativo = False. Tempo: 0.07ms.",
            "",
            "Caso 2: Grafo construido com ciclo negativo (X->Y->Z->X, soma = -1).",
            "  Resultado: ciclo_negativo = True. Tempo: 0.01ms.",
        ])

        # Visualizacoes Parte 2
        _image_page(pdf, os.path.join(OUT_DIR, "parte2_viz_graus_facebook.png"),
                    "Distribuicao de Graus — Facebook Ego")

        _text_page(pdf, "Nota Analitica — Distribuicao de Graus (Facebook)", [
            "O que mostra: histograma e grafico log-log da distribuicao de graus.",
            "Insight: segue aproximadamente uma power law — poucos nos tem grau muito alto",
            "(hubs sociais) enquanto a maioria tem poucos amigos. O grafico log-log confirma",
            "a relacao linear, caracteristica de redes livres de escala (scale-free networks).",
            "Tipo: histograma + scatter log-log — histograma mostra a forma, log-log confirma o padrao.",
        ])

        _image_page(pdf, os.path.join(OUT_DIR, "parte2_viz_comparacao_algos.png"),
                    "Comparacao de Algoritmos — Tempo de Execucao")

        _text_page(pdf, "Nota Analitica — Comparacao de Algoritmos", [
            "O que mostra: tempo medio de BFS, DFS e Dijkstra + detalhamento do Dijkstra por par.",
            "Insight: BFS eh ~8x mais rapido que DFS (24ms vs 179ms) neste grafo denso.",
            "Dijkstra (~79ms) fica entre os dois, com overhead da fila de prioridade.",
            "Tipo: barras — formato intuitivo para comparacao quantitativa entre categorias.",
        ])

        # --- DISCUSSAO CRITICA ---
        _text_page(pdf, "5. Discussao Critica", [
            "## Quando usar cada algoritmo",
            "",
            "| Cenario                           | Recomendado  | Justificativa                       |",
            "| Menor numero de saltos            | BFS          | O(V+E), caminho com menos arestas   |",
            "| Detectar ciclos                   | DFS          | Classifica arestas, back edges      |",
            "| Caminho mais barato (pesos >= 0)  | Dijkstra     | O((V+E)logV), otimo para positivos  |",
            "| Pesos negativos possiveis         | Bellman-Ford | O(V*E), unico com pesos negativos   |",
            "| Grafo muito grande (>100k nos)    | BFS/Dijkstra | DFS lento; BF impraticavel          |",
            "",
            "## Limitacoes do design de pesos",
            "",
            "Na Parte 1, os pesos sao discretos (1.0, 2.0, 2.5), limitando a granularidade.",
            "Em cenarios reais, distancias em km ou precos de passagem dariam resultados mais ricos.",
            "",
            "Na Parte 2, o dataset Facebook usa pesos uniformes (1.0), fazendo BFS e Dijkstra",
            "retornarem os mesmos caminhos — a diferenca eh apenas de desempenho.",
            "",
            "Bellman-Ford foi testado em subgrafos construidos por limitacao do dataset original.",
            "",
            "## Analise Exploratoria vs Explanatoria (AVD)",
            "",
            "### Visualizacoes Exploratorias",
            "1. Distribuicao de graus: exploracao inicial da forma da rede — padrao hub-and-spoke.",
            "2. BFS em camadas: exploracao de acessibilidade — todos alcancaveis em 3 niveis.",
            "",
            "### Visualizacoes Explanatorias",
            "1. Ranking de aeroportos: comunica claramente os hubs dominantes (GRU e BSB).",
            "2. Comparacao entre regioes: comunica diferenca de conectividade entre regioes.",
            "",
            "### Padroes Identificados",
            "- Hub-and-spoke: GRU e BSB concentram >50% das conexoes.",
            "- Assimetria regional: Nordeste tem mais aeroportos mas menor densidade.",
            "- Mundo pequeno: qualquer aeroporto alcancavel em no maximo 3 saltos.",
        ])

    print(f"PDF gerado em: {PDF_PATH}")


if __name__ == "__main__":
    generate_pdf()
