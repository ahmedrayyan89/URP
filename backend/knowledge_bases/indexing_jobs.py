"""In-process async indexing jobs for KB documents."""

import asyncio
import logging
import uuid
from pathlib import Path

from ingestion.models import Document

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

            doc_record = documents_store.create_document(
                kb_id,
                title=source.get("file_name") or source.get("title") or f"Document {idx + 1}",
                source=source.get("kind", "upload"),
                file_name=source.get("file_name"),
                file_size=source.get("file_size", 0),
                status="indexing",
            )

            content = source.get("content", "")
            if not content and source.get("file_path"):
                path = Path(source["file_path"])
                if path.exists():
                    content = path.read_text(encoding="utf-8", errors="ignore")
                    source["file_size"] = path.stat().st_size

            if not content:
                documents_store.update_document(
                    kb_id, doc_record["doc_id"], status="skipped"
                )
                continue

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

            documents_store.update_document(
                kb_id,
                doc_record["doc_id"],
                status="indexed",
                chunk_count=chunk_count,
                indexed_at=doc_record["created_at"],
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
        }
    ]
    return schedule_indexing_job(kb_id, sources)
