from __future__ import annotations


class Graph:
    def __init__(self, directed: bool = False):
        self.directed = directed
        self._adj: dict[str, list[tuple[str, float]]] = {}

    def add_node(self, node: str) -> None:
        if node not in self._adj:
            self._adj[node] = []

    def add_edge(self, u: str, v: str, weight: float = 1.0) -> None:
        self.add_node(u)
        self.add_node(v)
        self._adj[u].append((v, weight))
        if not self.directed:
            self._adj[v].append((u, weight))

    def neighbors(self, node: str) -> list[tuple[str, float]]:
        return self._adj.get(node, [])

    def nodes(self) -> list[str]:
        return list(self._adj.keys())

    def edges(self) -> list[tuple[str, str, float]]:
        seen: set[tuple[str, str]] = set()
        result: list[tuple[str, str, float]] = []
        for u in self._adj:
            for v, w in self._adj[u]:
                key = (min(u, v), max(u, v)) if not self.directed else (u, v)
                if key not in seen:
                    seen.add(key)
                    result.append((u, v, w))
        return result

    def degree(self, node: str) -> int:
        return len(self._adj.get(node, []))

    def has_node(self, node: str) -> bool:
        return node in self._adj

    def has_edge(self, u: str, v: str) -> bool:
        return any(n == v for n, _ in self._adj.get(u, []))

    def subgraph(self, nodes: set[str]) -> Graph:
        g = Graph(directed=self.directed)
        for n in nodes:
            g.add_node(n)
        for u in nodes:
            for v, w in self._adj.get(u, []):
                if v in nodes and not g.has_edge(u, v):
                    g.add_edge(u, v, w)
        return g

    def order(self) -> int:
        return len(self._adj)

    def size(self) -> int:
        return len(self.edges())

    def density(self) -> float:
        n = self.order()
        if n < 2:
            return 0.0
        e = self.size()
        if self.directed:
            return e / (n * (n - 1))
        return (2 * e) / (n * (n - 1))
