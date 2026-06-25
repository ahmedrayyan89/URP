"""
po_parser.py

Concrete parser for Purchase Orders using Azure DI prebuilt-document.

Pipeline:
  1. call_azure()         → raw AnalyzeResult (key_value_pairs + tables)
  2. po_normalizer        → best-effort flat dict (fuzzy key matching)
  3. _llm_extract()       → one LLM call to fill gaps and extract line items
  4. entity_schema()      → validate via POEntity Pydantic model
"""

from __future__ import annotations

import json
import logging
import os

from entities.schemas.po_schema import POEntity
from normalizers import po_normalizer
from parsers.base_parser import BaseParser
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class POParser(BaseParser):

    @property
    def parser_type(self) -> str:
        return "purchase_order"

    @property
    def azure_model_id(self) -> str:
        return "prebuilt-document"

    def normalize(self, azure_result: object) -> dict:
        """Delegate to po_normalizer — fuzzy key matching over key_value_pairs."""
        return po_normalizer.normalize(azure_result)

    def entity_schema(self) -> type[BaseModel]:
        return POEntity

    # ── Override parse() to inject LLM step ──────────────────────────────────

    def parse(self, file_bytes: bytes, filename: str) -> dict:
        """
        Extended pipeline:
          call_azure() → normalize() → _llm_extract() → validate_schema()
        """
        raw      = self.call_azure(file_bytes)
        partial  = self.normalize(raw)

        # Extract full document text for LLM context
        raw_text = self._extract_text(raw)

        # Fill gaps with LLM — particularly contract_ref, po_number, line_items
        enriched = self._llm_extract(raw_text, partial)

        # Merge: LLM output takes priority over fuzzy-matched partial for non-None values
        merged = {**partial, **{k: v for k, v in enriched.items() if v is not None}}

        entity_obj = self.entity_schema()(**merged)
        return {
            "entity":             entity_obj.model_dump(),
            "overall_confidence": self._compute_confidence(entity_obj),
            "confidence_map":     None,
        }

    # ── Helpers ───────────────────────────────────────────────────────────────

    def _extract_text(self, azure_result: object) -> str:
        """Extract concatenated content from all pages of the document."""
        try:
            pages = getattr(azure_result, "pages", None) or []
            lines: list[str] = []
            for page in pages:
                for line in (getattr(page, "lines", None) or []):
                    content = getattr(line, "content", None)
                    if content:
                        lines.append(content)
            return "\n".join(lines)
        except Exception as exc:  # noqa: BLE001
            logger.warning("POParser._extract_text failed: %s", exc)
            return ""

    def _llm_extract(self, raw_text: str, partial: dict) -> dict:
        """
        One LLM call to extract missing PO fields from the full document text.
        Returns a dict matching POEntity fields (None for any field not found).

        Uses OpenAI client (OPENAI_API_KEY env var).
        # TODO: add unit tests for _llm_extract with mock LLM responses.
        # TODO: switch to google.generativeai if Gemini API key is preferred.
        """
        api_key = os.environ.get("OPENAI_API_KEY", "")
        if not api_key:
            # TODO: raise or log a clear warning when OPENAI_API_KEY is not set.
            logger.warning(
                "POParser._llm_extract: OPENAI_API_KEY not set. "
                "LLM extraction skipped — returning partial dict only."
            )
            return {}

        try:
            from openai import OpenAI  # noqa: PLC0415

            client = OpenAI(api_key=api_key)

            prompt = f"""You are extracting structured fields from a Purchase Order document.

Document text:
{raw_text}

Partially extracted fields (some may be None):
{json.dumps(partial, indent=2)}

Extract these fields. Return ONLY valid JSON, no explanation, no markdown fences:
- po_number
- contract_ref  (IMPORTANT: the contract or agreement number this PO references)
- vendor
- vendor_id
- po_date (ISO 8601 date string or null)
- delivery_date (ISO 8601 date string or null)
- region
- category
- total_amount (float or null)
- currency
- line_items: list of objects with keys: item, quantity, unit_price, total

For any field you cannot find, return null.
"""

            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=1024,
            )

            raw_json = response.choices[0].message.content or ""
            # Strip markdown fences if present
            raw_json = raw_json.strip()
            if raw_json.startswith("```"):
                raw_json = raw_json.split("```")[1]
                if raw_json.startswith("json"):
                    raw_json = raw_json[4:]

            return json.loads(raw_json)

        except json.JSONDecodeError as exc:
            logger.error("POParser._llm_extract: JSON parse error — %s", exc)
            return {}
        except Exception as exc:  # noqa: BLE001
            logger.error("POParser._llm_extract: LLM call failed — %s", exc, exc_info=True)
            return {}
