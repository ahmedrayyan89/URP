import chromadb
from chromadb.config import Settings
import logging
from typing import Optional
from ingestion.models import Chunk

logger = logging.getLogger(__name__)

COLLECTION_NAME = "risk_platform_documents"


class ChromaDocumentIndex:
    def __init__(self, persist_dir: str = "./chroma_db"):
        self.client = chromadb.PersistentClient(
            path=persist_dir,
            settings=Settings(anonymized_telemetry=False),
        )
        self.collection = self.client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        logger.info(
            f"ChromaDB ready. Collection has "
            f"{self.collection.count()} chunks."
        )

    def upsert_chunks(
        self,
        chunks: list[Chunk],
        embeddings: list[list[float]],
    ) -> None:
        if not chunks:
            return

        self.collection.upsert(
            ids=[c.chunk_id for c in chunks],
            embeddings=embeddings,
            documents=[c.content for c in chunks],
            metadatas=[
                {
                    "doc_id": c.doc_id,
                    "doc_title": c.doc_title,
                    "chunk_index": c.chunk_index,
                    "source": c.metadata.get("source", ""),
                    "doc_type": c.metadata.get("doc_type", ""),
                    "category": c.metadata.get("category", "unstructured"),
                    "created_at": c.metadata.get("created_at", ""),
                    "start_char": c.start_char,
                    "end_char": c.end_char,
                }
                for c in chunks
            ],
        )
        logger.info(f"Upserted {len(chunks)} chunks")

    def vector_search(
        self,
        query_embedding: list[float],
        top_k: int = 10,
        where: Optional[dict] = None,
    ) -> list[dict]:
        count = self.collection.count()
        if count == 0:
            return []

        kwargs = {
            "query_embeddings": [query_embedding],
            "n_results": min(top_k, count),
            "include": ["documents", "metadatas", "distances"],
        }
        if where:
            kwargs["where"] = where

        results = self.collection.query(**kwargs)

        return [
            {
                "chunk_id": doc_id,
                "content": results["documents"][0][i],
                "metadata": results["metadatas"][0][i],
                "score": 1 - results["distances"][0][i],
            }
            for i, doc_id in enumerate(results["ids"][0])
        ]

    def get_all_chunks(self) -> list[dict]:
        if self.collection.count() == 0:
            return []

        results = self.collection.get(
            include=["documents", "metadatas"]
        )
        return [
            {
                "chunk_id": chunk_id,
                "content": results["documents"][i],
                "metadata": results["metadatas"][i],
            }
            for i, chunk_id in enumerate(results["ids"])
        ]

    def delete_document(self, doc_id: str) -> int:
        results = self.collection.get(
            where={"doc_id": doc_id}, include=[]
        )
        ids = results["ids"]
        if ids:
            self.collection.delete(ids=ids)
        return len(ids)

    def get_document_chunks(self, doc_id: str) -> list[dict]:
        results = self.collection.get(
            where={"doc_id": doc_id},
            include=["documents", "metadatas"],
        )
        chunks = [
            {
                "chunk_id": chunk_id,
                "content": results["documents"][i],
                "metadata": results["metadatas"][i],
            }
            for i, chunk_id in enumerate(results["ids"])
        ]
        return sorted(
            chunks, key=lambda x: x["metadata"].get("chunk_index", 0)
        )

    def collection_stats(self) -> dict:
        return {"total_chunks": self.collection.count()}