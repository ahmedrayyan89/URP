"""Load synthetic procurement demo datasets."""

import csv
import json
from pathlib import Path

DEMO_DIR = Path("./data/demo/procurement")


def _read_csv(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def _read_json(path: Path) -> dict | list:
    if not path.exists():
        return {}
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _read_text(path: Path) -> str:
    if not path.exists():
        return ""
    return path.read_text(encoding="utf-8")


def load_scenario(scenario_id: str) -> dict:
    if scenario_id == "case_010":
        return {
            "ariba_bids": _read_csv(DEMO_DIR / "ariba_event_010.csv"),
            "contract_text": _read_text(DEMO_DIR / "contract_CTR-00010.txt"),
            "contract_id": "CTR-00010",
            "sap_po": _read_json(DEMO_DIR / "sap_po_4500000010.json"),
            "invoice": _read_json(DEMO_DIR / "invoice_010.json"),
            "email": _read_text(DEMO_DIR / "email_carlos_reyes_award.txt"),
            "vendors": _read_json(DEMO_DIR / "vendors.json"),
            "has_evaluation_scorecard": True,
            "has_initial_proposal": True,
            "has_contract": True,
            "has_po": True,
        }
    if scenario_id == "case_011":
        return {
            "ariba_bids": _read_csv(DEMO_DIR / "ariba_event_011.csv"),
            "contract_text": _read_text(DEMO_DIR / "contract_permain_master.txt"),
            "contract_id": "CTR-PERM-2026",
            "sap_gr": _read_json(DEMO_DIR / "sap_gr_011.json"),
            "vendors": _read_json(DEMO_DIR / "vendors.json"),
            "has_evaluation_scorecard": False,
            "has_initial_proposal": False,
            "has_contract": True,
            "has_po": False,
        }
    raise ValueError(f"Unknown scenario: {scenario_id}")


def initial_state(scenario_id: str, project_id: str | None = None) -> dict:
    meta = {
        "case_010": {
            "case_id": "CASE-2026-XOM-010",
            "label": "Downstream — Beaumont Refinery Expansion Turnaround",
        },
        "case_011": {
            "case_id": "CASE-2026-XOM-011",
            "label": "Upstream — Permian Basin Drilling Infrastructure",
        },
    }.get(scenario_id, {"case_id": scenario_id, "label": scenario_id})

    return {
        "case_id": meta["case_id"],
        "project_id": project_id or "procure-guard-demo",
        "scenario_id": scenario_id,
        "label": meta["label"],
        "raw": load_scenario(scenario_id),
        "completeness_score": 0.0,
        "process_flags": [],
        "extractions": [],
        "collusion_signals": [],
        "vendor_profile": {},
        "price_matrix": [],
        "financial_exposure": 0.0,
        "risk_score": 0,
        "severity_band": "Low",
        "narrative": "",
        "evidence_packet": {},
        "status": "running",
        "critic_passed": False,
        "critic_errors": [],
        "critic_attempts": 0,
        "messages": [],
    }
