"""
document_service.py

Orchestrates the DI processing pipeline.

The router calls this service; the service calls the registry and repository.
This class has zero parser-specific logic — it only calls get_parser() and
repo.save(). No `if parser_type == "..."` anywhere here.

# TODO: add unit tests mocking the registry and repository.
"""

from __future__ import annotations

import asyncio
import logging

from entities.schemas.entity_record import EntityCreateInput, EntityRecord
from registry.parser_registry import get_parser
from repositories.entity_repository import EntityRepository

logger = logging.getLogger(__name__)


class DocumentService:

    def __init__(self, repo: EntityRepository) -> None:
        self.repo = repo

    async def process(
        self,
        file_bytes:   bytes,
        filename:     str,
        parser_type:  str,
        project_id:   str,
    ) -> EntityRecord:
        """
        Full DI processing pipeline:
          1. Get parser from registry (raises ValueError for unknown types)
          2. Run parser.parse() in a thread pool (Azure DI SDK is synchronous)
          3. Determine status based on overall_confidence threshold (0.75)
          4. Save via repository
          5. Return EntityRecord

        Raises:
            ValueError:  Unknown parser_type
            RuntimeError: Azure DI or LLM call failed
        """
        # 1. Resolve parser — raises ValueError if unknown (router converts to 400)
        parser = get_parser(parser_type)

        logger.info(
            "DocumentService.process: parser=%s file=%s project=%s",
            parser_type, filename, project_id,
        )

        # 2. Run synchronous Azure DI call in a thread pool to avoid blocking the event loop
        loop = asyncio.get_event_loop()
        try:
            result = await loop.run_in_executor(
                None,  # default ThreadPoolExecutor
                parser.parse,
                file_bytes,
                filename,
            )
        except Exception as exc:
            logger.error(
                "DocumentService.process: parser failed file=%s — %s",
                filename, exc, exc_info=True,
            )
            raise RuntimeError(str(exc)) from exc

        entity:             dict       = result["entity"]
        overall_confidence: float      = result.get("overall_confidence") or 0.0
        confidence_map:     dict | None = result.get("confidence_map")

        # 3. Determine status
        status = "complete" if overall_confidence >= 0.75 else "needs_review"

        # 4. Persist via repository
        input_record = EntityCreateInput(
            project_id         = project_id,
            entity_type        = parser_type,
            status             = status,
            body               = entity,
            confidence_map     = confidence_map,
            overall_confidence = overall_confidence,
            source_file        = filename,
            parser_used        = parser.parser_type,
        )
        entity_id = await self.repo.save(input_record)

        # 5. Fetch and return the saved EntityRecord
        saved = await self.repo.get_by_id(entity_id)
        if saved is None:
            raise RuntimeError(f"Entity {entity_id} not found after save — this should not happen.")

        logger.info(
            "DocumentService.process: done entity_id=%s status=%s confidence=%.3f",
            entity_id, status, overall_confidence,
        )
        return saved
