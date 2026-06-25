from fastapi import APIRouter, Query

from tools.store import (
    CreateToolPayload,
    UpdateToolPayload,
    create_tool,
    delete_tool,
    get_tool,
    list_tools,
    update_tool,
)

router = APIRouter(prefix="/api/tools", tags=["tools"])


@router.get("")
async def list_tools_endpoint(project_id: str | None = Query(None)):
    records = list_tools(project_id)
    return {"tools": records, "total": len(records)}


@router.post("")
async def create_tool_endpoint(payload: CreateToolPayload):
    return create_tool(payload)


@router.get("/{tool_id}")
async def get_tool_endpoint(tool_id: str):
    return get_tool(tool_id)


@router.patch("/{tool_id}")
async def patch_tool_endpoint(tool_id: str, payload: UpdateToolPayload):
    return update_tool(tool_id, payload)


@router.delete("/{tool_id}")
async def delete_tool_endpoint(tool_id: str):
    delete_tool(tool_id)
    return {"status": "deleted", "id": tool_id}
