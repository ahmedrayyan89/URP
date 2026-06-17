"""Onyx integration boundary — stub implementation until onyx_enabled=True."""

import logging
from typing import Any

from config import get_settings

logger = logging.getLogger(__name__)


class OnyxClient:
    def __init__(self):
        settings = get_settings()
        self.enabled = settings.onyx_enabled
        self.base_url = settings.onyx_base_url
        self.api_key = settings.onyx_api_key

    def create_document_set(self, kb: dict) -> str | None:
        if self.enabled:
            raise NotImplementedError("Real Onyx HTTP integration not yet implemented")
        return f"stub-{kb['id']}"

    def enqueue_indexing(self, kb_id: str, sources: list[dict]) -> str:
        if self.enabled:
            raise NotImplementedError("Real Onyx HTTP integration not yet implemented")
        from knowledge_bases.indexing_jobs import schedule_indexing_job

        return schedule_indexing_job(kb_id, sources)

    def get_indexing_status(self, job_id: str) -> dict[str, Any]:
        if self.enabled:
            raise NotImplementedError("Real Onyx HTTP integration not yet implemented")
        from knowledge_bases.indexing_jobs import get_job_status

        return get_job_status(job_id)

    def query(
        self,
        kb: dict,
        query: str,
        top_k: int = 5,
        filters: dict | None = None,
    ) -> dict[str, Any]:
        if self.enabled:
            raise NotImplementedError("Real Onyx HTTP integration not yet implemented")

        if kb.get("type") == "structured":
            from knowledge_bases.query_repository import execute_structured_query

            return execute_structured_query(kb, query, top_k)

        return _local_hybrid_query(kb, query, top_k, filters)


def _local_hybrid_query(
    kb: dict,
    query: str,
    top_k: int,
    filters: dict | None,
) -> dict[str, Any]:
    from main import document_index, embedder, hybrid_searcher

    kb_id = kb["id"]
    retrieval = kb.get("retrieval_config") or {}
    use_vector = retrieval.get("use_vector", True)
    use_bm25 = retrieval.get("use_bm25", True)
    use_graph = retrieval.get("use_knowledge_graph", False)

    where = {"kb_id": kb_id}
    if filters:
        where.update(filters)

    tagged_chunks: list[dict] = []
    vector_results: list[dict] = []
    bm25_results: list[dict] = []

    if use_vector:
        query_embedding = embedder.embed_query(query)
        vector_results = document_index.vector_search(
            query_embedding=query_embedding,
            top_k=top_k * 3,
            where=where,
        )
        for hit in vector_results:
            tagged_chunks.append(
                {
                    "chunk_id": hit["chunk_id"],
                    "content": hit["content"],
                    "score": hit.get("score", 0),
                    "retriever": "vector",
                    "metadata": hit.get("metadata", {}),
                }
            )

    if use_bm25:
        kb_corpus = [
            c
            for c in document_index.get_all_chunks()
            if c.get("metadata", {}).get("kb_id") == kb_id
        ]
        if kb_corpus:
            hybrid_searcher.build_bm25_index(kb_corpus)
            raw_bm25 = hybrid_searcher.bm25_search(query, top_k=top_k * 2)
            for hit in raw_bm25:
                bm25_results.append(hit)
                tagged_chunks.append(
                    {
                        "chunk_id": hit["chunk_id"],
                        "content": hit["content"],
                        "score": hit.get("bm25_score", 0),
                        "retriever": "bm25",
                        "metadata": hit.get("metadata", {}),
                    }
                )

    if use_graph:
        tagged_chunks.append(
            {
                "chunk_id": "graph-stub",
                "content": "Knowledge graph retrieval is not enabled in this build.",
                "score": 0,
                "retriever": "graph",
                "metadata": {"stub": True},
            }
        )

    # Fuse vector + bm25 when both enabled
    final: list[dict] = []
    if use_vector and use_bm25 and vector_results and bm25_results:
        fused = hybrid_searcher.reciprocal_rank_fusion(vector_results, bm25_results)
        seen: set[str] = set()
        for hit in fused[:top_k]:
            cid = hit["chunk_id"]
            if cid in seen:
                continue
            seen.add(cid)
            retriever = "vector" if any(v["chunk_id"] == cid for v in vector_results) else "bm25"
            if any(v["chunk_id"] == cid for v in vector_results) and any(
                b["chunk_id"] == cid for b in bm25_results
            ):
                retriever = "vector+bm25"
            final.append(
                {
                    "chunk_id": cid,
                    "content": hit["content"],
                    "score": hit.get("rrf_score", hit.get("score", 0)),
                    "retriever": retriever,
                    "metadata": hit.get("metadata", {}),
                }
            )
    else:
        # Dedupe by chunk_id keeping highest score
        best: dict[str, dict] = {}
        for chunk in tagged_chunks:
            cid = chunk["chunk_id"]
            if cid not in best or chunk["score"] > best[cid]["score"]:
                best[cid] = chunk
        final = sorted(best.values(), key=lambda x: x["score"], reverse=True)[:top_k]

    answer = (
        final[0]["content"][:500] + ("..." if len(final[0]["content"]) > 500 else "")
        if final
        else "No relevant chunks found for this knowledge base."
    )

    sources = list(
        {
            hit.get("metadata", {}).get("doc_title")
            or hit.get("metadata", {}).get("source")
            or "unknown"
            for hit in final
        }
    )

    return {
        "query": query,
        "answer": answer,
        "chunks": final,
        "sources": sources,
        "total_results": len(final),
    }


_onyx_client: OnyxClient | None = None


def get_onyx_client() -> OnyxClient:
    global _onyx_client
    if _onyx_client is None:
        _onyx_client = OnyxClient()
    return _onyx_client
