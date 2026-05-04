from __future__ import annotations

import os
import sys
import time

import streamlit as st
import streamlit.components.v1 as components
import matplotlib.pyplot as plt

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.graphs.graph import Graph
from src.graphs.io import (
    load_airports,
    load_adjacencias,
    load_rotas,
    load_edge_list,
    build_graph_from_adjacencias,
)
from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford, reconstruct_path
from src.solve import (
    compute_global_metrics,
    compute_region_metrics,
    compute_ego_networks,
    compute_graus,
)


st.set_page_config(page_title="Grafos — Aeroportos BR", layout="wide")
st.title("Rede de Aeroportos do Brasil")
st.caption("Projeto Final — Teoria dos Grafos + AVD | Cesar School")

REGION_COLORS = {
    "Nordeste": "#e74c3c",
    "Sudeste": "#3498db",
    "Centro-Oeste": "#f39c12",
    "Sul": "#2ecc71",
    "Norte": "#9b59b6",
}

dataset_option = st.sidebar.selectbox(
    "Dataset",
    ["Parte 1 — Aeroportos BR", "Parte 2 — Facebook Ego"],
)

if dataset_option == "Parte 1 — Aeroportos BR":
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
    airports = load_airports(os.path.join(data_dir, "aeroportos_data.csv"))
    adjacencias = load_adjacencias(os.path.join(data_dir, "adjacencias_aeroportos.csv"))
    graph = build_graph_from_adjacencias(airports, adjacencias)
    region_map = {ap["iata"]: ap["regiao"] for ap in airports}
    is_parte1 = True
else:
    data_dir = os.path.join(os.path.dirname(__file__), "..", "data", "dataset_parte2")
    graph = load_edge_list(os.path.join(data_dir, "facebook_combined.txt"))
    airports = []
    region_map = {}
    is_parte1 = False

st.sidebar.markdown("---")
st.sidebar.subheader("Algoritmo")
alg = st.sidebar.selectbox("Escolha", ["BFS", "DFS", "Dijkstra", "Bellman-Ford"])

nodes_list = sorted(graph.nodes(), key=lambda x: (not x.isdigit(), x))

source = st.sidebar.selectbox("Origem", nodes_list, index=0)
target = None
if alg in ("Dijkstra", "Bellman-Ford"):
    default_target = nodes_list[min(5, len(nodes_list) - 1)]
    target = st.sidebar.selectbox("Destino", nodes_list, index=nodes_list.index(default_target))


