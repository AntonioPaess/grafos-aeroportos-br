from src.graphs.graph import Graph
from src.graphs.algorithms import bellman_ford


def _make_graph_negative_no_cycle():
    g = Graph(directed=True)
    g.add_edge("A", "B", 1.0)
    g.add_edge("B", "C", -2.0)
    g.add_edge("A", "C", 5.0)
    g.add_edge("C", "D", 3.0)
    return g


def _make_graph_negative_cycle():
    g = Graph(directed=True)
    g.add_edge("A", "B", 1.0)
    g.add_edge("B", "C", -1.0)
    g.add_edge("C", "A", -1.0)
    return g


def test_bellman_ford_correct_distances():
    dist, _, has_neg = bellman_ford(_make_graph_negative_no_cycle(), "A")
    assert has_neg is False
    assert dist["A"] == 0.0
    assert dist["B"] == 1.0
    assert dist["C"] == -1.0
    assert dist["D"] == 2.0


def test_bellman_ford_no_negative_cycle():
    _, _, has_neg = bellman_ford(_make_graph_negative_no_cycle(), "A")
    assert has_neg is False


def test_bellman_ford_detects_negative_cycle():
    _, _, has_neg = bellman_ford(_make_graph_negative_cycle(), "A")
    assert has_neg is True
