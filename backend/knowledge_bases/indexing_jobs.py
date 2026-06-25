"""In-process async indexing jobs for KB documents."""

import asyncio
import logging
import uuid
from datetime import datetime, timezone
from pathlib import Path

from ingestion.models import Document
from knowledge_bases.text_extract import extract_text_from_path

logger = logging.getLogger(__name__)

_jobs: dict[str, dict] = {}


def get_job_status(job_id: str) -> dict:
    return _jobs.get(
        job_id,
        {"job_id": job_id, "status": "unknown", "progress": 0},
    )


def schedule_indexing_job(kb_id: str, sources: list[dict]) -> str:
    job_id = str(uuid.uuid4())
    _jobs[job_id] = {
        "job_id": job_id,
        "kb_id": kb_id,
        "status": "queued",
        "progress": 0,
    }

    async def _runner():
        await _run_indexing_job(job_id, kb_id, sources)

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(_runner())
    except RuntimeError:
        import threading

        def _thread_run():
            asyncio.run(_runner())

        threading.Thread(target=_thread_run, daemon=True).start()

    return job_id


def _resolve_content(source: dict) -> tuple[str, str | None, str | None]:
    content = source.get("content_text") or source.get("content", "")
    file_path = source.get("file_path")
    mime_type = source.get("mime_type")

    if not content and file_path:
        path = Path(file_path)
        if path.exists():
            content, mime_type = extract_text_from_path(path, source.get("file_name"))
            source["file_size"] = path.stat().st_size

    return content, file_path, mime_type


async def _run_indexing_job(job_id: str, kb_id: str, sources: list[dict]) -> None:
    from knowledge_bases import documents_store, store

    try:
        _jobs[job_id]["status"] = "indexing"
        store.patch_knowledge_base(kb_id, {"status": "indexing", "indexing_progress": 5})

        from main import document_index, pipeline

        total = max(len(sources), 1)
        doc_count = 0

        for idx, source in enumerate(sources):
            progress = int(10 + (idx / total) * 80)
            _jobs[job_id]["progress"] = progress
            store.patch_knowledge_base(kb_id, {"indexing_progress": progress})

            content, file_path, mime_type = _resolve_content(source)
            existing_doc_id = source.get("doc_id")

            if existing_doc_id:
                doc_record = documents_store.get_document(kb_id, existing_doc_id)
                documents_store.update_document(
                    kb_id,
                    existing_doc_id,
                    status="indexing",
                    file_path=file_path or doc_record.get("file_path"),
                    mime_type=mime_type or doc_record.get("mime_type"),
                    content_text=content or doc_record.get("content_text"),
                )
                pipeline.delete_document(existing_doc_id)
            else:
                doc_record = documents_store.create_document(
                    kb_id,
                    title=source.get("file_name") or source.get("title") or f"Document {idx + 1}",
                    source=source.get("kind", "upload"),
                    file_name=source.get("file_name"),
                    file_size=source.get("file_size", 0),
                    file_path=file_path,
                    mime_type=mime_type,
                    content_text=content,
                    status="indexing",
                )

            if not content:
                documents_store.update_document(
                    kb_id, doc_record["doc_id"], status="skipped"
                )
                continue

            documents_store.update_document(
                kb_id, doc_record["doc_id"], content_text=content
            )

            document = Document(
                doc_id=doc_record["doc_id"],
                title=doc_record["title"],
                content=content,
                source=source.get("kind", "upload"),
                doc_type="policy",
                category="unstructured",
                metadata={"kb_id": kb_id},
            )

            chunk_count = 0
            async for event in pipeline.ingest_stream(document, kb_id=kb_id):
                if event.get("stage") == "complete":
                    chunk_count = event.get("chunk_count", 0)

            now = datetime.now(timezone.utc).isoformat()
            documents_store.update_document(
                kb_id,
                doc_record["doc_id"],
                status="indexed",
                chunk_count=chunk_count,
                indexed_at=now,
            )
            doc_count += 1

        chunk_total = document_index.count_chunks_for_kb(kb_id)
        store.patch_knowledge_base(
            kb_id,
            {
                "status": "ready",
                "indexing_progress": 100,
                "document_count": documents_store.count_documents(kb_id),
                "chunk_count": chunk_total,
                "onyx_document_set_id": f"stub-{kb_id}",
            },
        )
        _jobs[job_id].update({"status": "ready", "progress": 100})

    except Exception as exc:
        logger.exception("Indexing job failed for KB %s", kb_id)
        _jobs[job_id].update({"status": "error", "error": str(exc)})
        store.patch_knowledge_base(
            kb_id,
            {"status": "error", "error_message": str(exc)},
        )


async def reindex_document(kb_id: str, doc_id: str) -> str:
    from knowledge_bases import documents_store

    doc = documents_store.get_document(kb_id, doc_id)
    sources = [
        {
            "kind": doc.get("source", "reindex"),
            "file_name": doc.get("file_name"),
            "title": doc.get("title"),
            "file_path": doc.get("file_path"),
            "content_text": doc.get("content_text"),
            "file_size": doc.get("file_size", 0),
            "mime_type": doc.get("mime_type"),
            "doc_id": doc_id,
        }
    ]
    return schedule_indexing_job(kb_id, sources)
