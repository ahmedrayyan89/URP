"""Seed Procure Guard LangGraph agents into agents.json."""

import json
from pathlib import Path

from agents.store import CreateBuiltAgentPayload, create_built_agent, list_agents

PROJECT_IDS = ["procure-guard-demo", "acme-corp-risk", "vendor-assessment"]

AGENTS = [
    ("Bid Intake Agent (konaAI)", "procure_bid_intake", "Ingest Ariba exports and run process integrity checks.", "#0ea5e9"),
    ("Document Intelligence Agent (LexAI)", "procure_document_intelligence", "Extract contract clauses, pricing, and escalation caps.", "#8b5cf6"),
    ("Bid Risk Scoring Agent", "procure_bid_risk_scoring", "Compute weighted 0-100 risk scores from rule outputs.", "#f59e0b"),
    ("Collusion Detection Agent", "procure_collusion_detection", "Detect coordinated bidding and metadata anomalies.", "#ef4444"),
    ("Vendor Intelligence Agent", "procure_vendor_intelligence", "Vendor sanctions and adverse media profiling.", "#10b981"),
    ("Price Accuracy Agent (konaAI)", "procure_price_accuracy", "4-way financial reconciliation and leakage exposure.", "#3b82f6"),
    ("Reasoning & Insights Agent", "procure_reasoning_insights", "Executive narrative synthesis from agent outputs.", "#6366f1"),
    ("Case Creation Agent", "procure_case_creation", "Assemble evidence packets and publish to case queue.", "#14b8a6"),
    ("Procure Guard Pipeline", "procure_guard_pipeline", "Full 8-agent orchestrated procurement fraud pipeline.", "#1e40af"),
]


def seed_agents(force: bool = False) -> list[dict]:
    all_created = []
    for project_id in PROJECT_IDS:
        existing = list_agents(project_id)
        if existing and not force:
            langgraph = [a for a in existing if a.get("framework") == "langgraph"]
            if len(langgraph) >= 9:
                all_created.extend(langgraph)
                continue

        for name, graph_id, desc, color in AGENTS:
            agent = create_built_agent(
                CreateBuiltAgentPayload(
                    project_id=project_id,
                    name=name,
                    description=desc,
                    framework="langgraph",
                    graph_id=graph_id,
                    agent_role=graph_id.replace("procure_", ""),
                    icon_color=color,
                    status="active",
                )
            )
            all_created.append(agent)
    return all_created


if __name__ == "__main__":
    agents = seed_agents(force=True)
    print(f"Seeded {len(agents)} LangGraph agents")
