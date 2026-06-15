from sentence_transformers import SentenceTransformer
import logging

logger = logging.getLogger(__name__)


class DocumentEmbedder:
    def __init__(self, model_name: str = "BAAI/bge-small-en-v1.5"):
        logger.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.model_name = model_name
        self.embedding_dim = self.model.get_sentence_embedding_dimension()
        logger.info(f"Embedding model ready. Dim: {self.embedding_dim}")

    def embed_documents(self, texts: list[str]) -> list[list[float]]:
        prefixed = [f"Represent this sentence: {t}" for t in texts]
        embeddings = self.model.encode(
            prefixed,
            batch_size=32,
            show_progress_bar=False,
            normalize_embeddings=True,
        )
        return embeddings.tolist()

    def embed_query(self, query: str) -> list[float]:
        prefixed = (
            f"Represent this question for searching relevant passages: {query}"
        )
        return self.model.encode(
            prefixed, normalize_embeddings=True
        ).tolist()

    def get_info(self) -> dict:
        return {
            "model_name": self.model_name,
            "embedding_dim": self.embedding_dim,
        }