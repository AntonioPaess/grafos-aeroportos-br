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

    net = Network(height="750px", width="100%", bgcolor="#1a1a2e", font_color="white")
    net.barnes_hut(gravity=-8000, central_gravity=0.2, spring_length=300)

    path_nodes: set[str] = set()
    path_edges: set[tuple[str, str]] = set()
    path_labels: list[str] = []
    if paths:
        for path in paths:
            path_labels.append(f"{path[0]} → {path[-1]}")
            for node in path:
                path_nodes.add(node)
            for i in range(len(path) - 1):
                path_edges.add((path[i], path[i + 1]))
                path_edges.add((path[i + 1], path[i]))

    for node in graph.nodes():
        regiao = region_map.get(node, "?")
        color = REGION_COLORS.get(regiao, "#95a5a6")
        grau = graph.degree(node)
        ego = ego_data.get(node, {})
        title = (
            f"<b style='font-size:14px;'>{node}</b><br>"
            f"<b>Cidade:</b> {next((ap['cidade'] for ap in airports if ap['iata'] == node), '?')}<br>"
            f"<b>Região:</b> {regiao}<br>"
            f"<b>Grau:</b> {grau}<br>"
            f"<b>Densidade ego:</b> {ego.get('densidade_ego', '?')}<br>"
            f"<b>Ordem ego:</b> {ego.get('ordem_ego', '?')}"
        )
        is_on_path = node in path_nodes
        if is_on_path:
            node_color = {"background": color, "border": "#ff6b6b",
                          "highlight": {"background": color, "border": "#ff0000"}}
            border_width = 4
            node_size = 25 + grau * 4
        else:
            node_color = {"background": color, "border": "#ffffff33",
                          "highlight": {"background": color, "border": "#ffffff"}}
            border_width = 1
            node_size = 12 + grau * 3
        net.add_node(node, label=node, title=title, color=node_color,
                     size=node_size, borderWidth=border_width,
                     borderWidthSelected=4,
                     font={"size": 16 if is_on_path else 12, "color": "white",
                           "strokeWidth": 2, "strokeColor": "#000000"})

    for u, v, w in graph.edges():
        is_path = (u, v) in path_edges
        edge_color = "#ff6b6b" if is_path else "#ffffff22"
        width = 4 if is_path else 0.5
        net.add_edge(u, v, value=w, title=f"Peso: {w}", color=edge_color, width=width)

    net.set_options("""
    {
      "interaction": {
        "navigationButtons": true,
        "keyboard": true,
        "hover": true,
        "tooltipDelay": 100
      },
      "physics": {
        "barnesHut": {
          "gravitationalConstant": -8000,
          "centralGravity": 0.2,
          "springLength": 300,
          "damping": 0.12
        }
      }
    }
    """)

    out_path = os.path.join(out_dir, "grafo_interativo.html")
    net.save_graph(out_path)

    _inject_ui(out_path, path_labels, paths)


def _inject_ui(html_path: str, path_labels: list[str], paths: list[list[str]] | None) -> None:
    with open(html_path, "r", encoding="utf-8") as f:
        content = f.read()

    paths_html = ""
    path_colors_legend = ["#ff6b6b", "#6bcfff"]
    if paths:
        for i, (label, path) in enumerate(zip(path_labels, paths)):
            color = path_colors_legend[i % len(path_colors_legend)]
            custo_str = " → ".join(path)
            paths_html += f'<div style="margin-top:4px;"><span style="color:{color};font-size:16px;">━━</span> <b>{label}</b><br><span style="font-size:11px;color:#bbb;">{custo_str}</span></div>'

    ui_html = f"""
    <div id="legend" style="position:fixed;top:12px;left:12px;z-index:9999;background:rgba(26,26,46,0.95);padding:14px 18px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.4);color:white;font-family:sans-serif;max-width:320px;">
      <div style="font-size:16px;font-weight:bold;margin-bottom:8px;">🛫 Rede de Aeroportos do Brasil</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;">
        <span style="color:#e74c3c;">● Nordeste</span>
        <span style="color:#3498db;">● Sudeste</span>
        <span style="color:#f39c12;">● Centro-Oeste</span>
        <span style="color:#2ecc71;">● Sul</span>
        <span style="color:#9b59b6;">● Norte</span>
      </div>
      <div style="border-top:1px solid #ffffff22;padding-top:8px;margin-bottom:8px;">
        <b>Caminhos obrigatórios (Dijkstra):</b>
        {paths_html}
      </div>
      <div style="border-top:1px solid #ffffff22;padding-top:8px;">
        <input id="searchBox" type="text" placeholder="Buscar aeroporto (IATA)..."
               style="padding:6px 10px;font-size:13px;border:1px solid #555;border-radius:6px;background:#2a2a4a;color:white;width:180px;">
        <button onclick="searchNode()"
                style="padding:6px 14px;font-size:13px;cursor:pointer;border:none;border-radius:6px;background:#e74c3c;color:white;margin-left:4px;">Buscar</button>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#888;">Tamanho do nó = grau de conexão</div>
    </div>
    <script>
    function searchNode() {{
      var val = document.getElementById("searchBox").value.toUpperCase().trim();
      if (val && network) {{
        var nodeIds = nodes.getIds();
        var found = nodeIds.find(function(id) {{ return id.toUpperCase() === val; }});
        if (found) {{
          network.focus(found, {{scale: 1.8, animation: true}});
          network.selectNodes([found]);
        }} else {{
          alert("Aeroporto não encontrado: " + val);
        }}
      }}
    }}
    document.getElementById("searchBox").addEventListener("keypress", function(e) {{
      if (e.key === "Enter") searchNode();
    }});
    </script>
    """
    content = content.replace("</body>", ui_html + "\n</body>")
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
      <b>Árvore de Percurso</b><br>
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
    ax.set_title("Distribuição de Graus dos Aeroportos")
    ax.set_xlabel("Grau")
    ax.set_ylabel("Frequência")
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
    ax1.set_title("Número de Arestas por Região")
    ax1.set_xlabel("Região")
    ax1.set_ylabel("Tamanho (|E|)")

    ax2.bar(nomes, densidades, color=colors, edgecolor="black")
    ax2.set_title("Densidade por Região")
    ax2.set_xlabel("Região")
    ax2.set_ylabel("Densidade")

    fig.suptitle("Comparação entre Regiões", fontsize=14, fontweight="bold")
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
    ax.set_xlabel("Posição na Camada")
    ax.set_ylabel("Nível BFS")
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

    print("  Gerando árvore de percurso...")
    generate_arvore_percurso(graph, airports, out_dir)

    print("  Gerando distribuição de graus...")
    generate_distribuicao_graus(graph, out_dir)

    print("  Gerando ranking de conectados...")
    generate_ranking_conectados(graph, out_dir)

    print("  Gerando comparação de regiões...")
    generate_comparacao_regioes(graph, airports, out_dir)

    print("  Gerando subgrafo dos hubs...")
    generate_hubs_subgrafo(graph, airports, out_dir)

    print("  Gerando BFS em camadas...")
    generate_bfs_camadas(graph, "REC", out_dir)

    print("Todas as visualizações geradas!")
