import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile

from integrations.onyx_client import get_onyx_client
from knowledge_bases import documents_store, store
from knowledge_bases.indexing_jobs import reindex_document, schedule_indexing_job
from knowledge_bases.store import (
    CreateKnowledgeBasePayload,
    UpdateKnowledgeBasePayload,
    create_knowledge_base,
    delete_knowledge_base,
    get_knowledge_base,
    list_knowledge_bases,
    patch_knowledge_base,
    update_knowledge_base,
)

UPLOADS_DIR = Path("./data/kb_uploads")
CONNECTORS_DIR = Path("./data/uploads")


def _resolve_sources_for_create(kb: dict) -> list[dict]:
    sources: list[dict] = []

    if kb.get("type") == "structured":
        for table_id in kb.get("structured_table_ids") or []:
            sources.append({"kind": "structured_table", "table_id": table_id})
        return sources

    for ds in kb.get("data_sources") or []:
        kind = ds.get("kind")
        if kind == "file_upload" and ds.get("file_path"):
            path = Path(ds["file_path"])
            sources.append(
                {
                    "kind": "file_upload",
                    "file_name": ds.get("file_name") or path.name,
                    "file_path": str(path),
                    "file_size": path.stat().st_size if path.exists() else 0,
                }
            )
        elif kind == "connector" and ds.get("connector_id"):
            from connectors import store as conn_store

            try:
                conn = conn_store.get_connector(ds["connector_id"])
                stored = conn.get("stored_path")
                if stored:
                    path = Path(stored)
                    sources.append(
                        {
                            "kind": "connector",
                            "file_name": conn.get("file_name"),
                            "file_path": str(path),
                            "file_size": conn.get("size_bytes", 0),
                        }
                    )
            except HTTPException:
                continue

    return sources


def create_kb(payload: CreateKnowledgeBasePayload) -> dict:
    kb = create_knowledge_base(payload)
    onyx = get_onyx_client()
    doc_set_id = onyx.create_document_set(kb)
    patch_knowledge_base(kb["id"], {"onyx_document_set_id": doc_set_id})

    if kb.get("type") == "structured":
        table_ids = kb.get("structured_table_ids") or []
        patch_knowledge_base(
            kb["id"],
            {
                "status": "ready",
                "indexing_progress": 100,
                "document_count": len(table_ids),
                "chunk_count": 0,
            },
        )
        return get_knowledge_base(kb["id"])

    sources = _resolve_sources_for_create(kb)
    if sources:
        onyx.enqueue_indexing(kb["id"], sources)
    else:
        patch_knowledge_base(
            kb["id"],
            {"status": "ready", "indexing_progress": 100},
        )

    return get_knowledge_base(kb["id"])


def get_kb_status(kb_id: str) -> dict:
    kb = get_knowledge_base(kb_id)
    return {
        "id": kb_id,
        "status": kb.get("status", "ready"),
        "progress": kb.get("indexing_progress", 0),
        "document_count": kb.get("document_count", 0),
        "chunk_count": kb.get("chunk_count", 0),
        "error": kb.get("error_message"),
        "updated_at": kb.get("updated_at"),
    }


def list_kb_documents(kb_id: str) -> list[dict]:
    get_knowledge_base(kb_id)
    return documents_store.list_documents(kb_id)


async def upload_kb_document(kb_id: str, file: UploadFile) -> dict:
    kb = get_knowledge_base(kb_id)
    if kb.get("type") != "unstructured":
        raise HTTPException(status_code=400, detail="Only unstructured KBs accept file uploads")

    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename is required")

    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = file.filename.replace("..", "").replace("/", "_").replace("\\", "_")
    stored_name = f"{kb_id}_{uuid.uuid4().hex[:8]}_{safe_name}"
    dest = UPLOADS_DIR / stored_name
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10MB)")
    dest.write_bytes(content)

    sources = [
        {
            "kind": "file_upload",
            "file_name": file.filename,
            "file_path": str(dest),
            "file_size": len(content),
        }
    ]
    patch_knowledge_base(kb_id, {"status": "indexing", "indexing_progress": 0})
    get_onyx_client().enqueue_indexing(kb_id, sources)

    return {"status": "indexing", "file_name": file.filename}


def remove_kb_document(kb_id: str, doc_id: str) -> dict:
    get_knowledge_base(kb_id)
    documents_store.delete_document(kb_id, doc_id)

    from main import document_index, hybrid_searcher, pipeline

    pipeline.delete_document(doc_id)
    doc_count = documents_store.count_documents(kb_id)
    chunk_count = document_index.count_chunks_for_kb(kb_id)
    patch_knowledge_base(
        kb_id,
        {"document_count": doc_count, "chunk_count": chunk_count},
    )
    return {"status": "deleted", "doc_id": doc_id}


async def trigger_reindex(kb_id: str, doc_id: str) -> dict:
    get_knowledge_base(kb_id)
    job_id = await reindex_document(kb_id, doc_id)
    return {"status": "indexing", "job_id": job_id}


def query_kb(kb_id: str, query: str, top_k: int = 5, filters: dict | None = None) -> dict:
    kb = get_knowledge_base(kb_id)
    if not query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    return get_onyx_client().query(kb, query.strip(), top_k, filters)


def trigger_full_reindex(kb_id: str) -> dict:
    kb = get_knowledge_base(kb_id)
    sources = _resolve_sources_for_create(kb)
    if not sources and kb.get("type") == "structured":
        patch_knowledge_base(kb_id, {"status": "ready", "indexing_progress": 100})
        return {"status": "ready"}
    patch_knowledge_base(kb_id, {"status": "indexing", "indexing_progress": 0})
    job_id = get_onyx_client().enqueue_indexing(kb_id, sources)
    return {"status": "indexing", "job_id": job_id}
