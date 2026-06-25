"""
po_normalizer.py

Pure mapping function: Azure DI prebuilt-document AnalyzeResult → partial POEntity dict.

The prebuilt-document model returns key_value_pairs (not a clean PO schema).
This normalizer does fuzzy key matching to map common variations to canonical fields.

Missing fields remain None — the PO parser then calls an LLM to fill gaps.
"""

from __future__ import annotations

import logging
import re

logger = logging.getLogger(__name__)

# ── Alias map ─────────────────────────────────────────────────────────────────
# Each canonical field maps to a list of known key aliases (all lowercase).
_ALIASES: dict[str, list[str]] = {
    "po_number":     ["po number", "purchase order", "po #", "order no", "po no",
                      "order number", "p.o. number", "purchase order no",
                      "purchase order number"],
    "vendor":        ["vendor", "supplier", "sold by", "bill from", "vendor name",
                      "supplier name"],
    "total_amount":  ["total", "grand total", "amount due", "total amount",
                      "invoice total", "net amount"],
    "po_date":       ["date", "order date", "po date", "issue date", "issued date"],
    "delivery_date": ["delivery date", "ship date", "required by", "due date",
                      "expected delivery", "ship by"],
    "contract_ref":  ["contract", "contract ref", "contract reference",
                      "contract number", "contract no", "agreement",
                      "agreement number", "framework agreement"],
    "vendor_id":     ["vendor id", "vendor code", "supplier id", "supplier code"],
    "region":        ["region", "ship to region", "delivery region", "territory"],
    "category":      ["category", "department", "cost center", "cost centre",
                      "product category"],
    "currency":      ["currency", "ccy", "currency code"],
}


def normalize(azure_result: object) -> dict:
    """
    Extract a partial POEntity dict from an Azure DI prebuilt-document result.

    Args:
        azure_result: Raw AnalyzeResult from DocumentAnalysisClient.

    Returns:
        Partial dict matching POEntity fields. All missing values are None.
        Tables are not mapped here — the LLM step handles line_items.
    """
    try:
        kvps = getattr(azure_result, "key_value_pairs", None) or []
        flat = _build_flat_dict(kvps)
        partial = _map_aliases(flat)

        # Attempt to parse total_amount as float
        if isinstance(partial.get("total_amount"), str):
            partial["total_amount"] = _parse_float(partial["total_amount"])

        # Always set source_system for manual uploads
        partial.setdefault("source_system", "manual_upload")
        partial.setdefault("line_items", [])

        return partial

    except Exception as exc:  # noqa: BLE001
        logger.error("po_normalizer: unexpected error — %s", exc, exc_info=True)
        return _empty()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _build_flat_dict(kvps: list) -> dict[str, str]:
    """
    Flatten key_value_pairs into {lowercase_stripped_key: value_content}.
    Duplicate keys: last write wins.
    """
    flat: dict[str, str] = {}
    for pair in kvps:
        key_obj   = getattr(pair, "key",   None)
        value_obj = getattr(pair, "value", None)
        if key_obj is None:
            continue
        key_text   = (getattr(key_obj,   "content", None) or "").lower().strip()
        value_text = (getattr(value_obj, "content", None) or "") if value_obj else ""
        if key_text:
            flat[key_text] = value_text
    return flat


def _map_aliases(flat: dict[str, str]) -> dict:
    """
    Try each alias for every canonical field against the flat dict.
    Returns the first match found, or None.
    """
    result: dict = {}
    for canonical, aliases in _ALIASES.items():
        matched = None
        for alias in aliases:
            # Exact match first
            if alias in flat:
                matched = flat[alias] or None
                break
        if matched is None:
            # Fuzzy: check if any flat key contains the alias as a substring
            for alias in aliases:
                for flat_key, flat_val in flat.items():
                    if alias in flat_key:
                        matched = flat_val or None
                        break
                if matched is not None:
                    break
        result[canonical] = matched
    return result


def _parse_float(value: str) -> float | None:
    """Strip currency symbols and commas, attempt float conversion."""
    cleaned = re.sub(r"[^\d.\-]", "", value)
    try:
        return float(cleaned) if cleaned else None
    except ValueError:
        return None


def _empty() -> dict:
    return {
        "po_number":     None,
        "contract_ref":  None,
        "vendor":        None,
        "vendor_id":     None,
        "po_date":       None,
        "delivery_date": None,
        "region":        None,
        "category":      None,
        "total_amount":  None,
        "currency":      None,
        "source_system": "manual_upload",
        "line_items":    [],
    }
