"""
document_intelligence.py

FastAPI router for the Document Intelligence subsystem.

Endpoints:
  POST /upload   — upload a file, run the parser, save entity, return EntityRecord
  GET  /parsers  — return static list of available parsers (for frontend dropdown)

Error handling:
  400 → unknown parser_type
  502 → Azure DI failure
  422 → Pydantic validation failure (FastAPI default)
  500 → any other unexpected error
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from entities.schemas.entity_record import EntityRecord
from repositories.entity_repository import EntityRepository
from services.document_service import DocumentService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/document-intelligence",
    tags=["Document Intelligence"],
)

# ── Dependency: async DB session ──────────────────────────────────────────────
# Imported lazily so circular imports are avoided if this module is loaded early.

def _get_session():
    """Yield an async session from the shared engine (configured in main.py)."""
    from main import async_session_factory  # noqa: PLC0415
    return async_session_factory


async def get_db_session() -> AsyncSession:  # type: ignore[return]
    session_factory = _get_session()
    async with session_factory() as session:
        yield session


# ── Static parser list (source of truth for the frontend) ─────────────────────
_PARSER_LIST = [
    {
        "type":    "invoice",
        "label":   "Invoice Parser",
        "status":  "available",
        "accepts": ["pdf", "jpg", "png"],
        "description": "Extract vendor, line items, totals and payment terms from invoices.",
        "icon":    "invoice",
    },
    {
        "type":    "purchase_order",
        "label":   "Purchase Order Parser",
        "status":  "available",
        "accepts": ["pdf", "jpg", "png"],
        "description": "Extract PO number, line items, delivery dates and contract references.",
        "icon":    "po",
    },
]


# ── GET /parsers ───────────────────────────────────────────────────────────────

@router.get("/parsers")
async def list_parsers():
    """
    Return the list of available parser types.
    The frontend populates its dropdown from this endpoint.
    """
    return _PARSER_LIST


# ── POST /upload ───────────────────────────────────────────────────────────────

@router.post("/upload", response_model=EntityRecord)
async def upload_document(
    file:         UploadFile,
    parser_type:  str = Form(...),
    project_id:   str = Form(...),
    db:           AsyncSession = Depends(get_db_session),
):
    """
    Upload a document, run the specified parser, and save the extracted entity.

    Form fields:
      - file        : the document file (PDF, JPG, PNG)
      - parser_type : "invoice" | "purchase_order"
      - project_id  : project identifier (use "default_project" for now)

    Returns:
      EntityRecord on success (200).
    """
    repo    = EntityRepository(db)
    service = DocumentService(repo)

    # Read file bytes
    try:
        file_bytes = await file.read()
    except Exception as exc:
        logger.error("upload_document: failed to read file — %s", exc)
        raise HTTPException(status_code=500, detail="Failed to read uploaded file.")

    filename = file.filename or "unknown"

    try:
        result = await service.process(
            file_bytes  = file_bytes,
            filename    = filename,
            parser_type = parser_type,
            project_id  = project_id,
        )
        return result

    except ValueError as exc:
        # Unknown parser_type
        logger.warning("upload_document: unknown parser_type=%s", parser_type)
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        )

    except RuntimeError as exc:
        # Azure DI failure or LLM failure
        error_msg = str(exc)
        logger.error("upload_document: processing error — %s", error_msg)
        if "azure" in error_msg.lower() or "document" in error_msg.lower() or "credential" in error_msg.lower():
            raise HTTPException(
                status_code=502,
                detail=f"Document extraction failed: {error_msg}",
            )
        raise HTTPException(status_code=502, detail=f"Document extraction failed: {error_msg}")

    except Exception as exc:
        logger.error("upload_document: unexpected error — %s", exc, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {exc}")
