from src.graphs.graph import Graph
from src.graphs.algorithms import bfs


def _make_graph():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("A", "C")
    g.add_edge("B", "D")
    g.add_edge("C", "D")
    g.add_edge("D", "E")
    return g


def test_bfs_levels():
    result = bfs(_make_graph(), "A")
    assert result["A"]["level"] == 0
    assert result["B"]["level"] == 1
    assert result["C"]["level"] == 1
    assert result["D"]["level"] == 2
    assert result["E"]["level"] == 3


def test_bfs_all_visited():
    result = bfs(_make_graph(), "A")
    assert set(result.keys()) == {"A", "B", "C", "D", "E"}


def test_bfs_layer_order():
    result = bfs(_make_graph(), "A")
    for node, info in result.items():
        parent = info["parent"]
        if parent is not None:
            assert result[parent]["level"] == info["level"] - 1


def test_bfs_source_parent_is_none():
    result = bfs(_make_graph(), "A")
    assert result["A"]["parent"] is None
