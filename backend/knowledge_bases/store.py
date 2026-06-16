import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from pydantic import BaseModel, Field

KB_FILE = Path("./data/knowledge_bases.json")


class DataSourcePayload(BaseModel):
    kind: str
    file_name: str | None = None
    connector_ids: list[str] = Field(default_factory=list)


class CreateKnowledgeBasePayload(BaseModel):
    project_id: str
    name: str
    description: str = ""
    type: str = "unstructured"
    indexing_strategy: str = "semantic"
    vector_db: str = "chromadb"
    knowledge_graph: bool = False
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    data_source: DataSourcePayload


def _slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "_", value)
    return value[:48] or "kb"


def _load() -> list[dict]:
    if not KB_FILE.exists():
        return []
    with open(KB_FILE, encoding="utf-8") as f:
        return json.load(f)


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

    record = {
        "id": kb_id,
        "project_id": payload.project_id,
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "type": payload.type,
        "indexing_strategy": payload.indexing_strategy,
        "vector_db": payload.vector_db,
        "knowledge_graph": payload.knowledge_graph,
        "embedding_model": payload.embedding_model,
        "data_source": payload.data_source.model_dump(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    records.append(record)
    _save(records)
    return record


def delete_knowledge_base(kb_id: str) -> None:
    records = _load()
    if not any(r["id"] == kb_id for r in records):
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    _save([r for r in records if r["id"] != kb_id])
