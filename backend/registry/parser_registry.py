"""
parser_registry.py

Central registry for all Document Intelligence parsers.

To add a new parser:
  1. Create a class extending BaseParser in parsers/
  2. Add ONE line to REGISTRY below.
  That is all. Zero other changes required anywhere in the codebase.

Never use `if parser_type == "invoice"` chains elsewhere.
All dispatch goes through get_parser().
"""

from __future__ import annotations

from parsers.base_parser import BaseParser
from parsers.invoice_parser import InvoiceParser
from parsers.po_parser import POParser

REGISTRY: dict[str, BaseParser] = {
    "invoice":          InvoiceParser(),
    "purchase_order":   POParser(),
    # Add new parsers here — e.g.:
    # "contract": ContractParser(),
    # "w2":       W2Parser(),
}


def get_parser(parser_type: str) -> BaseParser:
    """
    Return the parser for the given type string.

    Raises:
        ValueError: if parser_type is not in the registry.
    """
    if parser_type not in REGISTRY:
        available = list(REGISTRY.keys())
        raise ValueError(
            f"Unknown parser type: '{parser_type}'. "
            f"Available parsers: {available}"
        )
    return REGISTRY[parser_type]
