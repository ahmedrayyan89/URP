import uuid
from datetime import datetime, timezone

from fastapi import HTTPException
from pydantic import BaseModel, ConfigDict, Field

from entities.json_repository import get_definition_repo, get_instance_repo
from entities.schema_utils import slugify, validate_instance_data, validate_schema


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


class SchemaFieldPayload(BaseModel):
    name: str
    type: str = "string"
    required: bool = False
    description: str = ""
    enum_values: str = ""


class CreateEntityDefinitionPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    project_id: str
    name: str
    slug: str | None = None
    description: str = ""
    source_type: str = "manual"
    schema_body: dict | None = Field(default=None, alias="schema")
    fields: list[SchemaFieldPayload] = Field(default_factory=list)


class UpdateEntityDefinitionPayload(BaseModel):
    model_config = ConfigDict(populate_by_name=True)
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    source_type: str | None = None
    schema_body: dict | None = Field(default=None, alias="schema")
    fields: list[SchemaFieldPayload] | None = None


class CreateEntityInstancePayload(BaseModel):
    project_id: str
    data: dict
    source_document_id: str | None = None
    extraction_confidence: float | None = None
    status: str = "draft"


class UpdateEntityInstancePayload(BaseModel):
    data: dict | None = None
    status: str | None = None
    source_document_id: str | None = None
    extraction_confidence: float | None = None


def _resolve_schema(payload_schema: dict | None, fields: list[SchemaFieldPayload]) -> dict:
    from entities.schema_utils import fields_to_schema

    if payload_schema:
        validate_schema(payload_schema)
        return payload_schema
    if fields:
        schema = fields_to_schema([f.model_dump() for f in fields])
        validate_schema(schema)
        return schema
    raise HTTPException(status_code=400, detail="Schema or fields are required")


def create_definition(payload: CreateEntityDefinitionPayload) -> dict:
    repo = get_definition_repo()
    slug = slugify(payload.slug or payload.name)
    if repo.find_definition_by_slug(payload.project_id, slug):
        slug = f"{slug}_{uuid.uuid4().hex[:6]}"

    schema = _resolve_schema(payload.schema_body, payload.fields)
    now = _now()
    record = {
        "id": str(uuid.uuid4()),
        "project_id": payload.project_id,
        "name": payload.name.strip(),
        "slug": slug,
        "description": payload.description.strip(),
        "source_type": payload.source_type,
        "schema": schema,
        "version": 1,
        "created_at": now,
        "updated_at": now,
    }
    return repo.create_definition(record)


def list_definitions(project_id: str | None = None) -> list[dict]:
    repo = get_definition_repo()
    results = []
    for d in repo.list_definitions(project_id):
        results.append(
            {
                **d,
                "instance_count": repo.count_instances_for_definition(d["id"]),
            }
        )
    return results


def get_definition(definition_id: str) -> dict:
    repo = get_definition_repo()
    record = repo.find_definition_by_id(definition_id)
    if not record:
        raise HTTPException(status_code=404, detail="Entity definition not found")
    return {
        **record,
        "instance_count": repo.count_instances_for_definition(definition_id),
    }


def get_definition_by_slug(project_id: str, slug: str) -> dict:
    repo = get_definition_repo()
    record = repo.find_definition_by_slug(project_id, slug)
    if not record:
        raise HTTPException(status_code=404, detail="Entity definition not found")
    return record


