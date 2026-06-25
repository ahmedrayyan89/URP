"""LangGraph agent runtime for Procure Guard."""

import json
import logging

from procurement.data_loader import initial_state
from procurement.graph import run_graph

logger = logging.getLogger(__name__)


def invoke_langgraph_agent(
    agent: dict,
    query: str,
    session_id: str | None = None,
    context: dict | None = None,
) -> str:
    context = context or {}
    graph_id = agent.get("graph_id") or "procure_guard_pipeline"
    scenario_id = context.get("scenario_id") or _parse_scenario(query)

    state = initial_state(scenario_id, project_id=agent.get("project_id"))
    state["messages"] = []

    try:
        result = run_graph(graph_id, state)
    except Exception as exc:
        logger.exception("LangGraph run failed")
        raise RuntimeError(f"LangGraph execution failed: {exc}") from exc

    if graph_id == "procure_guard_pipeline":
        return _format_pipeline_output(result)

    # single-node agent
    return _format_node_output(result, graph_id)


def _parse_scenario(query: str) -> str:
    q = query.lower().strip()
    if "011" in q or "permain" in q or "case_011" in q:
        return "case_011"
    if "010" in q or "orion" in q or "beaumont" in q or "case_010" in q:
        return "case_010"
    return "case_010"


def _format_pipeline_output(result: dict) -> str:
    payload = {
        "case_id": result.get("case_id"),
        "risk_score": result.get("risk_score"),
        "severity_band": result.get("severity_band"),
        "financial_exposure": result.get("financial_exposure"),
        "process_flags": result.get("process_flags"),
        "narrative": result.get("narrative"),
        "price_matrix": result.get("price_matrix"),
        "status": result.get("status"),
    }
    return json.dumps(payload, indent=2)


def _format_node_output(result: dict, graph_id: str) -> str:
    keys = {
        "procure_bid_intake": ["completeness_score", "process_flags"],
        "procure_document_intelligence": ["extractions"],
        "procure_price_accuracy": ["price_matrix", "financial_exposure", "process_flags"],
        "procure_bid_risk_scoring": ["risk_score", "severity_band"],
        "procure_collusion_detection": ["collusion_signals"],
        "procure_vendor_intelligence": ["vendor_profile"],
        "procure_reasoning_insights": ["narrative"],
        "procure_case_creation": ["case_id", "status", "evidence_packet"],
        "procure_critic": ["critic_passed", "critic_errors"],
    }
    fields = keys.get(graph_id, list(result.keys()))
    payload = {k: result.get(k) for k in fields if k in result}
    return json.dumps(payload, indent=2)
