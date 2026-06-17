import time

import httpx
from fastapi import HTTPException

from agents.crypto import decrypt_value


def _build_headers(auth_config: dict | None) -> dict:
    if not auth_config:
        return {}
    auth_type = auth_config.get("type", "none")
    creds = decrypt_value(auth_config.get("encrypted", ""))
    if auth_type == "none" or not creds:
        return {}
    if auth_type == "api_key":
        return {"X-API-Key": creds}
    if auth_type == "bearer":
        return {"Authorization": f"Bearer {creds}"}
    if auth_type == "basic":
        return {"Authorization": f"Basic {creds}"}
    return {}


async def test_connection(endpoint_url: str, auth_config: dict | None) -> dict:
    if not endpoint_url.strip():
        raise HTTPException(status_code=400, detail="Endpoint URL is required")

    headers = _build_headers(auth_config)
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.get(endpoint_url, headers=headers)
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": resp.status_code < 400,
            "status_code": resp.status_code,
            "latency_ms": latency_ms,
        }
    except httpx.RequestError as exc:
        latency_ms = int((time.perf_counter() - start) * 1000)
        return {
            "ok": False,
            "status_code": 0,
            "latency_ms": latency_ms,
            "error": str(exc),
        }


async def invoke_imported(
    endpoint_url: str,
    auth_config: dict | None,
    query: str,
    session_id: str | None = None,
    context: dict | None = None,
) -> str:
    headers = {**_build_headers(auth_config), "Content-Type": "application/json"}
    body = {"query": query, "session_id": session_id, "context": context or {}}

    async with httpx.AsyncClient(timeout=60.0) as client:
        resp = await client.post(endpoint_url, json=body, headers=headers)
        if resp.status_code >= 400:
            raise HTTPException(
                status_code=502,
                detail=f"External agent returned {resp.status_code}: {resp.text[:200]}",
            )
        try:
            data = resp.json()
            return data.get("answer") or data.get("response") or data.get("output") or str(data)
        except Exception:
            return resp.text
