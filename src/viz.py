from __future__ import annotations

import os
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from pyvis.network import Network

from src.graphs.graph import Graph
from src.graphs.algorithms import bfs, dijkstra, reconstruct_path
from src.graphs.io import load_rotas, load_airports
from src.solve import compute_region_metrics, compute_ego_networks, compute_graus


REGION_COLORS = {
    "Nordeste": "#e74c3c",
    "Sudeste": "#3498db",
    "Centro-Oeste": "#f39c12",
    "Sul": "#2ecc71",
    "Norte": "#9b59b6",
}


def _airport_region_map(airports: list[dict]) -> dict[str, str]:
    return {ap["iata"]: ap["regiao"] for ap in airports}


def generate_grafo_interativo(
    graph: Graph, airports: list[dict], out_dir: str, paths: list[list[str]] | None = None
) -> None:
    region_map = _airport_region_map(airports)
    ego_data = {r["aeroporto"]: r for r in compute_ego_networks(graph)}

    net = Network(height="700px", width="100%", bgcolor="#ffffff", font_color="black")
    net.barnes_hut(gravity=-3000, central_gravity=0.3, spring_length=150)

    for node in graph.nodes():
        regiao = region_map.get(node, "?")
        color = REGION_COLORS.get(regiao, "#95a5a6")
        grau = graph.degree(node)
        ego = ego_data.get(node, {})
        title = (
            f"<b>{node}</b><br>"
            f"Regiao: {regiao}<br>"
            f"Grau: {grau}<br>"
            f"Densidade ego: {ego.get('densidade_ego', '?')}"
        )
        net.add_node(node, label=node, title=title, color=color, size=10 + grau * 3)

    path_edges: set[tuple[str, str]] = set()
    if paths:
        for path in paths:
            for i in range(len(path) - 1):
                path_edges.add((path[i], path[i + 1]))
                path_edges.add((path[i + 1], path[i]))

    for u, v, w in graph.edges():
        color = "#e74c3c" if (u, v) in path_edges else "#cccccc"
        width = 4 if (u, v) in path_edges else 1
        net.add_edge(u, v, value=w, title=f"Peso: {w}", color=color, width=width)

    net.set_options("""
    {
      "interaction": {
        "navigationButtons": true,
        "keyboard": true
      },
      "physics": {
        "barnesHut": {
          "gravitationalConstant": -3000,
          "centralGravity": 0.3,
          "springLength": 150
        }
      }
    }
    """)

    out_path = os.path.join(out_dir, "grafo_interativo.html")
    net.save_graph(out_path)

    _inject_search_box(out_path)


def _inject_search_box(html_path: str) -> None:
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    search_html = """
    <div style="position:fixed;top:10px;left:10px;z-index:9999;background:white;padding:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);">
      <input id="searchBox" type="text" placeholder="Buscar aeroporto (IATA)..." style="padding:6px;font-size:14px;border:1px solid #ccc;border-radius:4px;">
      <button onclick="searchNode()" style="padding:6px 12px;font-size:14px;cursor:pointer;">Buscar</button>
      <div style="margin-top:5px;font-size:11px;">
        <span style="color:#e74c3c;">&#9632; Nordeste</span>
        <span style="color:#3498db;">&#9632; Sudeste</span>
        <span style="color:#f39c12;">&#9632; Centro-Oeste</span>
        <span style="color:#2ecc71;">&#9632; Sul</span>
        <span style="color:#9b59b6;">&#9632; Norte</span>
        | <span style="color:#e74c3c;">&#9644; Caminhos obrigatorios</span>
      </div>
    </div>
    <script>
    function searchNode() {
      var val = document.getElementById("searchBox").value.toUpperCase().trim();
      if (val && network) {
        var nodeIds = nodes.getIds();
        var found = nodeIds.find(function(id) { return id.toUpperCase() === val; });
        if (found) {
          network.focus(found, {scale: 1.5, animation: true});
          network.selectNodes([found]);
        } else {
          alert("Aeroporto nao encontrado: " + val);
        }
      }
    }
    document.getElementById("searchBox").addEventListener("keypress", function(e) {
      if (e.key === "Enter") searchNode();
    });
    </script>
    """
    content = content.replace("</body>", search_html + "\n</body>")
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(content)


