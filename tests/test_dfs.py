from src.graphs.graph import Graph
from src.graphs.algorithms import dfs


def _make_graph_with_cycle():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("B", "C")
    g.add_edge("C", "A")
    g.add_edge("C", "D")
    return g


def _make_tree():
    g = Graph()
    g.add_edge("A", "B")
    g.add_edge("A", "C")
    g.add_edge("B", "D")
    return g


def test_dfs_cycle_detection():
    result = dfs(_make_graph_with_cycle(), "A")
    assert result["has_cycle"] is True


def test_dfs_no_cycle_in_tree():
    result = dfs(_make_tree(), "A")
    assert result["has_cycle"] is False


def test_dfs_back_edge_present():
    result = dfs(_make_graph_with_cycle(), "A")
    back_edges = [e for e in result["edge_types"] if e[2] == "back"]
    assert len(back_edges) >= 1


def test_dfs_discovery_finish_consistent():
    result = dfs(_make_graph_with_cycle(), "A")
    nodes = result["nodes"]
    for node, info in nodes.items():
        assert info["discovery"] < info["finish"]
        parent = info["parent"]
        if parent is not None:
            assert nodes[parent]["discovery"] < info["discovery"]
            assert info["finish"] < nodes[parent]["finish"]
