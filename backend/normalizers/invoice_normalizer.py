"""
invoice_normalizer.py

Pure mapping function: Azure DI prebuilt-invoice AnalyzeResult → InvoiceEntity dict.

Rules:
  - All field access uses safe .get() chaining. Missing fields → None.
  - No LLM calls, no side effects.
  - Currency is extracted from InvoiceTotal.value_data.content where available.
"""

from __future__ import annotations

import logging

logger = logging.getLogger(__name__)


def normalize(azure_result: object) -> dict:
    """
    Map an Azure DI AnalyzeResult (prebuilt-invoice) to a dict that matches
    the InvoiceEntity schema.

    Args:
        azure_result: The raw AnalyzeResult returned by DocumentAnalysisClient.

    Returns:
        dict with keys matching InvoiceEntity fields. Missing values are None.
    """
    try:
        docs = getattr(azure_result, "documents", None) or []
        if not docs:
            logger.warning("invoice_normalizer: no documents in azure_result")
            return _empty()

        fields = getattr(docs[0], "fields", None) or {}

        def _content(key: str) -> str | None:
            f = fields.get(key)
            if f is None:
                return None
            return getattr(f, "content", None)

        def _value(key: str):
            f = fields.get(key)
            if f is None:
                return None
            return getattr(f, "value", None)

        # ── Line items ─────────────────────────────────────────────────────────
        items_field = fields.get("Items")
        items_value = getattr(items_field, "value", None) or []

        line_items: list[dict] = []
        for item in items_value:
            item_fields = getattr(item, "value", None) or {}
            line_items.append(
                {
                    "description": _safe_content(item_fields, "Description"),
                    "quantity":    _safe_value(item_fields, "Quantity"),
                    "unit_price":  _safe_value(item_fields, "UnitPrice"),
                    "total":       _safe_value(item_fields, "Amount"),
                }
            )

        # ── Currency ───────────────────────────────────────────────────────────
        currency = None
        invoice_total_field = fields.get("InvoiceTotal")
        if invoice_total_field is not None:
            value_data = getattr(invoice_total_field, "value_data", None)
            if value_data is not None:
                raw_content = getattr(value_data, "content", None) or ""
                # e.g. "$1,250.00" → strip digits/commas/periods/spaces → "USD" would
                # require locale knowledge; instead store the raw symbol/prefix if present.
                # For now expose as-is; a later enrichment pass can normalise.
                currency = _extract_currency_symbol(raw_content)

        return {
            "invoice_number": _content("InvoiceId"),
            "vendor":         _content("VendorName"),
            "vendor_address": _content("VendorAddress"),
            "po_reference":   _content("PurchaseOrder"),
            "invoice_date":   _content("InvoiceDate"),
            "due_date":       _content("DueDate"),
            "subtotal":       _value("SubTotal"),
            "tax_amount":     _value("TotalTax"),
            "total_amount":   _value("InvoiceTotal"),
            "currency":       currency,
            "payment_terms":  _content("PaymentTerm"),
            "line_items":     line_items,
        }

    except Exception as exc:  # noqa: BLE001
        logger.error("invoice_normalizer: unexpected error — %s", exc, exc_info=True)
        return _empty()


# ── Helpers ────────────────────────────────────────────────────────────────────

def _safe_content(fields: dict, key: str) -> str | None:
    f = fields.get(key)
    if f is None:
        return None
    return getattr(f, "content", None)


def _safe_value(fields: dict, key: str):
    f = fields.get(key)
    if f is None:
        return None
    return getattr(f, "value", None)


def _extract_currency_symbol(content: str) -> str | None:
    """
    Best-effort: if the content starts with a recognised currency symbol or
    3-letter code, return it; otherwise None.
    """
    if not content:
        return None
    content = content.strip()
    # Common symbols
    _SYMBOL_MAP = {
        "$": "USD", "€": "EUR", "£": "GBP", "¥": "JPY", "₹": "INR",
    }
    if content and content[0] in _SYMBOL_MAP:
        return _SYMBOL_MAP[content[0]]
    # 3-letter ISO code at the start or end
    import re
    m = re.search(r"\b([A-Z]{3})\b", content)
    if m:
        return m.group(1)
    return None


def _empty() -> dict:
    return {
        "invoice_number": None,
        "vendor":         None,
        "vendor_address": None,
        "po_reference":   None,
        "invoice_date":   None,
        "due_date":       None,
        "subtotal":       None,
        "tax_amount":     None,
        "total_amount":   None,
        "currency":       None,
        "payment_terms":  None,
        "line_items":     [],
    }
