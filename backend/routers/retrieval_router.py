from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/retrieval", tags=["retrieval"])


def get_deps():
    from main import embedder, document_index, hybrid_searcher, reranker
    return embedder, document_index, hybrid_searcher, reranker


class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    use_reranker: bool = True
    category_filter: Optional[str] = None
    doc_type_filter: Optional[str] = None


@router.post("/search")
async def search(request: SearchRequest):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    _embedder, _index, _searcher, _reranker = get_deps()

    # Embed query
    query_embedding = _embedder.embed_query(request.query)

    # Build filter
    where_filter = None
    if request.category_filter:
        where_filter = {"category": request.category_filter}
    elif request.doc_type_filter:
        where_filter = {"doc_type": request.doc_type_filter}

    # Vector search
    vector_results = _index.vector_search(
        query_embedding=query_embedding,
        top_k=request.top_k * 3,
        where=where_filter,
    )

    # Hybrid fusion
    fused = _searcher.search(
        query=request.query,
        query_embedding=query_embedding,
        vector_results=vector_results,
        top_k=request.top_k * 2,
    )

    # Rerank
    rerank_applied = False
    if request.use_reranker and fused:
        final = _reranker.rerank(
            query=request.query,
            chunks=fused,
            top_k=request.top_k,
        )
        rerank_applied = True
    else:
        final = fused[: request.top_k]

    return {
        "query": request.query,
        "results": final,
        "total_results": len(final),
        "rerank_applied": rerank_applied,
        "pipeline": {
            "vector_candidates": len(vector_results),
            "after_fusion": len(fused),
            "final": len(final),
        },
    }