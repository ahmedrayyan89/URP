from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel

from procurement.extractors.contract_extractor import extract_from_contract, extract_from_email
from knowledge_bases.text_extract import extract_text_from_path
from pathlib import Path
import tempfile

router = APIRouter(prefix="/api/document-intelligence", tags=["document-intelligence"])


class ExtractPayload(BaseModel):
    text: str
    doc_type: str = "contract"
    doc_id: str = "document"


@router.post("/extract")
async def extract_from_text(payload: ExtractPayload):
    if payload.doc_type == "email":
        extractions = extract_from_email(payload.text)
    else:
        extractions = extract_from_contract(payload.text, payload.doc_id)
    return {"extractions": extractions, "count": len(extractions)}


@router.post("/upload")
async def extract_from_upload(file: UploadFile = File(...), doc_type: str = "contract"):
    suffix = Path(file.filename or "doc.txt").suffix or ".txt"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = Path(tmp.name)

    text, mime = extract_text_from_path(tmp_path, file.filename)
    doc_id = Path(file.filename or "document").stem

    if doc_type == "email" or "email" in (file.filename or "").lower():
        extractions = extract_from_email(text)
    else:
        extractions = extract_from_contract(text, doc_id)

    tmp_path.unlink(missing_ok=True)

    return {
        "filename": file.filename,
        "mime_type": mime,
        "extractions": extractions,
        "text_preview": text[:500],
        "count": len(extractions),
    }
