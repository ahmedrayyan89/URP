from rank_bm25 import BM25Okapi
import numpy as np
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class HybridSearcher:
    def __init__(self, alpha: float = 0.6):
        self.alpha = alpha
        self._bm25: Optional[BM25Okapi] = None
        self._bm25_corpus: list[dict] = []

    def build_bm25_index(self, chunks: list[dict]) -> None:
        if not chunks:
            self._bm25 = None
            self._bm25_corpus = []
            return

        self._bm25_corpus = chunks
        tokenized = [c["content"].lower().split() for c in chunks]
        self._bm25 = BM25Okapi(tokenized)
        logger.info(f"BM25 index built: {len(chunks)} chunks")

    def bm25_search(self, query: str, top_k: int = 10) -> list[dict]:
        if not self._bm25 or not self._bm25_corpus:
            return []

        scores = self._bm25.get_scores(query.lower().split())
        top_indices = np.argsort(scores)[::-1][:top_k]

        return [
            {
                **self._bm25_corpus[i],
                "bm25_score": float(scores[i]),
                "bm25_rank": rank,
            }
            for rank, i in enumerate(top_indices)
            if scores[i] > 0
        ]

    def reciprocal_rank_fusion(
        self,
        vector_results: list[dict],
        bm25_results: list[dict],
        k: int = 60,
    ) -> list[dict]:
        scores: dict[str, float] = {}
        chunk_data: dict[str, dict] = {}

        for rank, hit in enumerate(vector_results):
            cid = hit["chunk_id"]
            scores[cid] = scores.get(cid, 0) + self.alpha * (
                1 / (k + rank + 1)
            )
            chunk_data[cid] = hit

        for rank, hit in enumerate(bm25_results):
            cid = hit["chunk_id"]
            scores[cid] = scores.get(cid, 0) + (1 - self.alpha) * (
                1 / (k + rank + 1)
            )
            if cid not in chunk_data:
                chunk_data[cid] = hit

        sorted_ids = sorted(scores, key=lambda x: scores[x], reverse=True)

        return [
            {**chunk_data[cid], "rrf_score": scores[cid]}
            for cid in sorted_ids
        ]

    def search(
        self,
        query: str,
        query_embedding: list[float],
        vector_results: list[dict],
        top_k: int = 5,
    ) -> list[dict]:
        bm25_results = self.bm25_search(query, top_k=top_k * 2)

        if not bm25_results:
            return vector_results[:top_k]

        fused = self.reciprocal_rank_fusion(vector_results, bm25_results)
        return fused[:top_k]