"""LangGraph orchestration for Procure Guard."""

from langgraph.graph import END, START, StateGraph

from procurement.nodes import (
    bid_intake_node,
    bid_risk_scoring_node,
    case_creation_node,
    collusion_detection_node,
    critic_node,
    document_intelligence_node,
    price_accuracy_node,
    reasoning_insights_node,
    vendor_intelligence_node,
)
from procurement.scoring import compute_risk_score, severity_band
from procurement.state import ProcureCaseState

MAX_CRITIC_RETRIES = 2


def _route_after_critic(state: dict) -> str:
    if state.get("critic_passed"):
        return "case_creation"
    if (state.get("critic_attempts") or 0) >= MAX_CRITIC_RETRIES:
        return "case_creation"
    return "reasoning_insights"


def _rescore_after_price(state: dict) -> dict:
  # intermediate risk update before full scoring node
    score = compute_risk_score(
        state.get("process_flags") or [],
        state.get("completeness_score") or 0,
        state.get("financial_exposure") or 0,
        len(state.get("collusion_signals") or []),
        state.get("vendor_profile"),
    )
    return {"risk_score": score, "severity_band": severity_band(score)}


def build_pipeline_graph():
    graph = StateGraph(ProcureCaseState)

    graph.add_node("bid_intake", bid_intake_node)
    graph.add_node("document_intelligence", document_intelligence_node)
    graph.add_node("bid_risk_scoring", bid_risk_scoring_node)
    graph.add_node("collusion_detection", collusion_detection_node)
    graph.add_node("vendor_intelligence", vendor_intelligence_node)
    graph.add_node("price_accuracy", price_accuracy_node)
    graph.add_node("rescore", _rescore_after_price)
    graph.add_node("reasoning_insights", reasoning_insights_node)
    graph.add_node("critic", critic_node)
    graph.add_node("case_creation", case_creation_node)

    graph.add_edge(START, "bid_intake")
    graph.add_edge("bid_intake", "document_intelligence")
    graph.add_edge("document_intelligence", "collusion_detection")
    graph.add_edge("collusion_detection", "vendor_intelligence")
    graph.add_edge("vendor_intelligence", "price_accuracy")
    graph.add_edge("price_accuracy", "rescore")
    graph.add_edge("rescore", "bid_risk_scoring")
    graph.add_edge("bid_risk_scoring", "reasoning_insights")
    graph.add_edge("reasoning_insights", "critic")
    graph.add_conditional_edges("critic", _route_after_critic, {
        "case_creation": "case_creation",
        "reasoning_insights": "reasoning_insights",
    })
    graph.add_edge("case_creation", END)

    return graph.compile()


def build_single_node_graph(node_name: str):
    from procurement import nodes as n

    node_map = {
        "bid_intake": n.bid_intake_node,
        "document_intelligence": n.document_intelligence_node,
        "bid_risk_scoring": n.bid_risk_scoring_node,
        "collusion_detection": n.collusion_detection_node,
        "vendor_intelligence": n.vendor_intelligence_node,
        "price_accuracy": n.price_accuracy_node,
        "reasoning_insights": n.reasoning_insights_node,
        "critic": n.critic_node,
        "case_creation": n.case_creation_node,
    }
    fn = node_map.get(node_name)
    if not fn:
        raise ValueError(f"Unknown node: {node_name}")

    graph = StateGraph(ProcureCaseState)
    graph.add_node(node_name, fn)
    graph.add_edge(START, node_name)
    graph.add_edge(node_name, END)
    return graph.compile()


_PIPELINE = None
_SINGLE_GRAPHS: dict = {}


def get_pipeline_graph():
    global _PIPELINE
    if _PIPELINE is None:
        _PIPELINE = build_pipeline_graph()
    return _PIPELINE


def get_node_graph(node_name: str):
    if node_name not in _SINGLE_GRAPHS:
        _SINGLE_GRAPHS[node_name] = build_single_node_graph(node_name)
    return _SINGLE_GRAPHS[node_name]


def run_graph(graph_id: str, state: dict) -> dict:
    if graph_id == "procure_guard_pipeline":
        result = get_pipeline_graph().invoke(state)
    else:
        node = graph_id.replace("procure_", "")
        result = get_node_graph(node).invoke(state)
    return dict(result)
