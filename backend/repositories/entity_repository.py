"""
entity_repository.py

All SQLAlchemy access for DI entities lives here.
Parsers and services MUST NOT import SQLAlchemy or AsyncSession directly.

body and confidence_map are stored as JSON strings in Text columns.
Serialisation/deserialisation is explicit: json.dumps / json.loads.
No TypeDecorator — behaviour is visible and easy to trace.

# TODO: add integration tests covering save() → get_by_id() round-trip.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from entities.models.entity_model import EntityModel
from entities.schemas.entity_record import EntityCreateInput, EntityRecord

logger = logging.getLogger(__name__)


class EntityRepository:
    """
    Async repository for DI entity storage.
    Receives an AsyncSession injected by the FastAPI dependency.
    """

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Write ──────────────────────────────────────────────────────────────────

    async def save(self, record: EntityCreateInput) -> str:
        """
        Insert a new entity row. Returns the generated entity_id (UUID string).
        """
        entity_id = str(uuid.uuid4())
        now       = _now_iso()

        row = EntityModel(
            id                 = entity_id,
            project_id         = record.project_id,
            entity_type        = record.entity_type,
            status             = record.status,
            body               = json.dumps(record.body),
            confidence_map     = json.dumps(record.confidence_map) if record.confidence_map is not None else None,
            overall_confidence = record.overall_confidence,
            source_file        = record.source_file,
            parser_used        = record.parser_used,
            created_at         = now,
            updated_at         = now,
        )
        self._session.add(row)
        await self._session.commit()
        await self._session.refresh(row)

        logger.info("EntityRepository.save: created entity_id=%s type=%s", entity_id, record.entity_type)
        return entity_id

    # ── Read ───────────────────────────────────────────────────────────────────

    async def get_by_id(self, entity_id: str) -> EntityRecord | None:
        """Fetch a single entity by its UUID."""
        result = await self._session.execute(
            select(EntityModel).where(EntityModel.id == entity_id)
        )
        row = result.scalar_one_or_none()
        if row is None:
            return None
        return _row_to_record(row)

    async def get_by_type(self, project_id: str, entity_type: str) -> list[EntityRecord]:
        """Fetch all entities of a given type for a project, newest first."""
        result = await self._session.execute(
            select(EntityModel)
            .where(
                EntityModel.project_id  == project_id,
                EntityModel.entity_type == entity_type,
            )
            .order_by(EntityModel.created_at.desc())
        )
        rows = result.scalars().all()
        return [_row_to_record(r) for r in rows]

    # ── Update ─────────────────────────────────────────────────────────────────

    async def update_status(self, entity_id: str, status: str) -> None:
        """Update the status field of an entity."""
        await self._session.execute(
            update(EntityModel)
            .where(EntityModel.id == entity_id)
            .values(status=status, updated_at=_now_iso())
        )
        await self._session.commit()
        logger.info("EntityRepository.update_status: entity_id=%s → %s", entity_id, status)


# ── Private helpers ────────────────────────────────────────────────────────────

def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _row_to_record(row: EntityModel) -> EntityRecord:
    """Deserialise JSON strings back to dicts, build EntityRecord response model."""
    body: dict = json.loads(row.body) if row.body else {}
    confidence_map: dict | None = (
        json.loads(row.confidence_map) if row.confidence_map else None
    )
    return EntityRecord(
        entity_id          = row.id,
        entity_type        = row.entity_type,
        status             = row.status,
        overall_confidence = row.overall_confidence,
        entity             = body,
        confidence_map     = confidence_map,
        source_file        = row.source_file,
        created_at         = row.created_at,
    )
