import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException

DOCS_FILE = Path("./data/kb_documents.json")


def _load() -> list[dict]:
    if not DOCS_FILE.exists():
        return []
    with open(DOCS_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    DOCS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DOCS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def list_documents(kb_id: str) -> list[dict]:
    return [r for r in _load() if r.get("kb_id") == kb_id]


def get_document(kb_id: str, doc_id: str) -> dict:
    record = next(
        (r for r in _load() if r["kb_id"] == kb_id and r["doc_id"] == doc_id),
        None,
    )
    if not record:
        raise HTTPException(status_code=404, detail="Document not found")
    return record


def create_document(
    kb_id: str,
    *,
    title: str,
    source: str,
    file_name: str | None = None,
    file_size: int = 0,
    file_path: str | None = None,
    mime_type: str | None = None,
    content_text: str | None = None,
    status: str = "pending",
    doc_id: str | None = None,
) -> dict:
    now = datetime.now(timezone.utc).isoformat()
    record = {
        "doc_id": doc_id or str(uuid.uuid4()),
        "kb_id": kb_id,
        "title": title,
        "source": source,
        "file_name": file_name,
        "file_size": file_size,
        "file_path": file_path,
        "mime_type": mime_type,
        "content_text": content_text,
        "status": status,
        "chunk_count": 0,
        "indexed_at": None,
        "created_at": now,
        "updated_at": now,
    }
    records = _load()
    records.append(record)
    _save(records)
    return record


def update_document(kb_id: str, doc_id: str, **fields) -> dict:
    records = _load()
    for i, r in enumerate(records):
        if r["kb_id"] == kb_id and r["doc_id"] == doc_id:
            records[i] = {
                **r,
                **fields,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }
            _save(records)
            return records[i]
    raise HTTPException(status_code=404, detail="Document not found")


def delete_document(kb_id: str, doc_id: str) -> None:
    records = _load()
    filtered = [r for r in records if not (r["kb_id"] == kb_id and r["doc_id"] == doc_id)]
    if len(filtered) == len(records):
        raise HTTPException(status_code=404, detail="Document not found")
    _save(filtered)


def count_documents(kb_id: str) -> int:
    return len(list_documents(kb_id))
