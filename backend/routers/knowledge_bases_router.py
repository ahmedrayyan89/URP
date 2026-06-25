from fastapi import APIRouter, File, Query, UploadFile
from pydantic import BaseModel

from knowledge_bases import store
from knowledge_bases.kb_service import (
    create_kb,
    get_kb_document,
    get_kb_document_chunks,
    get_kb_document_content,
    get_kb_status,
    list_kb_documents,
    query_kb,
    remove_kb_document,
    trigger_full_reindex,
    trigger_reindex,
    upload_kb_document,
)
from knowledge_bases.store import (
    CreateKnowledgeBasePayload,
    UpdateKnowledgeBasePayload,
    delete_knowledge_base,
    get_knowledge_base,
    list_knowledge_bases,
    update_knowledge_base,
)

router = APIRouter(prefix="/api/knowledge-bases", tags=["knowledge-bases"])


class QueryPayload(BaseModel):
    query: str
    top_k: int = 5
    filters: dict | None = None


@router.get("")
async def list_kbs(project_id: str | None = Query(None)):
    records = list_knowledge_bases(project_id)
    return {"knowledge_bases": records, "total": len(records)}


@router.post("")
async def create_kb_endpoint(payload: CreateKnowledgeBasePayload):
    return create_kb(payload)


@router.get("/{kb_id}")
async def get_kb(kb_id: str):
    return get_knowledge_base(kb_id)


@router.patch("/{kb_id}")
async def patch_kb(kb_id: str, payload: UpdateKnowledgeBasePayload):
    return update_knowledge_base(kb_id, payload)


@router.delete("/{kb_id}")
async def delete_kb(kb_id: str):
    delete_knowledge_base(kb_id)
    return {"status": "deleted", "id": kb_id}


@router.get("/{kb_id}/status")
async def kb_status(kb_id: str):
    return get_kb_status(kb_id)


@router.get("/{kb_id}/documents")
async def kb_documents(kb_id: str):
    docs = list_kb_documents(kb_id)
    return {"documents": docs, "total": len(docs)}


@router.post("/{kb_id}/documents")
async def kb_upload_document(kb_id: str, file: UploadFile = File(...)):
    return await upload_kb_document(kb_id, file)


@router.get("/{kb_id}/documents/{doc_id}")
async def kb_get_document(kb_id: str, doc_id: str):
    return get_kb_document(kb_id, doc_id)


@router.get("/{kb_id}/documents/{doc_id}/content")
async def kb_get_document_content(kb_id: str, doc_id: str):
    return get_kb_document_content(kb_id, doc_id)


@router.get("/{kb_id}/documents/{doc_id}/chunks")
async def kb_get_document_chunks(kb_id: str, doc_id: str):
    return get_kb_document_chunks(kb_id, doc_id)


@router.post("/{kb_id}/documents/{doc_id}/reindex")
async def kb_reindex_document(kb_id: str, doc_id: str):
    return await trigger_reindex(kb_id, doc_id)


@router.delete("/{kb_id}/documents/{doc_id}")
async def kb_delete_document(kb_id: str, doc_id: str):
    return remove_kb_document(kb_id, doc_id)


@router.post("/{kb_id}/query")
async def kb_query(kb_id: str, payload: QueryPayload):
    return query_kb(kb_id, payload.query, payload.top_k, payload.filters)


@router.post("/{kb_id}/reindex")
async def kb_reindex_all(kb_id: str):
    return trigger_full_reindex(kb_id)
