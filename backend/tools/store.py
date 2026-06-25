import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from pydantic import BaseModel, Field

from knowledge_bases.store import get_knowledge_base

TOOLS_FILE = Path("./data/tools.json")


class CreateToolPayload(BaseModel):
    project_id: str
    name: str
    description: str = ""
    type: str = "kb_retrieval"
    config: dict = Field(default_factory=dict)
    status: str = "active"


class UpdateToolPayload(BaseModel):
    name: str | None = None
    description: str | None = None
    config: dict | None = None
    status: str | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> list[dict]:
    if not TOOLS_FILE.exists():
        return []
    with open(TOOLS_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    TOOLS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TOOLS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def list_tools(project_id: str | None = None) -> list[dict]:
    records = _load()
    if project_id:
        records = [r for r in records if r.get("project_id") == project_id]
    return records


def get_tool(tool_id: str, raw: bool = True) -> dict:
    record = next((r for r in _load() if r["id"] == tool_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Tool not found")
    return record


def create_tool(payload: CreateToolPayload) -> dict:
    if payload.type == "kb_retrieval":
        kb_id = payload.config.get("kb_id")
        if not kb_id:
            raise HTTPException(status_code=400, detail="kb_id is required for kb_retrieval tools")
        kb = get_knowledge_base(kb_id)
        config = {
            "kb_id": kb_id,
            "kb_name": kb.get("name"),
            "endpoint": f"/api/knowledge-bases/{kb_id}/query",
        }
    else:
        raise HTTPException(status_code=400, detail=f"Unsupported tool type: {payload.type}")

    record = {
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "type": payload.type,
        "config": config,
        "status": payload.status,
        "created_at": _now(),
        "updated_at": _now(),
    }
    records = _load()
    records.append(record)
    _save(records)
    return record


def update_tool(tool_id: str, payload: UpdateToolPayload) -> dict:
    records = _load()
    for i, r in enumerate(records):
        if r["id"] != tool_id:
            continue
        fields = {}
        for key in ("name", "description", "status", "config"):
            val = getattr(payload, key, None)
            if val is not None:
                fields[key] = val.strip() if isinstance(val, str) else val
        if payload.config is not None and r.get("type") == "kb_retrieval":
            kb_id = payload.config.get("kb_id") or r["config"].get("kb_id")
            if kb_id:
                kb = get_knowledge_base(kb_id)
                fields["config"] = {
                    "kb_id": kb_id,
                    "kb_name": kb.get("name"),
                    "endpoint": f"/api/knowledge-bases/{kb_id}/query",
                }
        records[i] = {**r, **fields, "updated_at": _now()}
        _save(records)
        return records[i]
    raise HTTPException(status_code=404, detail="Tool not found")


def delete_tool(tool_id: str) -> None:
    records = _load()
    filtered = [r for r in records if r["id"] != tool_id]
    if len(filtered) == len(records):
        raise HTTPException(status_code=404, detail="Tool not found")
    _save(filtered)
