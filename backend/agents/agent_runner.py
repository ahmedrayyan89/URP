import asyncio
import time

from fastapi import HTTPException

from agents.adk_runner import invoke_built_agent
from agents.import_proxy import invoke_imported
from agents.langgraph_runner import invoke_langgraph_agent
from agents.invocations_store import log_invocation
from agents.store import get_agent


async def invoke_agent(
    agent_id: str,
    query: str,
    session_id: str | None = None,
    context: dict | None = None,
) -> dict:
    agent = get_agent(agent_id, raw=True)
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    start = time.perf_counter()
    status = "success"
    output = ""

    try:
        if agent.get("source") == "imported":
            output = await invoke_imported(
                agent["endpoint_url"],
                agent.get("auth_config"),
                query,
                session_id,
                context,
            )
        elif agent.get("framework") == "langgraph":
            output = await asyncio.to_thread(
                invoke_langgraph_agent, agent, query, session_id, context
            )
        else:
            output = await asyncio.to_thread(invoke_built_agent, agent, query, session_id, context)
    except HTTPException:
        status = "error"
        raise
    except Exception as exc:
        status = "error"
        latency_ms = int((time.perf_counter() - start) * 1000)
        log_invocation(agent_id, query, str(exc), latency_ms, status, session_id)
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    latency_ms = int((time.perf_counter() - start) * 1000)
    log_invocation(agent_id, query, output, latency_ms, status, session_id)

    return {
        "agent_id": agent_id,
        "query": query,
        "answer": output,
        "latency_ms": latency_ms,
        "session_id": session_id,
    }
