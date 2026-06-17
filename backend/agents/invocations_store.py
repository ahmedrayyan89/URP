import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

INVOCATIONS_FILE = Path("./data/agent_invocations.json")


def _load() -> list[dict]:
    if not INVOCATIONS_FILE.exists():
        return []
    with open(INVOCATIONS_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    INVOCATIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INVOCATIONS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def log_invocation(
    agent_id: str,
    query: str,
    output: str,
    latency_ms: int,
    status: str,
    session_id: str | None = None,
) -> dict:
    record = {
        "id": str(uuid.uuid4()),
        "agent_id": agent_id,
        "session_id": session_id,
        "input": query,
        "output": output,
        "latency_ms": latency_ms,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    records = _load()
    records.append(record)
    # Keep last 500 per agent in file (simple trim)
    if len(records) > 2000:
        records = records[-2000:]
    _save(records)
    return record


def list_invocations(agent_id: str, limit: int = 50) -> list[dict]:
    records = [r for r in _load() if r["agent_id"] == agent_id]
    return list(reversed(records[-limit:]))
