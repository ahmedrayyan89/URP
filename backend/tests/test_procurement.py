"""Golden tests for Procure Guard pipeline."""

import pytest

from procurement.data_loader import initial_state
from procurement.graph import run_graph
from procurement.nodes import critic_node, reasoning_insights_node


def test_case_010_exposure():
    state = initial_state("case_010")
    result = run_graph("procure_guard_pipeline", state)
    exposure = result.get("financial_exposure", 0)
    assert abs(exposure - 108573) < 500
    assert result.get("risk_score", 0) >= 90
    assert "CASE-2026-XOM-010" == result.get("case_id")


def test_case_011_escalation_breach():
    state = initial_state("case_011")
    result = run_graph("procure_guard_pipeline", state)
    flags = result.get("process_flags") or []
    assert "escalation_cap_breach" in flags
    assert "gr_without_po" in flags
    assert result.get("risk_score", 0) >= 95


def test_critic_rejects_bad_narrative():
    state = {
        "narrative": "Some issue with no numbers",
        "financial_exposure": 108573,
        "risk_score": 96,
        "critic_attempts": 0,
    }
    out = critic_node(state)
    assert out["critic_passed"] is False
    assert len(out["critic_errors"]) > 0


def test_critic_passes_good_narrative():
    state = {
        "financial_exposure": 108573,
        "risk_score": 96,
        "case_id": "CASE-2026-XOM-010",
        "severity_band": "High",
        "price_matrix": [{
            "contract_unit_price": 143.42,
            "po_unit_price": 169.24,
            "quantity": 4205,
            "variance": 25.82,
        }],
        "process_flags": [],
    }
    narrative_out = reasoning_insights_node(state)
    state.update(narrative_out)
    out = critic_node(state)
    assert out["critic_passed"] is True
