import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from document_index.chroma_index import ChromaDocumentIndex
from ingestion.embedder import DocumentEmbedder
from ingestion.pipeline import IngestionPipeline
from retrieval.reranker import CrossEncoderReranker
from retrieval.search import HybridSearcher
from routers.ingestion_router import router as ingestion_router
from routers.knowledge_router import router as knowledge_router
from routers.retrieval_router import router as retrieval_router
from routers.structured_router import router as structured_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# ── Globals ───────────────────────────────────────────────────────
document_index: ChromaDocumentIndex = None
embedder: DocumentEmbedder = None
hybrid_searcher: HybridSearcher = None
reranker: CrossEncoderReranker = None
pipeline: IngestionPipeline = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global document_index, embedder, hybrid_searcher, reranker, pipeline

    logger.info("Starting Unified Risk Platform...")

    # Ensure data directory exists
    Path("./data").mkdir(exist_ok=True)

    document_index = ChromaDocumentIndex(
        persist_dir=settings.chroma_db_path
    )
    embedder = DocumentEmbedder(model_name=settings.embedding_model)
    hybrid_searcher = HybridSearcher(alpha=settings.hybrid_alpha)
    reranker = CrossEncoderReranker(model_name=settings.rerank_model)
    pipeline = IngestionPipeline(
        document_index=document_index,
        embedder=embedder,
        hybrid_searcher=hybrid_searcher,
        metadata_file=settings.metadata_file,
        chunk_size=settings.chunk_size,
        chunk_overlap=settings.chunk_overlap,
    )

    # Bootstrap BM25
    existing = document_index.get_all_chunks()
    if existing:
        hybrid_searcher.build_bm25_index(existing)
        logger.info(f"BM25 bootstrapped: {len(existing)} chunks")

    logger.info("Unified Risk Platform ready")
    yield

    logger.info("Shutting down")


app = FastAPI(
    title="Unified Risk Platform API",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────
app.include_router(ingestion_router)
app.include_router(knowledge_router)
app.include_router(retrieval_router)
app.include_router(structured_router)


@app.get("/api/health")
async def health():
    stats = document_index.collection_stats()
    return {
        "status": "ok",
        "platform": settings.app_name,
        "version": settings.app_version,
        "vector_store": stats,
        "embedding_model": embedder.get_info(),
        "bm25_ready": hybrid_searcher._bm25 is not None,
    }