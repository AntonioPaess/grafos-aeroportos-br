from __future__ import annotations

import os
import random
import time

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from src.graphs.graph import Graph
from src.graphs.io import load_edge_list, save_json
from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford, reconstruct_path


def run_parte2(dataset_dir: str, out_dir: str) -> None:
    os.makedirs(out_dir, exist_ok=True)

    txt_path = os.path.join(dataset_dir, "facebook_combined.txt")
    print("Carregando dataset Facebook Ego...")
    graph = load_edge_list(txt_path, directed=False, default_weight=1.0)

    num_nodes = graph.order()
    num_edges = graph.size()
    print(f"  Nos: {num_nodes}, Arestas: {num_edges}")

    report: dict = {
        "dataset": {
            "nome": "Facebook Ego (SNAP)",
            "nodes": num_nodes,
            "edges": num_edges,
            "directed": False,
            "descricao": "Rede social do Facebook com circulos de amizade (ego networks combinadas)",
        },
        "resultados": [],
    }

    # --- BFS em 3+ fontes ---
    nodes_list = graph.nodes()
    bfs_sources = ["0", "107", "1684"]
    print("\n--- BFS ---")
    for source in bfs_sources:
        t0 = time.perf_counter()
        result = bfs(graph, source)
        elapsed = (time.perf_counter() - t0) * 1000
        max_level = max(info["level"] for info in result.values())
        print(f"  BFS({source}): {len(result)} nos visitados, {max_level} niveis, {elapsed:.1f}ms")
        report["resultados"].append({
            "algoritmo": "BFS",
            "fonte": source,
            "tempo_ms": round(elapsed, 2),
            "nos_visitados": len(result),
            "niveis": max_level,
        })

    # --- DFS em 3+ fontes ---
    print("\n--- DFS ---")
    for source in bfs_sources:
        t0 = time.perf_counter()
        result = dfs(graph, source)
        elapsed = (time.perf_counter() - t0) * 1000
        has_cycle = result["has_cycle"]
        print(f"  DFS({source}): ciclo={has_cycle}, {elapsed:.1f}ms")
        report["resultados"].append({
            "algoritmo": "DFS",
            "fonte": source,
            "tempo_ms": round(elapsed, 2),
            "nos_visitados": len(result["nodes"]),
            "ciclo_detectado": has_cycle,
        })

    # --- Dijkstra em 5+ pares ---
    print("\n--- Dijkstra ---")
    dijkstra_pairs = [
        ("0", "100"), ("0", "3000"), ("107", "1684"),
        ("200", "4000"), ("500", "3500"),
    ]
    for orig, dest in dijkstra_pairs:
        t0 = time.perf_counter()
        dist, prev = dijkstra(graph, orig)
        elapsed = (time.perf_counter() - t0) * 1000
        custo = dist.get(dest, float("inf"))
        path = reconstruct_path(prev, orig, dest)
        path_len = len(path) if path else 0
        print(f"  Dijkstra({orig}→{dest}): custo={custo}, saltos={path_len}, {elapsed:.1f}ms")
        report["resultados"].append({
            "algoritmo": "DIJKSTRA",
            "origem": orig,
            "destino": dest,
            "tempo_ms": round(elapsed, 2),
            "custo": custo,
            "saltos": path_len,
        })

    # --- Bellman-Ford: peso negativo sem ciclo ---
    print("\n--- Bellman-Ford ---")
    print("  Caso 1: pesos negativos sem ciclo negativo")
    g_neg = Graph(directed=True)
    sample_nodes = nodes_list[:50]
    for node in sample_nodes:
        g_neg.add_node(node)
    for i in range(len(sample_nodes) - 1):
        w = random.uniform(-0.5, 2.0)
        g_neg.add_edge(sample_nodes[i], sample_nodes[i + 1], round(w, 2))
    for i in range(0, len(sample_nodes) - 2, 3):
        g_neg.add_edge(sample_nodes[i], sample_nodes[i + 2], round(random.uniform(0.5, 3.0), 2))

    t0 = time.perf_counter()
    dist_bf, prev_bf, has_neg = bellman_ford(g_neg, sample_nodes[0])
    elapsed = (time.perf_counter() - t0) * 1000
    print(f"    Fonte: {sample_nodes[0]}, ciclo_negativo={has_neg}, {elapsed:.1f}ms")
    report["resultados"].append({
        "algoritmo": "BELLMAN_FORD",
        "caso": "pesos negativos sem ciclo negativo",
        "origem": sample_nodes[0],
        "tempo_ms": round(elapsed, 2),
        "ciclo_negativo": has_neg,
        "nos": len(sample_nodes),
    })

    # --- Bellman-Ford: ciclo negativo detectado ---
    print("  Caso 2: ciclo negativo detectado")
    g_cycle = Graph(directed=True)
    g_cycle.add_edge("X", "Y", 1.0)
    g_cycle.add_edge("Y", "Z", -3.0)
    g_cycle.add_edge("Z", "X", 1.0)
    g_cycle.add_edge("X", "W", 2.0)

    t0 = time.perf_counter()
    dist_bf2, prev_bf2, has_neg2 = bellman_ford(g_cycle, "X")
    elapsed = (time.perf_counter() - t0) * 1000
    print(f"    Fonte: X, ciclo_negativo={has_neg2}, {elapsed:.1f}ms")
    report["resultados"].append({
        "algoritmo": "BELLMAN_FORD",
        "caso": "ciclo negativo detectado",
        "origem": "X",
        "tempo_ms": round(elapsed, 2),
        "ciclo_negativo": has_neg2,
        "nos": 4,
    })

    # --- Salvar report ---
    save_json(report, os.path.join(out_dir, "parte2_report.json"))
    print(f"\nRelatorio salvo em {os.path.join(out_dir, 'parte2_report.json')}")

    # --- Visualizacoes ---
    _generate_degree_distribution(graph, out_dir)
    _generate_algorithm_comparison(report, out_dir)
    print("Visualizacoes da Parte 2 geradas!")


