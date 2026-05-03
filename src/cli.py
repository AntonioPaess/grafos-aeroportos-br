from __future__ import annotations

import argparse
import os
import sys

from src.graphs.io import (
    load_adjacencias,
    load_airports,
    build_graph_from_adjacencias,
)
from src.graphs.algorithms import bfs, dfs, dijkstra, bellman_ford, reconstruct_path
from src.solve import run_all


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Rede de Aeroportos do Brasil — Teoria dos Grafos"
    )
    parser.add_argument("--dataset", required=True, help="Caminho do CSV de aeroportos ou diretorio (Parte 2)")
    parser.add_argument("--alg", choices=["BFS", "DFS", "DIJKSTRA", "BELLMAN_FORD"], help="Algoritmo a executar")
    parser.add_argument("--source", help="No de origem")
    parser.add_argument("--target", help="No de destino (para Dijkstra/BF)")
    parser.add_argument("--out", default="./out/", help="Diretorio de saida")
    parser.add_argument("--all", action="store_true", help="Gerar todas as saidas (metricas + rotas + viz)")
    parser.add_argument("--parte2", action="store_true", help="Executar analise da Parte 2 (dataset maior)")

    args = parser.parse_args()
    os.makedirs(args.out, exist_ok=True)

    if args.parte2:
        from src.solve_parte2 import run_parte2
        run_parte2(args.dataset, args.out)
        return

    if args.all:
        graph, airports = run_all(args.dataset, args.out)
        from src.viz import generate_all_visualizations
        generate_all_visualizations(graph, airports, args.dataset, args.out)
        print(f"Todas as saidas geradas em {args.out}")
        return

    data_dir = os.path.dirname(args.dataset)
    airports = load_airports(args.dataset)
    adj_path = os.path.join(data_dir, "adjacencias_aeroportos.csv")
    adjacencias = load_adjacencias(adj_path)
    graph = build_graph_from_adjacencias(airports, adjacencias)

    if not args.alg or not args.source:
        parser.error("--alg e --source sao obrigatorios (ou use --all)")

    if args.alg == "BFS":
        result = bfs(graph, args.source)
        print(f"BFS a partir de {args.source}:")
        for node in sorted(result, key=lambda n: result[n]["level"]):
            info = result[node]
            print(f"  {node}: nivel={info['level']}, pai={info['parent']}")

    elif args.alg == "DFS":
        result = dfs(graph, args.source)
        print(f"DFS a partir de {args.source}:")
        print(f"  Ciclo detectado: {result['has_cycle']}")
        for node in sorted(result["nodes"], key=lambda n: result["nodes"][n]["discovery"]):
            info = result["nodes"][node]
            print(f"  {node}: d={info['discovery']}, f={info['finish']}, pai={info['parent']}")

    elif args.alg == "DIJKSTRA":
        if not args.target:
            parser.error("--target obrigatorio para DIJKSTRA")
        dist, prev = dijkstra(graph, args.source)
        path = reconstruct_path(prev, args.source, args.target)
        custo = dist.get(args.target, float("inf"))
        print(f"Dijkstra {args.source} → {args.target}:")
        print(f"  Custo: {custo}")
        print(f"  Caminho: {'→'.join(path) if path else 'sem caminho'}")

    elif args.alg == "BELLMAN_FORD":
        dist, prev, has_neg = bellman_ford(graph, args.source)
        print(f"Bellman-Ford a partir de {args.source}:")
        print(f"  Ciclo negativo: {has_neg}")
        if args.target:
            path = reconstruct_path(prev, args.source, args.target)
            custo = dist.get(args.target, float("inf"))
            print(f"  {args.source} → {args.target}: custo={custo}")
            print(f"  Caminho: {'→'.join(path) if path else 'sem caminho'}")


if __name__ == "__main__":
    main()