def _build_dynamic_graph(g: Graph, airports: list[dict], algorithm: str, src: str, tgt: str | None) -> str:
    from pyvis.network import Network as PyvisNet
    import tempfile

    rmap = {ap["iata"]: ap["regiao"] for ap in airports} if airports else {}
    ego_data = {r["aeroporto"]: r for r in compute_ego_networks(g)} if airports else {}

    highlight_nodes: set[str] = set()
    highlight_edges: set[tuple[str, str]] = set()
    path_label = ""
    path_detail = ""

    if algorithm in ("BFS", "DFS"):
        result = bfs(g, src) if algorithm == "BFS" else None
        highlight_nodes = {src}
        if result:
            for node, info in result.items():
                if info["level"] <= 2:
                    highlight_nodes.add(node)
        path_label = f"{algorithm} a partir de {src}"
        path_detail = f"Nós destacados: nível ≤ 2 a partir de {src}"
    elif algorithm in ("Dijkstra", "Bellman-Ford") and tgt:
        if algorithm == "Dijkstra":
            dist, prev = dijkstra(g, src)
        else:
            dist, prev, _ = bellman_ford(g, src)
        path = reconstruct_path(prev, src, tgt)
        if path:
            highlight_nodes = set(path)
            for i in range(len(path) - 1):
                highlight_edges.add((path[i], path[i + 1]))
                highlight_edges.add((path[i + 1], path[i]))
            path_label = f"{algorithm}: {src} → {tgt}"
            custo = dist.get(tgt, float("inf"))
            path_detail = f"{'  →  '.join(path)}<br>Custo: {custo:.1f} | Saltos: {len(path) - 1}"

    net = PyvisNet(height="700px", width="100%", bgcolor="#1a1a2e", font_color="white")
    net.barnes_hut(gravity=-8000, central_gravity=0.2, spring_length=300)

    for node in g.nodes():
        regiao = rmap.get(node, "?")
        color = REGION_COLORS.get(regiao, "#95a5a6")
        grau = g.degree(node)
        ego = ego_data.get(node, {})
        cidade = next((ap["cidade"] for ap in airports if ap["iata"] == node), "?") if airports else node
        title = (
            f"<b style='font-size:14px;'>{node}</b><br>"
            f"<b>Cidade:</b> {cidade}<br>"
            f"<b>Região:</b> {regiao}<br>"
            f"<b>Grau:</b> {grau}<br>"
            f"<b>Densidade ego:</b> {ego.get('densidade_ego', '?')}"
        )
        is_on_path = node in highlight_nodes
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
                           "strokeWidth": 2, "strokeColor": "#000000",
                           "bold": {"color": "#ff6b6b"} if is_on_path else {}})

    for u, v, w in g.edges():
        is_path = (u, v) in highlight_edges
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

    with tempfile.NamedTemporaryFile(suffix=".html", delete=False, mode="w") as f:
        net.save_graph(f.name)
        with open(f.name, "r") as rf:
            html = rf.read()

    legend = f"""
    <div style="position:fixed;top:12px;left:12px;z-index:9999;background:rgba(26,26,46,0.95);padding:14px 18px;border-radius:12px;box-shadow:0 4px 20px rgba(0,0,0,0.4);color:white;font-family:sans-serif;max-width:340px;">
      <div style="font-size:15px;font-weight:bold;margin-bottom:8px;">🛫 {path_label}</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;font-size:12px;">
        <span style="color:#e74c3c;">● Nordeste</span>
        <span style="color:#3498db;">● Sudeste</span>
        <span style="color:#f39c12;">● Centro-Oeste</span>
        <span style="color:#2ecc71;">● Sul</span>
        <span style="color:#9b59b6;">● Norte</span>
      </div>
      <div style="border-top:1px solid #ffffff22;padding-top:8px;font-size:12px;">
        <span style="color:#ff6b6b;font-size:16px;">━━</span> <b>Caminho destacado</b><br>
        <span style="font-size:11px;color:#bbb;">{path_detail}</span>
      </div>
      <div style="margin-top:6px;font-size:10px;color:#888;">Tamanho do nó = grau de conexão</div>
    </div>
    """
    html = html.replace("</body>", legend + "\n</body>")
    return html


def run_algorithm():
    t0 = time.perf_counter()

    if alg == "BFS":
        result = bfs(graph, source)
        elapsed = (time.perf_counter() - t0) * 1000
        st.success(f"BFS concluído em {elapsed:.1f}ms — {len(result)} nós visitados")
        max_level = max(info["level"] for info in result.values())
        st.metric("Níveis", max_level)
        if is_parte1 or graph.order() <= 5000:
            data = [{"nó": n, "nível": info["level"], "pai": info["parent"] or "-"}
                    for n, info in sorted(result.items(), key=lambda x: x[1]["level"])]
            st.dataframe(data, width="stretch")

    elif alg == "DFS":
        result = dfs(graph, source)
        elapsed = (time.perf_counter() - t0) * 1000
        st.success(f"DFS concluído em {elapsed:.1f}ms")
        st.metric("Ciclo detectado", "Sim" if result["has_cycle"] else "Não")
        back_edges = [(u, v) for u, v, t in result["edge_types"] if t == "back"]
        if back_edges:
            st.write(f"Back edges encontradas: {len(back_edges)}")
        if is_parte1 or graph.order() <= 5000:
            data = [{"nó": n, "descoberta": info["discovery"], "finalização": info["finish"],
                     "pai": info["parent"] or "-"}
                    for n, info in sorted(result["nodes"].items(), key=lambda x: x[1]["discovery"])]
            st.dataframe(data, width="stretch")

    elif alg == "Dijkstra":
        dist, prev = dijkstra(graph, source)
        elapsed = (time.perf_counter() - t0) * 1000
        path = reconstruct_path(prev, source, target)
        custo = dist.get(target, float("inf"))
        st.success(f"Dijkstra concluído em {elapsed:.1f}ms")
        col1, col2 = st.columns(2)
        col1.metric("Custo", f"{custo:.1f}")
        col2.metric("Saltos", len(path) - 1 if path else 0)
        if path:
            st.info(f"Caminho: **{'  →  '.join(path)}**")
        else:
            st.error("Nenhum caminho encontrado")

    elif alg == "Bellman-Ford":
        dist, prev, has_neg = bellman_ford(graph, source)
        elapsed = (time.perf_counter() - t0) * 1000
        st.success(f"Bellman-Ford concluído em {elapsed:.1f}ms")
        st.metric("Ciclo negativo", "Sim" if has_neg else "Não")
        if target and not has_neg:
            path = reconstruct_path(prev, source, target)
            custo = dist.get(target, float("inf"))
            st.metric("Custo", f"{custo:.1f}")
            if path:
                st.info(f"Caminho: **{'  →  '.join(path)}**")


