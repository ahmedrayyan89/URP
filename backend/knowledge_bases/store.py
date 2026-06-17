import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from pydantic import BaseModel, Field

KB_FILE = Path("./data/knowledge_bases.json")


class ChunkingConfigPayload(BaseModel):
    strategy: str = "semantic"
    chunk_size: int = 512
    overlap: int = 64


class RetrievalConfigPayload(BaseModel):
    use_vector: bool = True
    use_bm25: bool = True
    use_knowledge_graph: bool = False


class DataSourceItem(BaseModel):
    kind: str
    connector_id: str | None = None
    file_path: str | None = None
    file_name: str | None = None
    table_id: str | None = None


class ConnectionConfigPayload(BaseModel):
    host: str = ""
    port: int = 5432
    database: str = ""
    username: str = ""
    password: str = ""


class CreateKnowledgeBasePayload(BaseModel):
    project_id: str
    name: str
    description: str = ""
    type: str = "unstructured"
    chunking_config: ChunkingConfigPayload = Field(default_factory=ChunkingConfigPayload)
    retrieval_config: RetrievalConfigPayload = Field(default_factory=RetrievalConfigPayload)
    data_sources: list[DataSourceItem] = Field(default_factory=list)
    structured_table_ids: list[str] = Field(default_factory=list)
    connection_config: ConnectionConfigPayload | None = None


class UpdateKnowledgeBasePayload(BaseModel):
    name: str | None = None
    description: str | None = None


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "_", value)
    return value[:48] or "kb"


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def migrate_legacy_kb_record(record: dict) -> dict:
    if "chunking_config" in record:
        return record

    strategy_map = {
        "semantic": "semantic",
        "fixed_size": "fixed_size",
        "sliding_window": "sliding_window",
    }
    strategy = strategy_map.get(
        record.get("indexing_strategy", "semantic"), "semantic"
    )

    data_sources = []
    legacy_ds = record.get("data_source") or {}
    if legacy_ds.get("kind") == "connectors":
        for cid in legacy_ds.get("connector_ids") or []:
            data_sources.append({"kind": "connector", "connector_id": cid})
    elif legacy_ds.get("kind") == "file_upload" and legacy_ds.get("file_name"):
        data_sources.append(
            {
                "kind": "file_upload",
                "file_name": legacy_ds.get("file_name"),
            }
        )

    return {
        "id": record["id"],
        "project_id": record["project_id"],
        "name": record["name"],
        "description": record.get("description", ""),
        "type": record.get("type", "unstructured"),
        "chunking_config": {
            "strategy": strategy,
            "chunk_size": 512,
            "overlap": 64,
        },
        "retrieval_config": {
            "use_vector": True,
            "use_bm25": True,
            "use_knowledge_graph": bool(record.get("knowledge_graph", False)),
        },
        "onyx_document_set_id": record.get("onyx_document_set_id"),
        "data_sources": data_sources,
        "structured_table_ids": record.get("structured_table_ids") or [],
        "connection_config": record.get("connection_config"),
        "status": record.get("status", "ready"),
        "indexing_progress": record.get("indexing_progress", 100),
        "document_count": record.get("document_count", 0),
        "chunk_count": record.get("chunk_count", 0),
        "error_message": record.get("error_message"),
        "created_at": record.get("created_at", _now()),
        "updated_at": record.get("updated_at", record.get("created_at", _now())),
    }


def _load_raw() -> list[dict]:
    if not KB_FILE.exists():
        return []
    with open(KB_FILE, encoding="utf-8") as f:
        return json.load(f)


def _load() -> list[dict]:
    records = _load_raw()
    migrated = [migrate_legacy_kb_record(r) for r in records]
    if migrated != records:
        _save(migrated)
    return migrated


def _save(records: list[dict]) -> None:
    KB_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(KB_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def list_knowledge_bases(project_id: str | None = None) -> list[dict]:
    records = _load()
    if project_id:
        records = [r for r in records if r.get("project_id") == project_id]
    return records


def get_knowledge_base(kb_id: str) -> dict:
    record = next((r for r in _load() if r["id"] == kb_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return record


def create_knowledge_base(payload: CreateKnowledgeBasePayload) -> dict:
    if not payload.name.strip():
        raise HTTPException(status_code=400, detail="Name is required")

    records = _load()
    base_id = _slugify(payload.name)
    kb_id = base_id
    if any(r["id"] == kb_id for r in records):
        kb_id = f"{base_id}_{uuid.uuid4().hex[:6]}"

    now = _now()
    record = {
        "id": kb_id,
        "project_id": payload.project_id,
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "type": payload.type,
        "chunking_config": payload.chunking_config.model_dump(),
        "retrieval_config": payload.retrieval_config.model_dump(),
        "onyx_document_set_id": None,
        "data_sources": [ds.model_dump() for ds in payload.data_sources],
        "structured_table_ids": payload.structured_table_ids,
        "connection_config": (
            payload.connection_config.model_dump()
            if payload.connection_config
            else None
        ),
        "status": "initializing",
        "indexing_progress": 0,
        "document_count": 0,
        "chunk_count": 0,
        "error_message": None,
        "created_at": now,
        "updated_at": now,
    }
    records.append(record)
    _save(records)
    return record


def update_knowledge_base(kb_id: str, payload: UpdateKnowledgeBasePayload) -> dict:
    records = _load()
    for i, r in enumerate(records):
        if r["id"] == kb_id:
            if payload.name is not None:
                records[i]["name"] = payload.name.strip()
            if payload.description is not None:
                records[i]["description"] = payload.description.strip()
            records[i]["updated_at"] = _now()
            _save(records)
            return records[i]
    raise HTTPException(status_code=404, detail="Knowledge base not found")


def patch_knowledge_base(kb_id: str, fields: dict) -> dict:
    records = _load()
    for i, r in enumerate(records):
        if r["id"] == kb_id:
            records[i] = {**r, **fields, "updated_at": _now()}
            _save(records)
            return records[i]
    raise HTTPException(status_code=404, detail="Knowledge base not found")


def delete_knowledge_base(kb_id: str) -> None:
    records = _load()
    if not any(r["id"] == kb_id for r in records):
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    _save([r for r in records if r["id"] != kb_id])
