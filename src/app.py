from __future__ import annotations

import os
import sys
import time

import streamlit as st
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

run = st.sidebar.button("Executar", type="primary")

# --- Metricas ---
if is_parte1:
    tab_metrics, tab_alg, tab_viz = st.tabs(["Metricas", "Algoritmos", "Visualizacoes"])

    with tab_metrics:
        col1, col2, col3 = st.columns(3)
        gm = compute_global_metrics(graph)
        col1.metric("Ordem (|V|)", gm["ordem"])
        col2.metric("Tamanho (|E|)", gm["tamanho"])
        col3.metric("Densidade", f"{gm['densidade']:.4f}")

        st.subheader("Metricas por Regiao")
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
        if run:
            t0 = time.perf_counter()

            if alg == "BFS":
                result = bfs(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                st.success(f"BFS concluido em {elapsed:.1f}ms — {len(result)} nos visitados")
                max_level = max(info["level"] for info in result.values())
                st.metric("Niveis", max_level)
                data = [{"no": n, "nivel": info["level"], "pai": info["parent"] or "-"}
                        for n, info in sorted(result.items(), key=lambda x: x[1]["level"])]
                st.dataframe(data, width="stretch")

            elif alg == "DFS":
                result = dfs(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                st.success(f"DFS concluido em {elapsed:.1f}ms")
                st.metric("Ciclo detectado", "Sim" if result["has_cycle"] else "Nao")
                back_edges = [(u, v) for u, v, t in result["edge_types"] if t == "back"]
                if back_edges:
                    st.write(f"Back edges encontradas: {len(back_edges)}")
                data = [{"no": n, "descoberta": info["discovery"], "finalizacao": info["finish"],
                         "pai": info["parent"] or "-"}
                        for n, info in sorted(result["nodes"].items(), key=lambda x: x[1]["discovery"])]
                st.dataframe(data, width="stretch")

            elif alg == "Dijkstra":
                dist, prev = dijkstra(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                path = reconstruct_path(prev, source, target)
                custo = dist.get(target, float("inf"))
                st.success(f"Dijkstra concluido em {elapsed:.1f}ms")
                col1, col2 = st.columns(2)
                col1.metric("Custo", f"{custo:.1f}")
                col2.metric("Saltos", len(path) - 1 if path else 0)
                if path:
                    st.info(f"Caminho: **{'  →  '.join(path)}**")
                else:
                    st.error("Sem caminho encontrado")

            elif alg == "Bellman-Ford":
                dist, prev, has_neg = bellman_ford(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                st.success(f"Bellman-Ford concluido em {elapsed:.1f}ms")
                st.metric("Ciclo negativo", "Sim" if has_neg else "Nao")
                if target and not has_neg:
                    path = reconstruct_path(prev, source, target)
                    custo = dist.get(target, float("inf"))
                    st.metric("Custo", f"{custo:.1f}")
                    if path:
                        st.info(f"Caminho: **{'  →  '.join(path)}**")
        else:
            st.info("Selecione um algoritmo e clique em **Executar**.")

    with tab_viz:
        st.subheader("Visualizacoes Geradas")
        out_dir = os.path.join(os.path.dirname(__file__), "..", "out")

        col1, col2 = st.columns(2)
        for img_file, label in [
            ("viz_distribuicao_graus.png", "Distribuicao de Graus"),
            ("viz_ranking_conectados.png", "Ranking de Conectados"),
            ("viz_comparacao_regioes.png", "Comparacao entre Regioes"),
            ("viz_bfs_camadas.png", "BFS em Camadas (REC)"),
        ]:
            path = os.path.join(out_dir, img_file)
            if os.path.exists(path):
                col = col1 if label in ("Distribuicao de Graus", "Comparacao entre Regioes") else col2
                col.image(path, caption=label, width="stretch")

        st.subheader("Grafo Interativo")
        html_path = os.path.join(out_dir, "grafo_interativo.html")
        if os.path.exists(html_path):
            with open(html_path, "r", encoding="utf-8") as f:
                st.html(f.read())

else:
    tab_alg, tab_viz = st.tabs(["Algoritmos", "Visualizacoes"])

    with tab_alg:
        col1, col2, col3 = st.columns(3)
        col1.metric("Nos", graph.order())
        col2.metric("Arestas", graph.size())
        col3.metric("Dataset", "Facebook Ego (SNAP)")

        if run:
            t0 = time.perf_counter()

            if alg == "BFS":
                result = bfs(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                st.success(f"BFS concluido em {elapsed:.1f}ms — {len(result)} nos visitados")
                max_level = max(info["level"] for info in result.values())
                st.metric("Niveis", max_level)

            elif alg == "DFS":
                result = dfs(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                st.success(f"DFS concluido em {elapsed:.1f}ms")
                st.metric("Ciclo detectado", "Sim" if result["has_cycle"] else "Nao")

            elif alg == "Dijkstra":
                dist, prev = dijkstra(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                path = reconstruct_path(prev, source, target)
                custo = dist.get(target, float("inf"))
                st.success(f"Dijkstra concluido em {elapsed:.1f}ms")
                st.metric("Custo", f"{custo:.1f}")
                if path:
                    st.info(f"Caminho: **{'  →  '.join(path)}**")

            elif alg == "Bellman-Ford":
                dist, prev, has_neg = bellman_ford(graph, source)
                elapsed = (time.perf_counter() - t0) * 1000
                st.success(f"Bellman-Ford concluido em {elapsed:.1f}ms")
                st.metric("Ciclo negativo", "Sim" if has_neg else "Nao")
        else:
            st.info("Selecione um algoritmo e clique em **Executar**.")

    with tab_viz:
        out_dir = os.path.join(os.path.dirname(__file__), "..", "out")
        col1, col2 = st.columns(2)
        for img_file, label in [
            ("parte2_viz_graus_facebook.png", "Distribuicao de Graus — Facebook"),
            ("parte2_viz_comparacao_algos.png", "Comparacao de Algoritmos"),
        ]:
            path = os.path.join(out_dir, img_file)
            if os.path.exists(path):
                col = col1 if "Graus" in label else col2
                col.image(path, caption=label, width="stretch")