if is_parte1:
    tab_metrics, tab_alg, tab_viz = st.tabs(["Métricas", "Algoritmos", "Visualizações"])

    with tab_metrics:
        col1, col2, col3 = st.columns(3)
        gm = compute_global_metrics(graph)
        col1.metric("Ordem (|V|)", gm["ordem"])
        col2.metric("Tamanho (|E|)", gm["tamanho"])
        col3.metric("Densidade", f"{gm['densidade']:.4f}")

        st.subheader("Métricas por Região")
        rm = compute_region_metrics(graph, airports)
        st.dataframe(rm, width="stretch")

        st.subheader("Ego-Networks")
        ego = compute_ego_networks(graph)
        st.dataframe(ego, width="stretch")

        st.subheader("Ranking de Graus")
        graus = compute_graus(graph)
        fig, ax = plt.subplots(figsize=(10, 4))
        nomes = [r["aeroporto"] for r in graus]
        vals = [r["grau"] for r in graus]
        colors = [REGION_COLORS.get(region_map.get(n, ""), "#95a5a6") for n in nomes]
        ax.bar(nomes, vals, color=colors, edgecolor="black")
        ax.set_ylabel("Grau")
        ax.set_title("Aeroportos por Grau (Decrescente)")
        st.pyplot(fig)
        plt.close(fig)

    with tab_alg:
        st.subheader(f"{alg} — {source}" + (f" → {target}" if target else ""))
        run_algorithm()

    with tab_viz:
        st.subheader("Visualizações Geradas")
        out_dir = os.path.join(os.path.dirname(__file__), "..", "out")

        col1, col2 = st.columns(2)
        for img_file, label in [
            ("viz_distribuicao_graus.png", "Distribuição de Graus"),
            ("viz_ranking_conectados.png", "Ranking de Conectados"),
            ("viz_comparacao_regioes.png", "Comparação entre Regiões"),
            ("viz_bfs_camadas.png", "BFS em Camadas (REC)"),
        ]:
            path = os.path.join(out_dir, img_file)
            if os.path.exists(path):
                col = col1 if label in ("Distribuição de Graus", "Comparação entre Regiões") else col2
                col.image(path, caption=label, width="stretch")

        st.subheader(f"Grafo Interativo — {alg}: {source}" + (f" → {target}" if target else ""))
        components.html(_build_dynamic_graph(graph, airports, alg, source, target), height=750, scrolling=True)

else:
    tab_alg, tab_viz = st.tabs(["Algoritmos", "Visualizações"])

    with tab_alg:
        col1, col2, col3 = st.columns(3)
        col1.metric("Nós", graph.order())
        col2.metric("Arestas", graph.size())
        col3.metric("Dataset", "Facebook Ego (SNAP)")

        st.subheader(f"{alg} — {source}" + (f" → {target}" if target else ""))
        run_algorithm()

    with tab_viz:
        out_dir = os.path.join(os.path.dirname(__file__), "..", "out")
        col1, col2 = st.columns(2)
        for img_file, label in [
            ("parte2_viz_graus_facebook.png", "Distribuição de Graus — Facebook"),
            ("parte2_viz_comparacao_algos.png", "Comparação de Algoritmos"),
        ]:
            path = os.path.join(out_dir, img_file)
            if os.path.exists(path):
                col = col1 if "Graus" in label else col2
                col.image(path, caption=label, width="stretch")
