from __future__ import annotations

import os
from pathlib import Path

from src.graphs.graph import Graph
from src.graphs.io import (
    load_adjacencias,
    load_airports,
    load_rotas,
    build_graph_from_adjacencias,
    save_csv,
    save_json,
)
from src.graphs.algorithms import bfs, dfs, dijkstra, reconstruct_path


def compute_global_metrics(graph: Graph) -> dict:
    return {
        "ordem": graph.order(),
        "tamanho": graph.size(),
        "densidade": round(graph.density(), 4),
    }


def compute_region_metrics(
    graph: Graph, airports: list[dict]
) -> list[dict]:
    regions: dict[str, set[str]] = {}
    for ap in airports:
        regions.setdefault(ap["regiao"], set()).add(ap["iata"])

    result = []
    for regiao, nodes in sorted(regions.items()):
        sub = graph.subgraph(nodes)
        result.append({
            "regiao": regiao,
            "ordem": sub.order(),
            "tamanho": sub.size(),
            "densidade": round(sub.density(), 4),
        })
    return result


def compute_ego_networks(graph: Graph) -> list[dict]:
    rows = []
    for node in graph.nodes():
        neighbor_nodes = {v for v, _ in graph.neighbors(node)}
        ego_nodes = {node} | neighbor_nodes
        ego = graph.subgraph(ego_nodes)
        rows.append({
            "aeroporto": node,
            "grau": graph.degree(node),
            "ordem_ego": ego.order(),
            "tamanho_ego": ego.size(),
            "densidade_ego": round(ego.density(), 4),
        })
    return rows


def compute_graus(graph: Graph) -> list[dict]:
    rows = [{"aeroporto": n, "grau": graph.degree(n)} for n in graph.nodes()]
    rows.sort(key=lambda r: r["grau"], reverse=True)
    return rows


def compute_distancias(
    graph: Graph, rotas: list[tuple[str, str]]
) -> list[dict]:
    rows = []
    for origem, destino in rotas:
        dist, prev = dijkstra(graph, origem)
        path = reconstruct_path(prev, origem, destino)
        custo = dist.get(destino, float("inf"))
        caminho_str = "→".join(path) if path else "sem caminho"
        rows.append({
            "origem": origem,
            "destino": destino,
            "custo": round(custo, 2),
            "caminho": caminho_str,
        })
    return rows


def run_all(dataset_path: str, out_dir: str) -> None:
    data_dir = str(Path(dataset_path).parent)
    airports = load_airports(dataset_path)
    adj_path = os.path.join(data_dir, "adjacencias_aeroportos.csv")
    adjacencias = load_adjacencias(adj_path)
    graph = build_graph_from_adjacencias(airports, adjacencias)

    os.makedirs(out_dir, exist_ok=True)

    global_metrics = compute_global_metrics(graph)
    save_json(global_metrics, os.path.join(out_dir, "global.json"))

    region_metrics = compute_region_metrics(graph, airports)
    save_json(region_metrics, os.path.join(out_dir, "regioes.json"))

    ego_rows = compute_ego_networks(graph)
    save_csv(
        ego_rows,
        ["aeroporto", "grau", "ordem_ego", "tamanho_ego", "densidade_ego"],
        os.path.join(out_dir, "ego_aeroportos.csv"),
    )

    graus_rows = compute_graus(graph)
    save_csv(graus_rows, ["aeroporto", "grau"], os.path.join(out_dir, "graus.csv"))

    rotas_path = os.path.join(data_dir, "rotas.csv")
    if os.path.exists(rotas_path):
        rotas = load_rotas(rotas_path)
        dist_rows = compute_distancias(graph, rotas)
        save_csv(
            dist_rows,
            ["origem", "destino", "custo", "caminho"],
            os.path.join(out_dir, "distancias_rotas.csv"),
        )

    return graph, airports
