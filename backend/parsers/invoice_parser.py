"""
invoice_parser.py

Concrete parser for Azure DI prebuilt-invoice.
Delegates all field mapping to normalizers/invoice_normalizer.py.
"""

from __future__ import annotations

from entities.schemas.invoice_schema import InvoiceEntity
from normalizers import invoice_normalizer
from parsers.base_parser import BaseParser
from pydantic import BaseModel


class InvoiceParser(BaseParser):

    @property
    def parser_type(self) -> str:
        return "invoice"

    @property
    def azure_model_id(self) -> str:
        return "prebuilt-invoice"

    def normalize(self, azure_result: object) -> dict:
        """Delegate to invoice_normalizer — pure mapping, no LLM."""
        return invoice_normalizer.normalize(azure_result)

    def entity_schema(self) -> type[BaseModel]:
        return InvoiceEntity
