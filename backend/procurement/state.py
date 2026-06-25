"""Procure Guard shared LangGraph state."""

from typing import Annotated, Any

from pydantic import BaseModel, Field
from typing_extensions import TypedDict


class ClauseExtraction(BaseModel):
    id: str = ""
    doc: str = ""
    field: str = ""
    value: str = ""
    numeric_value: float | None = None
    confidence: float = 1.0
    page: int | None = None
    section: str = ""
    start_char: int | None = None
    end_char: int | None = None
    snippet: str = ""


class PriceLine(BaseModel):
    line_id: str = "1"
    description: str = ""
    bid_unit_price: float | None = None
    contract_unit_price: float | None = None
    po_unit_price: float | None = None
    invoice_unit_price: float | None = None
    quantity: float = 0
    variance: float = 0
    exposure: float = 0


def merge_lists(left: list, right: list) -> list:
    if not right:
        return left or []
    if not left:
        return right or []
    return left + right


class ProcureCaseState(TypedDict, total=False):
    case_id: str
    project_id: str
    scenario_id: str
    label: str
    raw: dict[str, Any]
    completeness_score: float
    process_flags: Annotated[list[str], merge_lists]
    extractions: Annotated[list[dict], merge_lists]
    collusion_signals: Annotated[list[dict], merge_lists]
    vendor_profile: dict
    price_matrix: list[dict]
    financial_exposure: float
    risk_score: int
    severity_band: str
    narrative: str
    evidence_packet: dict
    status: str
    critic_passed: bool
    critic_errors: Annotated[list[str], merge_lists]
    critic_attempts: int
    messages: Annotated[list[str], merge_lists]


SCENARIO_META = {
    "case_010": {
        "case_id": "CASE-2026-XOM-010",
        "label": "Downstream — Beaumont Refinery Expansion Turnaround",
        "project_id": "procure-guard-demo",
    },
    "case_011": {
        "case_id": "CASE-2026-XOM-011",
        "label": "Upstream — Permian Basin Drilling Infrastructure",
        "project_id": "procure-guard-demo",
    },
}