def update_definition(definition_id: str, payload: UpdateEntityDefinitionPayload) -> dict:
    repo = get_definition_repo()
    existing = repo.find_definition_by_id(definition_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Entity definition not found")

    fields = {}
    if payload.name is not None:
        fields["name"] = payload.name.strip()
    if payload.description is not None:
        fields["description"] = payload.description.strip()
    if payload.source_type is not None:
        fields["source_type"] = payload.source_type
    if payload.slug is not None:
        new_slug = slugify(payload.slug)
        conflict = repo.find_definition_by_slug(existing["project_id"], new_slug)
        if conflict and conflict["id"] != definition_id:
            raise HTTPException(status_code=400, detail="Slug already in use")
        fields["slug"] = new_slug
    if payload.schema_body is not None:
        validate_schema(payload.schema_body)
        fields["schema"] = payload.schema_body
        fields["version"] = existing.get("version", 1) + 1
    elif payload.fields is not None:
        from entities.schema_utils import fields_to_schema

        schema = fields_to_schema([f.model_dump() for f in payload.fields])
        validate_schema(schema)
        fields["schema"] = schema
        fields["version"] = existing.get("version", 1) + 1

    fields["updated_at"] = _now()
    return repo.update_definition(definition_id, fields)


def delete_definition(definition_id: str) -> None:
    repo = get_definition_repo()
    if repo.count_instances_for_definition(definition_id) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete definition with existing instances",
        )
    repo.delete_definition(definition_id)


def create_instance(slug: str, project_id: str, payload: CreateEntityInstancePayload) -> dict:
    def_repo = get_definition_repo()
    inst_repo = get_instance_repo()
    definition = def_repo.find_definition_by_slug(project_id, slug)
    if not definition:
        raise HTTPException(status_code=404, detail="Entity definition not found")

    validate_instance_data(definition["schema"], payload.data)
    now = _now()
    record = {
        "id": str(uuid.uuid4()),
        "entity_definition_id": definition["id"],
        "project_id": project_id,
        "data": payload.data,
        "source_document_id": payload.source_document_id,
        "extraction_confidence": payload.extraction_confidence,
        "status": payload.status,
        "created_at": now,
        "updated_at": now,
    }
    return inst_repo.create_instance(record)


def list_instances_by_slug(
    slug: str,
    project_id: str,
    status: str | None = None,
) -> list[dict]:
    definition = get_definition_by_slug(project_id, slug)
    inst_repo = get_instance_repo()
    return inst_repo.list_instances(
        definition_id=definition["id"],
        project_id=project_id,
        status=status,
    )


def get_instance(instance_id: str) -> dict:
    inst_repo = get_instance_repo()
    record = inst_repo.find_instance_by_id(instance_id)
    if not record:
        raise HTTPException(status_code=404, detail="Entity instance not found")
    def_repo = get_definition_repo()
    definition = def_repo.find_definition_by_id(record["entity_definition_id"])
    return {**record, "definition": definition}


def list_all_instances(
    project_id: str | None = None,
    status: str | None = None,
    definition_id: str | None = None,
) -> list[dict]:
    inst_repo = get_instance_repo()
    def_repo = get_definition_repo()
    instances = inst_repo.list_instances(
        definition_id=definition_id,
        project_id=project_id,
        status=status,
    )
    enriched = []
    for inst in instances:
        definition = def_repo.find_definition_by_id(inst["entity_definition_id"])
        enriched.append(
            {
                **inst,
                "definition_name": definition["name"] if definition else "Unknown",
                "definition_slug": definition["slug"] if definition else "",
            }
        )
    return enriched


def update_instance(instance_id: str, slug: str, project_id: str, payload: UpdateEntityInstancePayload) -> dict:
    inst_repo = get_instance_repo()
    existing = inst_repo.find_instance_by_id(instance_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Entity instance not found")

    definition = get_definition_by_slug(project_id, slug)
    fields = {"updated_at": _now()}
    if payload.data is not None:
        validate_instance_data(definition["schema"], payload.data)
        fields["data"] = payload.data
    if payload.status is not None:
        fields["status"] = payload.status
    if payload.source_document_id is not None:
        fields["source_document_id"] = payload.source_document_id
    if payload.extraction_confidence is not None:
        fields["extraction_confidence"] = payload.extraction_confidence
    return inst_repo.update_instance(instance_id, fields)


def delete_instance(instance_id: str) -> None:
    get_instance_repo().delete_instance(instance_id)
