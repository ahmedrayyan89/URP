"""Procure Guard case persistence."""

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

CASES_FILE = Path("./data/cases.json")


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> list[dict]:
    if not CASES_FILE.exists():
        return []
    with open(CASES_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    CASES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CASES_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def list_cases(project_id: str | None = None) -> list[dict]:
    records = _load()
    if project_id:
        records = [r for r in records if r.get("project_id") == project_id]
    return sorted(records, key=lambda r: r.get("risk_score", 0), reverse=True)


def get_case(case_id: str) -> dict:
    record = next((r for r in _load() if r["case_id"] == case_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Case not found")
    return record


def upsert_case(state: dict) -> dict:
    records = _load()
    case_id = state.get("case_id")
    record = {
        "case_id": case_id,
        "project_id": state.get("project_id"),
        "scenario_id": state.get("scenario_id"),
        "label": state.get("label"),
        "risk_score": state.get("risk_score", 0),
        "severity_band": state.get("severity_band", "Low"),
        "financial_exposure": state.get("financial_exposure", 0),
        "status": state.get("status", "open"),
        "process_flags": state.get("process_flags", []),
        "price_matrix": state.get("price_matrix", []),
        "extractions": state.get("extractions", []),
        "collusion_signals": state.get("collusion_signals", []),
        "vendor_profile": state.get("vendor_profile", {}),
        "narrative": state.get("narrative", ""),
        "evidence_packet": state.get("evidence_packet", {}),
        "completeness_score": state.get("completeness_score", 0),
        "updated_at": _now(),
    }

    for i, r in enumerate(records):
        if r["case_id"] == case_id:
            record["created_at"] = r.get("created_at", _now())
            records[i] = record
            _save(records)
            return record

    record["created_at"] = _now()
    record["id"] = str(uuid.uuid4())
    records.append(record)
    _save(records)
    return record


def escalate_case(case_id: str) -> dict:
    records = _load()
    for i, r in enumerate(records):
        if r["case_id"] == case_id:
            workflow_id = f"WF-{uuid.uuid4().hex[:8].upper()}"
            records[i] = {
                **r,
                "status": "escalated",
                "escalated_at": _now(),
                "workflow_id": workflow_id,
                "workflow_log": [
                    "Evidence packet bundled (Ariba, PDF citations, SAP logs)",
                    "Vendor payment freeze flag sent to SAP (stub)",
                    "R&C compliance review ticket created (stub)",
                ],
            }
            _save(records)
            return records[i]
    raise HTTPException(status_code=404, detail="Case not found")
