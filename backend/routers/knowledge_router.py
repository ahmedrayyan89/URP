from fastapi import APIRouter, HTTPException
from pathlib import Path

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


def get_pipeline():
    from main import pipeline
    return pipeline


def get_index():
    from main import document_index
    return document_index


@router.get("/documents")
async def list_documents():
    _pipeline = get_pipeline()
    _index = get_index()
    docs = _pipeline.get_all_documents()
    stats = _index.collection_stats()
    return {
        "documents": [d.model_dump() for d in docs],
        "total_chunks": stats["total_chunks"],
        "total_documents": len(docs),
    }


@router.get("/documents/{doc_id}/chunks")
async def get_chunks(doc_id: str):
    _index = get_index()
    chunks = _index.get_document_chunks(doc_id)
    if not chunks:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"doc_id": doc_id, "chunks": chunks, "count": len(chunks)}


@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    _pipeline = get_pipeline()
    result = _pipeline.delete_document(doc_id)
    return {"status": "deleted", **result}


@router.get("/preload")
async def list_preload_docs():
    from config import get_settings
    settings = get_settings()
    docs_dir = Path(settings.documents_path)

    if not docs_dir.exists():
        return {"documents": []}

    docs = []
    for filepath in sorted(docs_dir.glob("*.txt")):
        content = filepath.read_text(encoding="utf-8")
        docs.append(
            {
                "filename": filepath.name,
                "title": filepath.stem.replace("_", " ").title(),
                "size": len(content.encode("utf-8")),
                "preview": content[:200],
                "line_count": content.count("\n"),
            }
        )
    return {"documents": docs}


@router.get("/stats")
async def get_stats():
    _pipeline = get_pipeline()
    _index = get_index()
    docs = _pipeline.get_all_documents()
    stats = _index.collection_stats()

    total_size = sum(d.file_size or 0 for d in docs)

    return {
        "total_documents": len(docs),
        "total_chunks": stats["total_chunks"],
        "total_size_bytes": total_size,
        "documents_by_type": _count_by_field(docs, "doc_type"),
        "documents_by_category": _count_by_field(docs, "category"),
    }


def _count_by_field(docs, field: str) -> dict:
    counts: dict[str, int] = {}
    for doc in docs:
        val = getattr(doc, field, "unknown")
        counts[val] = counts.get(val, 0) + 1
    return counts