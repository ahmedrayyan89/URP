import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException
from pydantic import BaseModel, Field

from agents.crypto import encrypt_value, mask_auth_config

AGENTS_FILE = Path("./data/agents.json")


class AuthConfigPayload(BaseModel):
    type: str = "none"
    credentials: str = ""


class McpServerPayload(BaseModel):
    name: str
    url: str
    auth_type: str = "none"
    credentials: str = ""


class ToolConfigPayload(BaseModel):
    id: str
    type: str
    config: dict = Field(default_factory=dict)


class CreateImportedAgentPayload(BaseModel):
    project_id: str
    name: str
    description: str = ""
    endpoint_url: str
    auth_config: AuthConfigPayload = Field(default_factory=AuthConfigPayload)
    import_platform: str | None = None
    platform_config: dict = Field(default_factory=dict)
    icon_color: str = "#3b82f6"
    status: str = "draft"


class CreateBuiltAgentPayload(BaseModel):
    project_id: str
    name: str
    description: str = ""
    system_prompt: str = ""
    model: str = "gemini-2.5-flash"
    temperature: float = 0.7
    icon_color: str = "#3b82f6"
    framework: str = "adk"
    graph_id: str | None = None
    agent_role: str | None = None
    tools: list[ToolConfigPayload] = Field(default_factory=list)
    attached_knowledge_bases: list[str] = Field(default_factory=list)
    attached_mcp_servers: list[McpServerPayload] = Field(default_factory=list)
    attached_entities: list[str] = Field(default_factory=list)
    attached_tool_ids: list[str] = Field(default_factory=list)
    status: str = "draft"


