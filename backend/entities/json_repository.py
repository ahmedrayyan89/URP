import json
from pathlib import Path

from fastapi import HTTPException

from entities.repository import EntityDefinitionRepository, EntityInstanceRepository

DEFINITIONS_FILE = Path("./data/entity_definitions.json")
INSTANCES_FILE = Path("./data/entity_instances.json")


def _load(path: Path) -> list[dict]:
    if not path.exists():
        return []
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def _save(path: Path, records: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(records, f, indent=2, ensure_ascii=False)


class JsonEntityDefinitionRepository(EntityDefinitionRepository):
    def create_definition(self, record: dict) -> dict:
        records = _load(DEFINITIONS_FILE)
        records.append(record)
        _save(DEFINITIONS_FILE, records)
        return record

    def find_definition_by_id(self, definition_id: str) -> dict | None:
        return next((r for r in _load(DEFINITIONS_FILE) if r["id"] == definition_id), None)

    def find_definition_by_slug(self, project_id: str, slug: str) -> dict | None:
        return next(
            (
                r
                for r in _load(DEFINITIONS_FILE)
                if r.get("project_id") == project_id and r.get("slug") == slug
            ),
            None,
        )

    def list_definitions(self, project_id: str | None = None) -> list[dict]:
        records = _load(DEFINITIONS_FILE)
        if project_id:
            records = [r for r in records if r.get("project_id") == project_id]
        return records

    def update_definition(self, definition_id: str, fields: dict) -> dict:
        records = _load(DEFINITIONS_FILE)
        for i, r in enumerate(records):
            if r["id"] == definition_id:
                records[i] = {**r, **fields}
                _save(DEFINITIONS_FILE, records)
                return records[i]
        raise HTTPException(status_code=404, detail="Entity definition not found")

    def delete_definition(self, definition_id: str) -> None:
        records = _load(DEFINITIONS_FILE)
        filtered = [r for r in records if r["id"] != definition_id]
        if len(filtered) == len(records):
            raise HTTPException(status_code=404, detail="Entity definition not found")
        _save(DEFINITIONS_FILE, filtered)

    def count_instances_for_definition(self, definition_id: str) -> int:
        return len(
            [r for r in _load(INSTANCES_FILE) if r.get("entity_definition_id") == definition_id]
        )


class JsonEntityInstanceRepository(EntityInstanceRepository):
    def create_instance(self, record: dict) -> dict:
        records = _load(INSTANCES_FILE)
        records.append(record)
        _save(INSTANCES_FILE, records)
        return record

    def find_instance_by_id(self, instance_id: str) -> dict | None:
        return next((r for r in _load(INSTANCES_FILE) if r["id"] == instance_id), None)

    def list_instances(
        self,
        definition_id: str | None = None,
        project_id: str | None = None,
        status: str | None = None,
    ) -> list[dict]:
        records = _load(INSTANCES_FILE)
        if definition_id:
            records = [r for r in records if r.get("entity_definition_id") == definition_id]
        if project_id:
            records = [r for r in records if r.get("project_id") == project_id]
        if status:
            records = [r for r in records if r.get("status") == status]
        return records

    def update_instance(self, instance_id: str, fields: dict) -> dict:
        records = _load(INSTANCES_FILE)
        for i, r in enumerate(records):
            if r["id"] == instance_id:
                records[i] = {**r, **fields}
                _save(INSTANCES_FILE, records)
                return records[i]
        raise HTTPException(status_code=404, detail="Entity instance not found")

    def delete_instance(self, instance_id: str) -> None:
        records = _load(INSTANCES_FILE)
        filtered = [r for r in records if r["id"] != instance_id]
        if len(filtered) == len(records):
            raise HTTPException(status_code=404, detail="Entity instance not found")
        _save(INSTANCES_FILE, filtered)


def get_definition_repo() -> EntityDefinitionRepository:
    return JsonEntityDefinitionRepository()


def get_instance_repo() -> EntityInstanceRepository:
    return JsonEntityInstanceRepository()
