import json
import os
import logging
from datetime import datetime
from typing import AsyncGenerator
from pathlib import Path

from .models import Document, Chunk, IngestedDocument
from .chunker import SemanticChunker
from .embedder import DocumentEmbedder

logger = logging.getLogger(__name__)


class IngestionPipeline:
    def __init__(
        self,
        document_index,
        embedder: DocumentEmbedder,
        hybrid_searcher,
        metadata_file: str = "./data/ingested_docs.json",
        chunk_size: int = 512,
        chunk_overlap: int = 64,
    ):
        self.document_index = document_index
        self.embedder = embedder
        self.hybrid_searcher = hybrid_searcher
        self.chunker = SemanticChunker(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
        )
        self.metadata_file = metadata_file
        self._ensure_data_dir()
        self._load_metadata()

    def _ensure_data_dir(self):
        Path(self.metadata_file).parent.mkdir(parents=True, exist_ok=True)

    def _load_metadata(self):
        if os.path.exists(self.metadata_file):
            with open(self.metadata_file, "r") as f:
                self._metadata: dict[str, dict] = json.load(f)
        else:
            self._metadata = {}

    def _save_metadata(self):
        with open(self.metadata_file, "w") as f:
            json.dump(self._metadata, f, indent=2)

    def get_all_documents(self) -> list[IngestedDocument]:
        return [
            IngestedDocument(**doc)
            for doc in self._metadata.values()
        ]

    def get_document(self, doc_id: str) -> dict | None:
        return self._metadata.get(doc_id)

    async def ingest_stream(
        self, document: Document, kb_id: str | None = None
    ) -> AsyncGenerator[dict, None]:
        yield {
            "stage": "start",
            "message": f"Initializing ingestion for '{document.title}'",
            "doc_id": document.doc_id,
        }

        # Step 1: Chunking
        yield {
            "stage": "chunking",
            "message": "Splitting document into semantic chunks...",
        }

        chunks = self.chunker.chunk(document)
        effective_kb_id = kb_id or document.metadata.get("kb_id", "_legacy")
        for chunk in chunks:
            chunk.metadata["kb_id"] = effective_kb_id
            chunk.metadata.setdefault("doc_type", document.doc_type)
            chunk.metadata.setdefault("source", document.source)

        yield {
            "stage": "chunking_complete",
            "message": f"Created {len(chunks)} chunks",
            "chunk_count": len(chunks),
            "chunks_preview": [
                {
                    "index": c.chunk_index,
                    "content": (
                        c.content[:120] + "..."
                        if len(c.content) > 120
                        else c.content
                    ),
                    "word_count": len(c.content.split()),
                }
                for c in chunks
            ],
        }

        # Step 2: Embedding
        yield {
            "stage": "embedding",
            "message": f"Generating embeddings for {len(chunks)} chunks...",
            "total_chunks": len(chunks),
        }

        texts = [chunk.content for chunk in chunks]
        embeddings = self.embedder.embed_documents(texts)

        yield {
            "stage": "embedding_complete",
            "message": "Embeddings generated successfully",
            "embedding_dim": len(embeddings[0]) if embeddings else 0,
        }

        # Step 3: Storing
        yield {
            "stage": "storing",
            "message": "Writing chunks to vector index...",
        }

        self.document_index.upsert_chunks(chunks, embeddings)

        # Step 4: Metadata
        ingested_doc = IngestedDocument(
            doc_id=document.doc_id,
            title=document.title,
            source=document.source,
            doc_type=document.doc_type,
            category=document.category,
            chunk_count=len(chunks),
            ingested_at=datetime.utcnow().isoformat(),
            status="indexed",
            file_size=len(document.content.encode("utf-8")),
        )
        self._metadata[document.doc_id] = ingested_doc.model_dump()
        self._save_metadata()

        # Step 5: Rebuild BM25
        yield {
            "stage": "indexing",
            "message": "Rebuilding keyword search index...",
        }

        all_chunks = self.document_index.get_all_chunks()
        self.hybrid_searcher.build_bm25_index(all_chunks)

        yield {
            "stage": "complete",
            "message": f"'{document.title}' successfully ingested",
            "doc_id": document.doc_id,
            "chunk_count": len(chunks),
            "status": "indexed",
        }

    def delete_document(self, doc_id: str) -> dict:
        deleted_count = self.document_index.delete_document(doc_id)

        if doc_id in self._metadata:
            del self._metadata[doc_id]
            self._save_metadata()

        all_chunks = self.document_index.get_all_chunks()
        self.hybrid_searcher.build_bm25_index(all_chunks)

        return {"deleted_chunks": deleted_count}