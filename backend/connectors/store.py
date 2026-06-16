import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile

CONNECTORS_FILE = Path("./data/configured_connectors.json")
UPLOADS_DIR = Path("./data/uploads")


def _load() -> list[dict]:
    if not CONNECTORS_FILE.exists():
        return []
    with open(CONNECTORS_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    CONNECTORS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(CONNECTORS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def list_connectors(project_id: str | None = None) -> list[dict]:
    records = _load()
    if project_id:
        records = [r for r in records if r.get("project_id") == project_id]
    return records


def get_connector(connector_id: str) -> dict:
    record = next((r for r in _load() if r["id"] == connector_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Connector not found")
    return record


async def create_file_connector(
    project_id: str,
    file: UploadFile,
    name: str | None = None,
) -> dict:
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    connector_id = str(uuid.uuid4())
    safe_name = file.filename.replace("..", "").replace("/", "_").replace("\\", "_")
    stored_name = f"{connector_id}_{safe_name}"
    dest = UPLOADS_DIR / stored_name

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")

    dest.write_bytes(content)

    record = {
        "id": connector_id,
        "project_id": project_id,
        "type": "file",
        "name": name or file.filename,
        "status": "active",
        "file_name": file.filename,
        "stored_path": str(dest),
        "size_bytes": len(content),
        "content_type": file.content_type or "application/octet-stream",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    records = _load()
    records.append(record)
    _save(records)
    return record
