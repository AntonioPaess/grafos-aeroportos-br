from __future__ import annotations

import csv
import json
from pathlib import Path

from src.graphs.graph import Graph


def load_airports(path: str) -> list[dict]:
    rows: list[dict] = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "iata": row["iata"].strip(),
                "cidade": row["cidade"].strip(),
                "regiao": row["regiao"].strip(),
            })
    return rows


def load_adjacencias(path: str) -> list[dict]:
    rows: list[dict] = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rows.append({
                "origem": row["origem"].strip(),
                "destino": row["destino"].strip(),
                "tipo_conexao": row["tipo_conexao"].strip(),
                "justificativa": row["justificativa"].strip(),
                "peso": float(row["peso"]),
            })
    return rows


def load_rotas(path: str) -> list[tuple[str, str]]:
    rotas: list[tuple[str, str]] = []
    with open(path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            rotas.append((row["origem"].strip(), row["destino"].strip()))
    return rotas


def build_graph_from_adjacencias(
    airports: list[dict], adjacencias: list[dict]
) -> Graph:
    g = Graph(directed=False)
    for ap in airports:
        g.add_node(ap["iata"])
    for adj in adjacencias:
        g.add_edge(adj["origem"], adj["destino"], adj["peso"])
    return g


def save_json(data: dict | list, path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_edge_list(path: str, directed: bool = False, default_weight: float = 1.0) -> Graph:
    g = Graph(directed=directed)
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            parts = line.split()
            u, v = parts[0], parts[1]
            w = float(parts[2]) if len(parts) > 2 else default_weight
            g.add_edge(u, v, w)
    return g


def save_csv(rows: list[dict], fieldnames: list[str], path: str) -> None:
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
