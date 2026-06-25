from typing import List
from .models import Document, Chunk


import re


def extractive_summary(text: str, max_len: int = 160) -> str:
    """First sentence or truncated preview for chunk display."""
    cleaned = text.strip()
    if not cleaned:
        return ""
    match = re.search(r"^(.+?[.!?])(?:\s|$)", cleaned, re.DOTALL)
    if match and len(match.group(1)) <= max_len:
        return match.group(1).strip()
    if len(cleaned) <= max_len:
        return cleaned
    return cleaned[: max_len - 3].rstrip() + "..."


class SemanticChunker:
    def __init__(
        self,
        chunk_size: int = 512,
        chunk_overlap: int = 64,
        min_chunk_size: int = 50,
    ):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size

    def _split_into_paragraphs(self, text: str) -> List[str]:
        return [p.strip() for p in text.split("\n\n") if p.strip()]

    def _word_count(self, text: str) -> int:
        return len(text.split())

    def _merge_small_paragraphs(self, paragraphs: List[str]) -> List[str]:
        merged: List[str] = []
        buffer = ""

        for para in paragraphs:
            if not buffer:
                buffer = para
                continue
            if self._word_count(buffer) < self.min_chunk_size:
                buffer = buffer + "\n\n" + para
            else:
                merged.append(buffer)
                buffer = para

        if buffer:
            merged.append(buffer)

        return merged

    def _enforce_size_ceiling(self, paragraphs: List[str]) -> List[str]:
        final_chunks: List[str] = []

        for para in paragraphs:
            words = para.split()
            if len(words) <= self.chunk_size:
                final_chunks.append(para)
                continue

            start = 0
            while start < len(words):
                end = min(start + self.chunk_size, len(words))
                final_chunks.append(" ".join(words[start:end]))
                start += self.chunk_size - self.chunk_overlap

        return final_chunks

    def chunk(self, document: Document) -> List[Chunk]:
        paragraphs = self._split_into_paragraphs(document.content)
        merged = self._merge_small_paragraphs(paragraphs)
        sized = self._enforce_size_ceiling(merged)

        chunks: List[Chunk] = []
        cursor = 0

        for idx, chunk_text in enumerate(sized):
            start_char = document.content.find(
                chunk_text[:40].strip(), cursor
            )
            if start_char == -1:
                start_char = cursor

            end_char = start_char + len(chunk_text)
            cursor = max(cursor, end_char - len(chunk_text) // 4)

            chunks.append(
                Chunk(
                    doc_id=document.doc_id,
                    doc_title=document.title,
                    content=chunk_text,
                    chunk_index=idx,
                    start_char=start_char,
                    end_char=end_char,
                    metadata={
                        "source": document.source,
                        "doc_type": document.doc_type,
                        "category": document.category,
                        "created_at": document.created_at,
                        "summary": extractive_summary(chunk_text),
                    },
                )
            )

        return chunks