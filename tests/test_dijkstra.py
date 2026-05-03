import pytest

from src.graphs.graph import Graph
from src.graphs.algorithms import dijkstra, reconstruct_path


def _make_weighted_graph():
    g = Graph()
    g.add_edge("A", "B", 1.0)
    g.add_edge("B", "C", 2.0)
    g.add_edge("A", "C", 5.0)
    g.add_edge("C", "D", 1.0)
    return g


def test_dijkstra_correct_distances():
    dist, _ = dijkstra(_make_weighted_graph(), "A")
    assert dist["A"] == 0.0
    assert dist["B"] == 1.0
    assert dist["C"] == 3.0
    assert dist["D"] == 4.0


def test_dijkstra_correct_path():
    dist, prev = dijkstra(_make_weighted_graph(), "A")
    path = reconstruct_path(prev, "A", "D")
    assert path == ["A", "B", "C", "D"]
    assert dist["D"] == 4.0


def test_dijkstra_rejects_negative_weight():
    g = Graph()
    g.add_edge("A", "B", -1.0)
    with pytest.raises(ValueError):
        dijkstra(g, "A")
