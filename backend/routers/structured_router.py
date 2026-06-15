from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from structured import store

router = APIRouter(prefix="/api/structured", tags=["structured"])


class CreateTableRequest(BaseModel):
    template_id: str
    name: str
    description: str = ""


class RowPayload(BaseModel):
    row: dict = Field(default_factory=dict)


class RowsPayload(BaseModel):
    rows: list[dict] = Field(default_factory=list)


@router.get("/templates")
async def list_templates():
    templates = store.list_templates()
    return {"templates": templates, "total": len(templates)}


@router.get("/tables")
async def list_tables():
    tables = store.list_tables_meta()
    return {"tables": tables, "total": len(tables)}


@router.post("/tables")
async def create_table(request: CreateTableRequest):
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Table name is required")
    table = store.create_table_from_template(
        request.template_id,
        request.name,
        request.description,
    )
    return table


@router.post("/tables/import")
async def import_csv_table(
    file: UploadFile = File(...),
    name: str = Form(...),
    description: str = Form(""),
):
    if not name.strip():
        raise HTTPException(status_code=400, detail="Table name is required")
    if not file.filename or not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="File must be a .csv")

    content = await file.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="CSV file too large (max 2MB)")

    return store.create_table_from_csv(name, description, content)


@router.get("/tables/{table_id}")
async def get_table(table_id: str):
    return store.get_table(table_id)


@router.delete("/tables/{table_id}")
async def delete_table(table_id: str):
    store.delete_table(table_id)
    return {"status": "deleted", "table_id": table_id}


@router.put("/tables/{table_id}/rows")
async def replace_rows(table_id: str, payload: RowsPayload):
    return store.replace_rows(table_id, payload.rows)


@router.post("/tables/{table_id}/rows")
async def add_row(table_id: str, payload: RowPayload):
    return store.add_row(table_id, payload.row)


@router.put("/tables/{table_id}/rows/{row_index}")
async def update_row(table_id: str, row_index: int, payload: RowPayload):
    return store.update_row(table_id, row_index, payload.row)


@router.delete("/tables/{table_id}/rows/{row_index}")
async def delete_row(table_id: str, row_index: int):
    return store.delete_row(table_id, row_index)