class UpdateAgentPayload(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    icon_color: str | None = None
    endpoint_url: str | None = None
    auth_config: AuthConfigPayload | None = None
    system_prompt: str | None = None
    model: str | None = None
    temperature: float | None = None
    framework: str | None = None
    graph_id: str | None = None
    agent_role: str | None = None
    tools: list[ToolConfigPayload] | None = None
    attached_knowledge_bases: list[str] | None = None
    attached_mcp_servers: list[McpServerPayload] | None = None
    attached_entities: list[str] | None = None
    attached_tool_ids: list[str] | None = None


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load() -> list[dict]:
    if not AGENTS_FILE.exists():
        return []
    with open(AGENTS_FILE, encoding="utf-8") as f:
        return json.load(f)


def _save(records: list[dict]) -> None:
    AGENTS_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(AGENTS_FILE, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


def _sanitize_agent(record: dict) -> dict:
    out = dict(record)
    if out.get("auth_config"):
        out["auth_config"] = mask_auth_config(out["auth_config"])
    tools = out.get("tools") or []
    for tool in tools:
        cfg = tool.get("config") or {}
        if "google_api_key_encrypted" in cfg:
            cfg["google_api_key_encrypted"] = "***"
    out["tools"] = tools
    for mcp in out.get("attached_mcp_servers") or []:
        if mcp.get("auth_encrypted"):
            mcp["auth_encrypted"] = "***"
    return out


def list_agents(project_id: str | None = None) -> list[dict]:
    records = _load()
    if project_id:
        records = [r for r in records if r.get("project_id") == project_id]
    return [_sanitize_agent(r) for r in records]


def get_agent(agent_id: str, raw: bool = False) -> dict:
    record = next((r for r in _load() if r["id"] == agent_id), None)
    if not record:
        raise HTTPException(status_code=404, detail="Agent not found")
    return record if raw else _sanitize_agent(record)


def create_imported_agent(payload: CreateImportedAgentPayload) -> dict:
    auth = {
        "type": payload.auth_config.type,
        "encrypted": encrypt_value(payload.auth_config.credentials)
        if payload.auth_config.credentials
        else "",
    }
    record = {
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "source": "imported",
        "status": payload.status,
        "icon_color": payload.icon_color,
        "framework": "external",
        "endpoint_url": payload.endpoint_url.strip(),
        "auth_config": auth,
        "import_platform": payload.import_platform,
        "platform_config": payload.platform_config,
        "system_prompt": None,
        "model": None,
        "temperature": None,
        "tools": [],
        "attached_knowledge_bases": [],
        "attached_mcp_servers": [],
        "attached_entities": [],
        "attached_tool_ids": [],
        "created_at": _now(),
        "updated_at": _now(),
    }
    records = _load()
    records.append(record)
    _save(records)
    return _sanitize_agent(record)


def create_built_agent(payload: CreateBuiltAgentPayload) -> dict:
    tools = []
    for t in payload.tools:
        cfg = dict(t.config)
        if t.type == "web_search" and cfg.get("google_api_key"):
            cfg["google_api_key_encrypted"] = encrypt_value(cfg.pop("google_api_key"))
        tools.append({"id": t.id, "type": t.type, "config": cfg})

    mcp_servers = []
    for m in payload.attached_mcp_servers:
        mcp_servers.append(
            {
                "name": m.name,
                "url": m.url,
                "auth_type": m.auth_type,
                "auth_encrypted": encrypt_value(m.credentials) if m.credentials else "",
            }
        )

    record = {
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "name": payload.name.strip(),
        "description": payload.description.strip(),
        "source": "built",
        "status": payload.status,
        "icon_color": payload.icon_color,
        "framework": payload.framework,
        "graph_id": payload.graph_id,
        "agent_role": payload.agent_role,
        "endpoint_url": None,
        "auth_config": None,
        "system_prompt": payload.system_prompt,
        "model": payload.model,
        "temperature": payload.temperature,
        "tools": tools,
        "attached_knowledge_bases": payload.attached_knowledge_bases,
        "attached_mcp_servers": mcp_servers,
        "attached_entities": payload.attached_entities,
        "attached_tool_ids": payload.attached_tool_ids,
        "created_at": _now(),
        "updated_at": _now(),
    }
    records = _load()
    records.append(record)
    _save(records)
    return _sanitize_agent(record)


def update_agent(agent_id: str, payload: UpdateAgentPayload) -> dict:
    records = _load()
    for i, r in enumerate(records):
        if r["id"] != agent_id:
            continue
        fields = {}
        for key in ("name", "description", "status", "icon_color", "endpoint_url",
                    "system_prompt", "model", "temperature", "attached_knowledge_bases",
                    "attached_entities", "attached_tool_ids", "framework", "graph_id", "agent_role"):
            val = getattr(payload, key, None)
            if val is not None:
                fields[key] = val.strip() if isinstance(val, str) else val

        if payload.auth_config is not None:
            fields["auth_config"] = {
                "type": payload.auth_config.type,
                "encrypted": encrypt_value(payload.auth_config.credentials)
                if payload.auth_config.credentials
                else r.get("auth_config", {}).get("encrypted", ""),
            }
        if payload.tools is not None:
            tools = []
            for t in payload.tools:
                cfg = dict(t.config)
                if t.type == "web_search" and cfg.get("google_api_key"):
                    cfg["google_api_key_encrypted"] = encrypt_value(cfg.pop("google_api_key"))
                tools.append({"id": t.id, "type": t.type, "config": cfg})
            fields["tools"] = tools
        if payload.attached_mcp_servers is not None:
            fields["attached_mcp_servers"] = [
                {
                    "name": m.name,
                    "url": m.url,
                    "auth_type": m.auth_type,
                    "auth_encrypted": encrypt_value(m.credentials) if m.credentials else "",
                }
                for m in payload.attached_mcp_servers
            ]

        records[i] = {**r, **fields, "updated_at": _now()}
        _save(records)
        return _sanitize_agent(records[i])

    raise HTTPException(status_code=404, detail="Agent not found")


def delete_agent(agent_id: str) -> None:
    records = _load()
    filtered = [r for r in records if r["id"] != agent_id]
    if len(filtered) == len(records):
        raise HTTPException(status_code=404, detail="Agent not found")
    _save(filtered)


def duplicate_agent(agent_id: str) -> dict:
    original = get_agent(agent_id, raw=True)
    copy = {**original}
    copy["id"] = str(uuid.uuid4())
    copy["name"] = f"{original['name']} (copy)"
    copy["status"] = "draft"
    copy["created_at"] = _now()
    copy["updated_at"] = _now()
    records = _load()
    records.append(copy)
    _save(records)
    return _sanitize_agent(copy)


def list_agents_for_entity(definition_id: str) -> list[dict]:
    return [
        _sanitize_agent(r)
        for r in _load()
        if definition_id in (r.get("attached_entities") or [])
    ]