def _generate_degree_distribution(graph: Graph, out_dir: str) -> None:
    graus = [graph.degree(n) for n in graph.nodes()]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    ax1.hist(graus, bins=50, edgecolor="black", color="#3498db", alpha=0.8)
    ax1.set_title("Distribuicao de Graus — Facebook Ego")
    ax1.set_xlabel("Grau")
    ax1.set_ylabel("Frequencia")
    ax1.legend(["Usuarios"])

    grau_counts: dict[int, int] = {}
    for g in graus:
        grau_counts[g] = grau_counts.get(g, 0) + 1
    xs = sorted(grau_counts.keys())
    ys = [grau_counts[x] for x in xs]
    ax2.scatter(xs, ys, s=10, color="#e74c3c", alpha=0.7)
    ax2.set_xscale("log")
    ax2.set_yscale("log")
    ax2.set_title("Distribuicao de Graus (Log-Log)")
    ax2.set_xlabel("Grau (log)")
    ax2.set_ylabel("Frequencia (log)")
    ax2.legend(["Usuarios"])

    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "parte2_viz_graus_facebook.png"), dpi=150)
    plt.close(fig)
    print("  Gerado: parte2_viz_graus_facebook.png")


def _generate_algorithm_comparison(report: dict, out_dir: str) -> None:
    bfs_results = [r for r in report["resultados"] if r["algoritmo"] == "BFS"]
    dfs_results = [r for r in report["resultados"] if r["algoritmo"] == "DFS"]
    dijkstra_results = [r for r in report["resultados"] if r["algoritmo"] == "DIJKSTRA"]
    bf_results = [r for r in report["resultados"] if r["algoritmo"] == "BELLMAN_FORD"]

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

    # Grafico 1: BFS vs DFS vs Dijkstra (tempo medio)
    algos = ["BFS", "DFS", "Dijkstra"]
    tempos = [
        sum(r["tempo_ms"] for r in bfs_results) / len(bfs_results) if bfs_results else 0,
        sum(r["tempo_ms"] for r in dfs_results) / len(dfs_results) if dfs_results else 0,
        sum(r["tempo_ms"] for r in dijkstra_results) / len(dijkstra_results) if dijkstra_results else 0,
    ]
    colors = ["#3498db", "#2ecc71", "#e74c3c"]
    bars = ax1.bar(algos, tempos, color=colors, edgecolor="black")
    ax1.set_title("Tempo Medio de Execucao por Algoritmo\n(Facebook Ego — 4039 nos, 88234 arestas)")
    ax1.set_xlabel("Algoritmo")
    ax1.set_ylabel("Tempo (ms)")
    for bar, t in zip(bars, tempos):
        ax1.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.5,
                f"{t:.1f}ms", ha="center", va="bottom", fontsize=10)
    ax1.legend(["Tempo medio"])

    # Grafico 2: Dijkstra por par
    labels = [f"{r['origem']}→{r['destino']}" for r in dijkstra_results]
    tempos_dij = [r["tempo_ms"] for r in dijkstra_results]
    ax2.barh(labels, tempos_dij, color="#e74c3c", edgecolor="black")
    ax2.set_title("Tempo Dijkstra por Par Origem-Destino")
    ax2.set_xlabel("Tempo (ms)")
    ax2.set_ylabel("Par")
    ax2.legend(["Dijkstra"])

    fig.tight_layout()
    fig.savefig(os.path.join(out_dir, "parte2_viz_comparacao_algos.png"), dpi=150)
    plt.close(fig)
    print("  Gerado: parte2_viz_comparacao_algos.png")
