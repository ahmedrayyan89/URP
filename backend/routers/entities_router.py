from fastapi import APIRouter, Query

from entities.service import (
    CreateEntityInstancePayload,
    UpdateEntityInstancePayload,
    create_instance,
    delete_instance,
    get_instance,
    list_all_instances,
    list_instances_by_slug,
    update_instance,
)

router = APIRouter(prefix="/api/entities", tags=["entities"])


@router.get("/instances")
async def list_all(
    project_id: str | None = Query(None),
    status: str | None = Query(None),
    definition_id: str | None = Query(None),
):
    records = list_all_instances(project_id, status, definition_id)
    return {"instances": records, "total": len(records)}


@router.get("/instances/{instance_id}")
async def get_inst(instance_id: str):
    return get_instance(instance_id)


@router.get("/{slug}")
async def list_by_slug(
    slug: str,
    project_id: str = Query(...),
    status: str | None = Query(None),
):
    records = list_instances_by_slug(slug, project_id, status)
    return {"instances": records, "total": len(records)}


@router.post("/{slug}")
async def create_inst(slug: str, payload: CreateEntityInstancePayload):
    return create_instance(slug, payload.project_id, payload)


@router.get("/{slug}/{instance_id}")
async def get_inst_by_slug(slug: str, instance_id: str, project_id: str = Query(...)):
    inst = get_instance(instance_id)
    if inst.get("definition", {}).get("slug") != slug:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Instance not found for this entity type")
    return inst


@router.patch("/{slug}/{instance_id}")
async def patch_inst(
    slug: str,
    instance_id: str,
    payload: UpdateEntityInstancePayload,
    project_id: str = Query(...),
):
    return update_instance(instance_id, slug, project_id, payload)


@router.delete("/{slug}/{instance_id}")
async def remove_inst(slug: str, instance_id: str):
    delete_instance(instance_id)
    return {"status": "deleted", "id": instance_id}
