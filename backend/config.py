from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    # App
    app_name: str = "Unified Risk Platform"
    app_version: str = "1.0.0"
    debug: bool = False

    # Paths
    chroma_db_path: str = "./chroma_db"
    documents_path: str = "./documents"
    metadata_file: str = "./data/ingested_docs.json"

    # Embedding model
    embedding_model: str = "BAAI/bge-small-en-v1.5"
    rerank_model: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"

    # Chunking
    chunk_size: int = 512
    chunk_overlap: int = 64
    min_chunk_size: int = 50

    # Search
    hybrid_alpha: float = 0.6  # weight for vector vs BM25
    default_top_k: int = 5

    # CORS
    allowed_origins: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
    ]

    # Onyx (optional — stub used when disabled)
    onyx_enabled: bool = False
    onyx_base_url: str = ""
    onyx_api_key: str = ""

    # Agents / ADK
    gemini_api_key: str = ""
    urp_encryption_key: str = ""
    google_search_api_key: str = ""

    # Document Intelligence (Azure AI Document Intelligence)
    azure_di_endpoint: str = ""   # AZURE_DI_ENDPOINT env var
    azure_di_key: str = ""        # AZURE_DI_KEY env var

    # OpenAI (used for PO parser LLM extraction step)
    openai_api_key: str = ""      # OPENAI_API_KEY env var

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()