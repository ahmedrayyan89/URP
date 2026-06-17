from fastapi import APIRouter, Query
from pydantic import BaseModel

from agents.agent_runner import invoke_agent
from agents.import_proxy import test_connection
from agents.invocations_store import list_invocations
from agents.store import (
    CreateBuiltAgentPayload,
    CreateImportedAgentPayload,
    UpdateAgentPayload,
    create_built_agent,
    create_imported_agent,
    delete_agent,
    duplicate_agent,
    get_agent,
    list_agents,
    update_agent,
)
from agents.store import get_agent as get_agent_raw

router = APIRouter(prefix="/api/agents", tags=["agents"])


class InvokePayload(BaseModel):
    query: str
    session_id: str | None = None
    context: dict | None = None


class TestConnectionPayload(BaseModel):
    endpoint_url: str | None = None
    auth_config: dict | None = None


@router.get("")
async def list_agents_endpoint(project_id: str | None = Query(None)):
    records = list_agents(project_id)
    return {"agents": records, "total": len(records)}


@router.post("/import")
async def create_imported(payload: CreateImportedAgentPayload):
    return create_imported_agent(payload)


@router.post("/built")
async def create_built(payload: CreateBuiltAgentPayload):
    return create_built_agent(payload)


@router.post("/test-connection")
async def test_conn_preview(payload: TestConnectionPayload):
    from agents.crypto import encrypt_value

    if not payload.endpoint_url:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Endpoint URL is required")
    auth = None
    if payload.auth_config:
        auth = {
            "type": payload.auth_config.get("type", "none"),
            "encrypted": encrypt_value(payload.auth_config.get("credentials", "")),
        }
    return await test_connection(payload.endpoint_url, auth)


@router.get("/{agent_id}")
async def get_agent_endpoint(agent_id: str):
    return get_agent(agent_id)


@router.patch("/{agent_id}")
async def patch_agent(agent_id: str, payload: UpdateAgentPayload):
    return update_agent(agent_id, payload)


@router.delete("/{agent_id}")
async def remove_agent(agent_id: str):
    delete_agent(agent_id)
    return {"status": "deleted", "id": agent_id}


@router.post("/{agent_id}/duplicate")
async def dup_agent(agent_id: str):
    return duplicate_agent(agent_id)


@router.post("/{agent_id}/test-connection")
async def test_conn(agent_id: str, payload: TestConnectionPayload | None = None):
    agent = get_agent_raw(agent_id, raw=True)
    if agent.get("source") != "imported":
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Only imported agents support connection tests")

    url = (payload.endpoint_url if payload and payload.endpoint_url else None) or agent.get("endpoint_url")
    auth = agent.get("auth_config")
    if payload and payload.auth_config:
        from agents.crypto import encrypt_value
        auth = {
            "type": payload.auth_config.get("type", "none"),
            "encrypted": encrypt_value(payload.auth_config.get("credentials", "")),
        }
    return await test_connection(url, auth)


@router.post("/{agent_id}/invoke")
async def invoke(agent_id: str, payload: InvokePayload):
    return await invoke_agent(agent_id, payload.query, payload.session_id, payload.context)


@router.get("/{agent_id}/invocations")
async def invocations(agent_id: str, limit: int = Query(50, le=200)):
    records = list_invocations(agent_id, limit)
    return {"invocations": records, "total": len(records)}
