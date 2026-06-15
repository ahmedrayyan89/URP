import asyncio
import json
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ingestion.models import Document

router = APIRouter(prefix="/api/ingest", tags=["ingestion"])


class IngestRequest(BaseModel):
    title: str
    content: str
    source: str
    doc_type: str = "policy"
    category: str = "unstructured"


def get_pipeline():
    from main import pipeline
    return pipeline


@router.post("/stream")
async def ingest_stream(request: IngestRequest):
    _pipeline = get_pipeline()
    document = Document(
        title=request.title,
        content=request.content,
        source=request.source,
        doc_type=request.doc_type,
        category=request.category,
    )

    async def event_generator():
        async for event in _pipeline.ingest_stream(document):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.05)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/preload/{filename}")
async def ingest_preloaded(filename: str):
    _pipeline = get_pipeline()
    from config import get_settings
    settings = get_settings()

    filepath = Path(settings.documents_path) / filename
    if not filepath.exists():
        raise HTTPException(status_code=404, detail="File not found")

    content = filepath.read_text(encoding="utf-8")
    title = filepath.stem.replace("_", " ").title()

    document = Document(
        title=title,
        content=content,
        source=filename,
        doc_type="policy",
        category="unstructured",
    )

    async def event_generator():
        async for event in _pipeline.ingest_stream(document):
            yield f"data: {json.dumps(event)}\n\n"
            await asyncio.sleep(0.05)
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )