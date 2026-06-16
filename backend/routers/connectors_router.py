from fastapi import APIRouter, File, Form, Query, UploadFile

from connectors import store

router = APIRouter(prefix="/api/connectors", tags=["connectors"])


@router.get("")
async def list_connectors(project_id: str | None = Query(None)):
    records = store.list_connectors(project_id)
    return {"connectors": records, "total": len(records)}


@router.get("/{connector_id}")
async def get_connector(connector_id: str):
    return store.get_connector(connector_id)


@router.post("/file")
async def upload_file_connector(
    project_id: str = Form(...),
    file: UploadFile = File(...),
    name: str = Form(""),
):
    return await store.create_file_connector(
        project_id=project_id,
        file=file,
        name=name.strip() or None,
    )