def generate_arvore_percurso(
    graph: Graph, airports: list[dict], out_dir: str
) -> None:
    region_map = _airport_region_map(airports)
    rotas_obrigatorias = [("REC", "POA"), ("MAO", "GRU")]
    all_paths: list[list[str]] = []

    for orig, dest in rotas_obrigatorias:
        dist, prev = dijkstra(graph, orig)
        path = reconstruct_path(prev, orig, dest)
        if path:
            all_paths.append(path)

    all_nodes: set[str] = set()
    all_edges: set[tuple[str, str]] = set()
    for path in all_paths:
        for node in path:
            all_nodes.add(node)
        for i in range(len(path) - 1):
            all_edges.add((path[i], path[i + 1]))

    net = Network(height="600px", width="100%", bgcolor="#ffffff", font_color="black", directed=False)

    path_colors = ["#e74c3c", "#2980b9"]
    for node in all_nodes:
        regiao = region_map.get(node, "?")
        color = REGION_COLORS.get(regiao, "#95a5a6")
        net.add_node(node, label=node, color=color, size=25, font={"size": 16})

    for idx, path in enumerate(all_paths):
        color = path_colors[idx % len(path_colors)]
        label = f"{path[0]}→{path[-1]}"
        for i in range(len(path) - 1):
            net.add_edge(path[i], path[i + 1], color=color, width=5, title=label)

    out_path = os.path.join(out_dir, "arvore_percurso.html")
    net.save_graph(out_path)

    with open(out_path, "r", encoding="utf-8") as f:
        content = f.read()
    legend = """
    <div style="position:fixed;top:10px;left:10px;z-index:9999;background:white;padding:10px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,0.2);font-size:13px;">
      <b>Arvore de Percurso</b><br>
      <span style="color:#e74c3c;">&#9644; REC → POA</span><br>
      <span style="color:#2980b9;">&#9644; MAO → GRU</span>
    </div>
    """
    content = content.replace("</body>", legend + "\n</body>")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)

    return all_paths


def generate_distribuicao_graus(graph: Graph, out_dir: str) -> None:
    graus = [graph.degree(n) for n in graph.nodes()]
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.hist(graus, bins=range(min(graus), max(graus) + 2), edgecolor="black", color="#3498db", alpha=0.8)
    ax.set_title("Distribuicao de Graus dos Aeroportos")
    ax.set_xlabel("Grau")
    ax.set_ylabel("Frequencia")
    ax.legend(["Aeroportos"])
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "viz_distribuicao_graus.png"), dpi=150)
    plt.close(fig)


def generate_ranking_conectados(graph: Graph, out_dir: str) -> None:
    graus_data = compute_graus(graph)
    nomes = [r["aeroporto"] for r in graus_data]
    valores = [r["grau"] for r in graus_data]

    fig, ax = plt.subplots(figsize=(10, 5))
    colors = ["#e74c3c" if v == max(valores) else "#3498db" for v in valores]
    ax.bar(nomes, valores, color=colors, edgecolor="black")
    ax.set_title("Ranking de Aeroportos por Grau (Decrescente)")
    ax.set_xlabel("Aeroporto (IATA)")
    ax.set_ylabel("Grau")
    ax.legend(["Mais conectado", "Demais"])
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "viz_ranking_conectados.png"), dpi=150)
    plt.close(fig)


def generate_comparacao_regioes(
    graph: Graph, airports: list[dict], out_dir: str
) -> None:
    regioes = compute_region_metrics(graph, airports)
    nomes = [r["regiao"] for r in regioes]
    tamanhos = [r["tamanho"] for r in regioes]
    densidades = [r["densidade"] for r in regioes]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 5))

    colors = [REGION_COLORS.get(n, "#95a5a6") for n in nomes]
    ax1.bar(nomes, tamanhos, color=colors, edgecolor="black")
    ax1.set_title("Numero de Arestas por Regiao")
    ax1.set_xlabel("Regiao")
    ax1.set_ylabel("Tamanho (|E|)")

    ax2.bar(nomes, densidades, color=colors, edgecolor="black")
    ax2.set_title("Densidade por Regiao")
    ax2.set_xlabel("Regiao")
    ax2.set_ylabel("Densidade")

    fig.suptitle("Comparacao entre Regioes", fontsize=14, fontweight="bold")
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "viz_comparacao_regioes.png"), dpi=150)
    plt.close(fig)


