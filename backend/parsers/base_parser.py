"""
base_parser.py

Abstract base class for all Document Intelligence parsers.

Each concrete parser must implement:
  - parser_type    → canonical string identifier (e.g. "invoice")
  - azure_model_id → Azure DI model string (e.g. "prebuilt-invoice")
  - normalize()    → map Azure AnalyzeResult to intermediate dict
  - entity_schema()→ return the Pydantic model class for this parser

The `parse()` method orchestrates the full pipeline and is inherited unchanged.
To add a new parser: subclass BaseParser, implement the four abstract members,
and add a single entry to registry/parser_registry.py. Nothing else changes.
"""

from __future__ import annotations

import logging
import os
from abc import ABC, abstractmethod

from pydantic import BaseModel

logger = logging.getLogger(__name__)


class BaseParser(ABC):

    # ── Abstract interface ────────────────────────────────────────────────────

    @property
    @abstractmethod
    def parser_type(self) -> str:
        """Canonical identifier — e.g. 'invoice'."""
        ...

    @property
    @abstractmethod
    def azure_model_id(self) -> str:
        """Azure DI model ID string."""
        ...

    @abstractmethod
    def normalize(self, azure_result: object) -> dict:
        """
        Map Azure DI result to intermediate dict.
        Pure mapping — no LLM calls, no side effects.
        """
        ...

    @abstractmethod
    def entity_schema(self) -> type[BaseModel]:
        """Return the Pydantic schema class for this parser."""
        ...

    # ── Orchestration ─────────────────────────────────────────────────────────

    def parse(self, file_bytes: bytes, filename: str) -> dict:
        """
        Full pipeline:
          call_azure() → normalize() → validate_schema() → return dict

        Returns:
            {
                "entity":             <dict matching entity schema>,
                "overall_confidence": <float>,
                "confidence_map":     <dict or None>
            }

        Subclasses may override this method to add LLM post-processing steps
        (e.g. POParser) while still calling super().parse() for the base pipeline.
        """
        raw         = self.call_azure(file_bytes)
        intermediate = self.normalize(raw)
        entity_obj  = self.entity_schema()(**intermediate)
        return {
            "entity":             entity_obj.model_dump(),
            "overall_confidence": self._compute_confidence(entity_obj),
            "confidence_map":     None,   # populated by validation agent later
        }

    # ── Azure DI call ─────────────────────────────────────────────────────────

    def call_azure(self, file_bytes: bytes) -> object:
        """
        Call Azure Document Intelligence and return the raw AnalyzeResult.
        Uses AZURE_DI_ENDPOINT and AZURE_DI_KEY from environment.
        """
        from azure.ai.formrecognizer import DocumentAnalysisClient
        from azure.core.credentials import AzureKeyCredential

        endpoint = os.environ["AZURE_DI_ENDPOINT"]
        key      = os.environ["AZURE_DI_KEY"]

        client = DocumentAnalysisClient(
            endpoint=endpoint,
            credential=AzureKeyCredential(key),
        )
        poller = client.begin_analyze_document(self.azure_model_id, file_bytes)
        return poller.result()

    # ── Confidence scoring ────────────────────────────────────────────────────

    def _compute_confidence(self, entity: BaseModel) -> float:
        """
        Simple heuristic: ratio of non-None, non-empty fields to total fields.
        Returns float 0.0–1.0. Subclasses may override for domain-specific scoring.
        """
        values = list(entity.model_dump().values())
        if not values:
            return 0.0
        filled = sum(1 for v in values if v is not None and v != [])
        return round(filled / len(values), 3)
