"""Extract plain text from uploaded KB files."""

import mimetypes
from pathlib import Path


def guess_mime_type(path: Path, file_name: str | None = None) -> str:
    name = file_name or path.name
    mime, _ = mimetypes.guess_type(name)
    return mime or "application/octet-stream"


def extract_text_from_path(path: Path, file_name: str | None = None) -> tuple[str, str]:
    """Return (text, mime_type) for a file on disk."""
    mime = guess_mime_type(path, file_name)
    suffix = path.suffix.lower()

    if suffix == ".pdf" or mime == "application/pdf":
        return _extract_pdf(path), "application/pdf"

    if suffix in (".txt", ".md", ".csv", ".json", ".html", ".xml") or mime.startswith("text/"):
        return path.read_text(encoding="utf-8", errors="ignore"), mime

    # Fallback: try UTF-8 decode
    return path.read_text(encoding="utf-8", errors="ignore"), mime


def _extract_pdf(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        return ""

    try:
        reader = PdfReader(str(path))
        parts = []
        for page in reader.pages:
            text = page.extract_text() or ""
            if text.strip():
                parts.append(text)
        return "\n\n".join(parts)
    except Exception:
        return ""