def generate_hubs_subgrafo(graph: Graph, airports: list[dict], out_dir: str) -> None:
    region_map = _airport_region_map(airports)
    graus = [(n, graph.degree(n)) for n in graph.nodes()]
    graus.sort(key=lambda x: x[1], reverse=True)
    top_nodes = {n for n, _ in graus[:6]}

    for n in top_nodes.copy():
        for v, _ in graph.neighbors(n):
            if v in top_nodes:
                continue
            top_nodes.add(v)
    sub = graph.subgraph(top_nodes)

    net = Network(height="600px", width="100%", bgcolor="#ffffff", font_color="black")
    hub_set = {n for n, _ in graus[:6]}
    for node in sub.nodes():
        regiao = region_map.get(node, "?")
        color = REGION_COLORS.get(regiao, "#95a5a6")
        size = 30 if node in hub_set else 15
        border = "#000000" if node in hub_set else color
        net.add_node(node, label=node, color=color, size=size,
                     borderWidth=3 if node in hub_set else 1,
                     font={"size": 14 if node in hub_set else 10})

    for u, v, w in sub.edges():
        net.add_edge(u, v, title=f"Peso: {w}")

    out_path = os.path.join(out_dir, "viz_hubs_subgrafo.html")
    net.save_graph(out_path)


def generate_bfs_camadas(graph: Graph, source: str, out_dir: str) -> None:
    result = bfs(graph, source)
    max_level = max(info["level"] for info in result.values())

    fig, ax = plt.subplots(figsize=(12, 6))
    for level in range(max_level + 1):
        nodes_at_level = [n for n, info in result.items() if info["level"] == level]
        for i, node in enumerate(nodes_at_level):
            x = i - len(nodes_at_level) / 2
            y = -level
            ax.scatter(x, y, s=400, zorder=5, color="#3498db", edgecolors="black")
            ax.annotate(node, (x, y), ha="center", va="center", fontsize=8, fontweight="bold")

            parent = result[node]["parent"]
            if parent:
                parent_level = result[parent]["level"]
                parent_nodes = [n for n, info in result.items() if info["level"] == parent_level]
                pi = parent_nodes.index(parent)
                px = pi - len(parent_nodes) / 2
                py = -parent_level
                ax.annotate("", xy=(x, y + 0.15), xytext=(px, py - 0.15),
                           arrowprops=dict(arrowstyle="->", color="#7f8c8d", lw=1.5))

    ax.set_title(f"BFS em Camadas a partir de {source}")
    ax.set_xlabel("Posicao na Camada")
    ax.set_ylabel("Nivel BFS")
    ax.set_yticks(range(0, -(max_level + 1), -1))
    ax.set_yticklabels(range(0, max_level + 1))
    ax.legend(["Aeroportos"])
    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "viz_bfs_camadas.png"), dpi=150)
    plt.close(fig)


def generate_all_visualizations(
    graph: Graph, airports: list[dict], dataset_path: str, out_dir: str
) -> None:
    data_dir = str(Path(dataset_path).parent)
    rotas_path = os.path.join(data_dir, "rotas.csv")

    obligatory_paths: list[list[str]] = []
    for orig, dest in [("REC", "POA"), ("MAO", "GRU")]:
        dist, prev = dijkstra(graph, orig)
        path = reconstruct_path(prev, orig, dest)
        if path:
            obligatory_paths.append(path)

    print("  Gerando grafo interativo...")
    generate_grafo_interativo(graph, airports, out_dir, obligatory_paths)

    print("  Gerando arvore de percurso...")
    generate_arvore_percurso(graph, airports, out_dir)

    print("  Gerando distribuicao de graus...")
    generate_distribuicao_graus(graph, out_dir)

    print("  Gerando ranking de conectados...")
    generate_ranking_conectados(graph, out_dir)

    print("  Gerando comparacao de regioes...")
    generate_comparacao_regioes(graph, airports, out_dir)

    print("  Gerando subgrafo dos hubs...")
    generate_hubs_subgrafo(graph, airports, out_dir)

    print("  Gerando BFS em camadas...")
    generate_bfs_camadas(graph, "REC", out_dir)

    print("Todas as visualizacoes geradas!")
