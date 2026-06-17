from fastapi import APIRouter, Query

from entities.service import (
    CreateEntityDefinitionPayload,
    UpdateEntityDefinitionPayload,
    create_definition,
    delete_definition,
    get_definition,
    list_definitions,
    update_definition,
)

router = APIRouter(prefix="/api/entity-definitions", tags=["entity-definitions"])


@router.get("")
async def list_defs(project_id: str | None = Query(None)):
    records = list_definitions(project_id)
    return {"definitions": records, "total": len(records)}


@router.post("")
async def create_def(payload: CreateEntityDefinitionPayload):
    return create_definition(payload)


@router.get("/{definition_id}")
async def get_def(definition_id: str):
    return get_definition(definition_id)


@router.patch("/{definition_id}")
async def patch_def(definition_id: str, payload: UpdateEntityDefinitionPayload):
    return update_definition(definition_id, payload)


@router.delete("/{definition_id}")
async def remove_def(definition_id: str):
    delete_definition(definition_id)
    return {"status": "deleted", "id": definition_id}
