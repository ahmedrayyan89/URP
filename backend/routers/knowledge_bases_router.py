from fastapi import APIRouter, Query

from knowledge_bases.store import (
    CreateKnowledgeBasePayload,
    create_knowledge_base,
    delete_knowledge_base,
    get_knowledge_base,
    list_knowledge_bases,
)

router = APIRouter(prefix="/api/knowledge-bases", tags=["knowledge-bases"])


@router.get("")
async def list_kbs(project_id: str | None = Query(None)):
    records = list_knowledge_bases(project_id)
    return {"knowledge_bases": records, "total": len(records)}


@router.post("")
async def create_kb(payload: CreateKnowledgeBasePayload):
    return create_knowledge_base(payload)


@router.get("/{kb_id}")
async def get_kb(kb_id: str):
    return get_knowledge_base(kb_id)


@router.delete("/{kb_id}")
async def delete_kb(kb_id: str):
    delete_knowledge_base(kb_id)
    return {"status": "deleted", "id": kb_id}
