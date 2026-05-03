from __future__ import annotations

import heapq
from collections import deque

from src.graphs.graph import Graph


def bfs(graph: Graph, source: str) -> dict[str, dict]:
    result: dict[str, dict] = {source: {"level": 0, "parent": None}}
    queue: deque[str] = deque([source])

    while queue:
        u = queue.popleft()
        for v, _ in graph.neighbors(u):
            if v not in result:
                result[v] = {"level": result[u]["level"] + 1, "parent": u}
                queue.append(v)

    return result


def dfs(graph: Graph, source: str) -> dict[str, dict]:
    result: dict[str, dict] = {}
    edge_types: list[tuple[str, str, str]] = []
    time_counter = 0

    def _dfs_iterative(start: str) -> None:
        nonlocal time_counter
        time_counter += 1
        result[start] = {"discovery": time_counter, "finish": 0, "parent": None}
        stack: list[tuple[str, int]] = [(start, 0)]

        while stack:
            u, idx = stack[-1]
            neighbors = graph.neighbors(u)

            if idx < len(neighbors):
                stack[-1] = (u, idx + 1)
                v, _ = neighbors[idx]

                if v not in result:
                    edge_types.append((u, v, "tree"))
                    time_counter += 1
                    result[v] = {"discovery": time_counter, "finish": 0, "parent": u}
                    stack.append((v, 0))
                elif result[v]["finish"] == 0:
                    if v != result[u]["parent"] or graph.directed:
                        edge_types.append((u, v, "back"))
                elif result[v]["discovery"] > result[u]["discovery"]:
                    edge_types.append((u, v, "forward"))
                else:
                    edge_types.append((u, v, "cross"))
            else:
                time_counter += 1
                result[u]["finish"] = time_counter
                stack.pop()

    _dfs_iterative(source)

    for node in graph.nodes():
        if node not in result:
            _dfs_iterative(node)

    has_cycle = any(t == "back" for _, _, t in edge_types)
    return {"nodes": result, "edge_types": edge_types, "has_cycle": has_cycle}


def dijkstra(
    graph: Graph, source: str
) -> tuple[dict[str, float], dict[str, str | None]]:
    for u in graph.nodes():
        for _, w in graph.neighbors(u):
            if w < 0:
                raise ValueError(
                    f"Dijkstra nao suporta pesos negativos (encontrado peso {w})"
                )

    dist: dict[str, float] = {source: 0.0}
    prev: dict[str, str | None] = {source: None}
    heap: list[tuple[float, str]] = [(0.0, source)]

    while heap:
        d, u = heapq.heappop(heap)
        if d > dist.get(u, float("inf")):
            continue
        for v, w in graph.neighbors(u):
            nd = d + w
            if nd < dist.get(v, float("inf")):
                dist[v] = nd
                prev[v] = u
                heapq.heappush(heap, (nd, v))

    return dist, prev


def bellman_ford(
    graph: Graph, source: str
) -> tuple[dict[str, float], dict[str, str | None], bool]:
    nodes = graph.nodes()
    dist: dict[str, float] = {n: float("inf") for n in nodes}
    prev: dict[str, str | None] = {n: None for n in nodes}
    dist[source] = 0.0

    all_edges: list[tuple[str, str, float]] = []
    for u in nodes:
        for v, w in graph.neighbors(u):
            all_edges.append((u, v, w))

    for _ in range(len(nodes) - 1):
        updated = False
        for u, v, w in all_edges:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                prev[v] = u
                updated = True
        if not updated:
            break

    has_negative_cycle = False
    for u, v, w in all_edges:
        if dist[u] + w < dist[v]:
            has_negative_cycle = True
            break

    return dist, prev, has_negative_cycle


def reconstruct_path(
    prev: dict[str, str | None], source: str, target: str
) -> list[str] | None:
    if target not in prev or (prev[target] is None and target != source):
        return None
    path: list[str] = []
    current: str | None = target
    while current is not None:
        path.append(current)
        current = prev[current]
    path.reverse()
    if path[0] != source:
        return None
    return path
