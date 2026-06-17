"""Google ADK runtime — only file that imports google.adk."""

import logging

from config import get_settings

logger = logging.getLogger(__name__)


def invoke_built_agent(
    agent: dict,
    query: str,
    session_id: str | None = None,
    context: dict | None = None,
) -> str:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError(
            "GEMINI_API_KEY is not configured. Set it in .env to run built agents with ADK."
        )

    import os
    os.environ.setdefault("GOOGLE_API_KEY", settings.gemini_api_key)
    os.environ.setdefault("GEMINI_API_KEY", settings.gemini_api_key)

    try:
        from google.adk import Agent
        from google.adk.tools import FunctionTool
    except ImportError as exc:
        raise RuntimeError(
            "google-adk is not installed. Run: pip install google-adk"
        ) from exc

    tools = _build_tools(agent)

    instruction = agent.get("system_prompt") or "You are a helpful assistant."
    if agent.get("description"):
        instruction = f"{instruction}\n\nContext: {agent['description']}"

    adk_agent = Agent(
        name=agent.get("name", "agent").replace(" ", "_").lower()[:48],
        model=agent.get("model", "gemini-2.5-flash"),
        instruction=instruction,
        tools=tools,
    )

    prompt = query
    if context:
        prompt = f"Context: {context}\n\nUser query: {query}"

    try:
        response = adk_agent.run(prompt)
        if hasattr(response, "text"):
            return response.text
        if isinstance(response, str):
            return response
        return str(response)
    except Exception as exc:
        logger.exception("ADK agent run failed")
        return f"Agent execution error: {exc}"


def _build_tools(agent: dict) -> list:
    from google.adk.tools import FunctionTool

    tools = []

    for kb_id in agent.get("attached_knowledge_bases") or []:
        tool_fn = _make_kb_tool(kb_id)
        if tool_fn:
            tools.append(FunctionTool(tool_fn))

    for tool_cfg in agent.get("tools") or []:
        if tool_cfg.get("type") == "web_search":
            ws = _make_web_search_tool(tool_cfg.get("config") or {})
            if ws:
                tools.append(FunctionTool(ws))

    for entity_id in agent.get("attached_entities") or []:
        et = _make_entity_tool(entity_id)
        if et:
            tools.append(FunctionTool(et))

    for mcp in agent.get("attached_mcp_servers") or []:
        mt = _make_mcp_stub_tool(mcp)
        if mt:
            tools.append(FunctionTool(mt))

    return tools


def _make_kb_tool(kb_id: str):
    from knowledge_bases import store as kb_store
    from knowledge_bases.kb_service import query_kb

    try:
        kb = kb_store.get_knowledge_base(kb_id)
    except Exception:
        return None

    kb_name = kb.get("name", kb_id)
    kb_desc = kb.get("description") or f"Search the {kb_name} knowledge base"

    def search_kb(query: str, top_k: int = 5) -> str:
        """Search attached knowledge base for relevant information."""
        result = query_kb(kb_id, query, top_k)
        chunks = result.get("chunks") or []
        if not chunks:
            return result.get("answer", "No results found.")
        parts = [f"Answer: {result.get('answer', '')}"]
        for c in chunks[:top_k]:
            parts.append(f"[{c.get('retriever')}] {c.get('content', '')[:400]}")
        return "\n\n".join(parts)

    search_kb.__name__ = f"search_{kb_name.replace(' ', '_').lower()[:32]}"
    search_kb.__doc__ = kb_desc
    return search_kb


def _make_web_search_tool(config: dict):
    from agents.crypto import decrypt_value

    encrypted = config.get("google_api_key_encrypted", "")
    api_key = decrypt_value(encrypted) if encrypted else ""

    def web_search(query: str) -> str:
        """Search the web for current information."""
        if not api_key:
            return "Web search is not configured (missing Google API key)."
        try:
            import httpx

            resp = httpx.get(
                "https://www.googleapis.com/customsearch/v1",
                params={"key": api_key, "cx": "stub", "q": query},
                timeout=10,
            )
            if resp.status_code == 200:
                items = resp.json().get("items", [])
                return "\n".join(i.get("snippet", "") for i in items[:3]) or "No results."
            return f"Web search unavailable (HTTP {resp.status_code}). Configure Custom Search Engine ID for full support."
        except Exception as exc:
            return f"Web search error: {exc}"

    return web_search


def _make_entity_tool(entity_id: str):
    from entities.json_repository import get_definition_repo, get_instance_repo

    repo = get_definition_repo()
    definition = repo.find_definition_by_id(entity_id)
    if not definition:
        return None

    slug = definition.get("slug", entity_id)
    name = definition.get("name", slug)

    def query_entities(limit: int = 10) -> str:
        """Query entity instances for structured data."""
        inst_repo = get_instance_repo()
        instances = inst_repo.list_instances(definition_id=entity_id)[:limit]
        if not instances:
            return f"No instances found for entity type {name}."
        import json

        return json.dumps([i.get("data") for i in instances], indent=2)

    query_entities.__name__ = f"query_{slug}"
    query_entities.__doc__ = definition.get("description") or f"Query {name} entity instances"
    return query_entities


def _make_mcp_stub_tool(mcp: dict):
    name = mcp.get("name", "mcp")

    def mcp_tool(query: str) -> str:
        """MCP server tool (stub — full MCP wiring in follow-up)."""
        return f"MCP server '{name}' at {mcp.get('url')} is configured but not fully connected in this build."

    mcp_tool.__name__ = f"mcp_{name.replace(' ', '_').lower()[:24]}"
    mcp_tool.__doc__ = f"Tools from MCP server {name}"
    return mcp_tool
