"""Seed procurement entity definitions."""

import json
from pathlib import Path

DEFS_FILE = Path("./data/entity_definitions.json")
PROJECT_ID = "procure-guard-demo"

PROCUREMENT_DEFS = [
    {
        "id": "proc-def-case",
        "project_id": PROJECT_ID,
        "name": "Procurement Case",
        "slug": "procurement_case",
        "description": "Fraud and compliance investigation case",
        "schema": {
            "type": "object",
            "properties": {
                "case_id": {"type": "string"},
                "risk_score": {"type": "number"},
                "financial_exposure": {"type": "number"},
                "status": {"type": "string"},
                "label": {"type": "string"},
            },
            "required": ["case_id"],
        },
        "source_type": "agent",
    },
    {
        "id": "proc-def-vendor",
        "project_id": PROJECT_ID,
        "name": "Vendor",
        "slug": "vendor",
        "description": "Vendor master with risk profile",
        "schema": {
            "type": "object",
            "properties": {
                "vendor_id": {"type": "string"},
                "name": {"type": "string"},
                "risk_tier": {"type": "string"},
                "sanctions_hit": {"type": "boolean"},
            },
            "required": ["vendor_id", "name"],
        },
        "source_type": "structured",
    },
    {
        "id": "proc-def-po",
        "project_id": PROJECT_ID,
        "name": "Purchase Order",
        "slug": "purchase_order",
        "description": "SAP purchase order line",
        "schema": {
            "type": "object",
            "properties": {
                "po_number": {"type": "string"},
                "unit_price": {"type": "number"},
                "quantity": {"type": "number"},
                "vendor_id": {"type": "string"},
            },
            "required": ["po_number"],
        },
        "source_type": "structured",
    },
    {
        "id": "proc-def-extraction",
        "project_id": PROJECT_ID,
        "name": "Contract Extraction",
        "slug": "contract_extraction",
        "description": "LexAI structured clause extraction",
        "schema": {
            "type": "object",
            "properties": {
                "field": {"type": "string"},
                "value": {"type": "string"},
                "confidence": {"type": "number"},
                "page": {"type": "number"},
                "section": {"type": "string"},
            },
            "required": ["field", "value"],
        },
        "source_type": "document_intelligence",
    },
    {
        "id": "proc-def-bid",
        "project_id": PROJECT_ID,
        "name": "Bid Event",
        "slug": "bid_event",
        "description": "Ariba sourcing event metadata",
        "schema": {
            "type": "object",
            "properties": {
                "event_id": {"type": "string"},
                "vendor_name": {"type": "string"},
                "unit_price": {"type": "number"},
                "status": {"type": "string"},
            },
            "required": ["event_id"],
        },
        "source_type": "structured",
    },
]


def seed_entity_definitions() -> int:
    DEFS_FILE.parent.mkdir(parents=True, exist_ok=True)
    existing = []
    if DEFS_FILE.exists():
        with open(DEFS_FILE, encoding="utf-8") as f:
            existing = json.load(f)

    slugs = {d.get("slug") for d in existing}
    added = 0
    for defn in PROCUREMENT_DEFS:
        if defn["slug"] not in slugs:
            from datetime import datetime, timezone
            now = datetime.now(timezone.utc).isoformat()
            existing.append({**defn, "created_at": now, "updated_at": now})
            added += 1

    with open(DEFS_FILE, "w", encoding="utf-8") as f:
        json.dump(existing, f, indent=2, ensure_ascii=False)
    return added
