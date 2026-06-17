"""Structured KB query abstraction — JSON store today, Postgres later."""

from structured import store as structured_store


def build_table_metadata(table_ids: list[str]) -> list[dict]:
    metadata = []
    for table_id in table_ids:
        try:
            table = structured_store.get_table(table_id)
        except Exception:
            continue
        metadata.append(
            {
                "table_id": table["id"],
                "name": table["name"],
                "description": table.get("description", ""),
                "columns": [
                    {
                        "key": c["key"],
                        "label": c.get("label", c["key"]),
                        "type": c.get("type", "string"),
                    }
                    for c in table.get("columns", [])
                ],
            }
        )
    return metadata


def execute_structured_query(kb: dict, query: str, top_k: int = 5) -> dict:
    """Stub text-to-SQL: returns sample rows from linked structured tables."""
    table_ids = kb.get("structured_table_ids") or []
    metadata = build_table_metadata(table_ids)

    rows_out = []
    sources = []
    for table_id in table_ids[:top_k]:
        try:
            table = structured_store.get_table(table_id)
        except Exception:
            continue
        sample_rows = table.get("rows", [])[:3]
        rows_out.extend(sample_rows)
        sources.append(
            {
                "table_id": table_id,
                "table_name": table["name"],
                "row_count": len(sample_rows),
            }
        )

    answer = (
        f"Structured query stub for: \"{query}\". "
        f"Returned {len(rows_out)} sample row(s) from {len(sources)} table(s). "
        "Full LLM text-to-SQL will replace this in a later phase."
    )

    return {
        "answer": answer,
        "chunks": [],
        "sources": sources,
        "metadata": metadata,
        "query_steps": [
            {"step": 1, "action": "decompose_query", "detail": query},
            {"step": 2, "action": "generate_query", "detail": "stub — no SQL yet"},
            {"step": 3, "action": "execute", "detail": f"{len(rows_out)} rows"},
        ],
        "rows": rows_out,
    }
