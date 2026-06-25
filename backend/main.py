import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from config import get_settings
from document_index.chroma_index import ChromaDocumentIndex
from entities.models.entity_model import Base as DIBase
from ingestion.embedder import DocumentEmbedder
from ingestion.pipeline import IngestionPipeline
from retrieval.reranker import CrossEncoderReranker
from retrieval.search import HybridSearcher
from routers.ingestion_router import router as ingestion_router
from routers.knowledge_router import router as knowledge_router
from routers.agents_router import router as agents_router
from routers.entity_definitions_router import router as entity_definitions_router
from routers.entities_router import router as entities_router
from routers.connectors_router import router as connectors_router
from routers.knowledge_bases_router import router as knowledge_bases_router
from routers.retrieval_router import router as retrieval_router
from routers.document_intelligence_router import router as document_intelligence_router
from routers.procurement_router import router as procurement_router
from routers.tools_router import router as tools_router
from routers.structured_router import router as structured_router
from routers.document_intelligence import router as di_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

settings = get_settings()

# ── SQLite async engine (Document Intelligence) ───────────────────
DATABASE_URL = "sqlite+aiosqlite:///./db.sqlite3"
engine = create_async_engine(DATABASE_URL, echo=False)
async_session_factory = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)


async def init_db() -> None:
    """Create all DI tables on startup (no Alembic in v1)."""
    async with engine.begin() as conn:
        await conn.run_sync(DIBase.metadata.create_all)
    logger.info("DI database tables initialised (db.sqlite3)")


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

    # ── Fail fast if required DI env vars are missing ──────────────
    _azure_endpoint = os.environ.get("AZURE_DI_ENDPOINT", "")
    _azure_key      = os.environ.get("AZURE_DI_KEY", "")
    if not _azure_endpoint or not _azure_key:
        logger.warning(
            "AZURE_DI_ENDPOINT or AZURE_DI_KEY is not set. "
            "Document Intelligence upload endpoint will fail at runtime. "
            "Set these in your .env file to enable document processing."
        )

    # ── Initialise DI SQLite database ─────────────────────────────
    await init_db()

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

    try:
        from procurement.seed_agents import seed_agents
        from procurement.seed_entities import seed_entity_definitions

        seed_entity_definitions()
        seed_agents()
        logger.info("Procure Guard agents and entities seeded")
    except Exception as exc:
        logger.warning("Procure Guard seed skipped: %s", exc)

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
app.include_router(connectors_router)
app.include_router(knowledge_bases_router)
app.include_router(entity_definitions_router)
app.include_router(entities_router)
app.include_router(agents_router)
app.include_router(tools_router)
app.include_router(procurement_router)
app.include_router(document_intelligence_router)
app.include_router(di_router, prefix="/api/v1")


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