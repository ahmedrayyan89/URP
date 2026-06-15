from sentence_transformers import CrossEncoder
import logging
from typing import Optional

logger = logging.getLogger(__name__)


class CrossEncoderReranker:
    def __init__(
        self,
        model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2",
    ):
        logger.info(f"Loading reranker: {model_name}")
        self.model = CrossEncoder(model_name)
        self.model_name = model_name
        logger.info("Reranker ready")

    def rerank(
        self,
        query: str,
        chunks: list[dict],
        top_k: Optional[int] = None,
    ) -> list[dict]:
        if not chunks:
            return []

        pairs = [(query, c["content"]) for c in chunks]
        scores = self.model.predict(pairs)

        scored = sorted(
            [
                {**chunk, "rerank_score": float(score)}
                for chunk, score in zip(chunks, scores)
            ],
            key=lambda x: x["rerank_score"],
            reverse=True,
        )

        return scored[:top_k] if top_k else scored