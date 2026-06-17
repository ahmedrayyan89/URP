import re

import jsonschema
from fastapi import HTTPException
from jsonschema import Draft7Validator

DRAFT7_META = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "type": "object",
}

TYPE_MAP = {
    "string": {"type": "string"},
    "number": {"type": "number"},
    "boolean": {"type": "boolean"},
    "date": {"type": "string", "format": "date"},
    "array": {"type": "array", "items": {"type": "string"}},
    "object": {"type": "object"},
    "enum": {"type": "string"},
}


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "_", value)
    return value[:48] or "entity"


def fields_to_schema(fields: list[dict]) -> dict:
    properties = {}
    required = []
    for field in fields:
        name = field.get("name", "").strip()
        if not name:
            continue
        ftype = field.get("type", "string")
        prop = dict(TYPE_MAP.get(ftype, {"type": "string"}))
        if field.get("description"):
            prop["description"] = field["description"]
        if ftype == "enum" and field.get("enum_values"):
            prop["enum"] = [v.strip() for v in field["enum_values"].split(",") if v.strip()]
        properties[name] = prop
        if field.get("required"):
            required.append(name)

    schema = {**DRAFT7_META, "properties": properties}
    if required:
        schema["required"] = required
    return schema


def validate_schema(schema: dict) -> None:
    try:
        Draft7Validator.check_schema(schema)
    except jsonschema.SchemaError as exc:
        raise HTTPException(status_code=400, detail=f"Invalid JSON Schema: {exc.message}")


def validate_instance_data(schema: dict, data: dict) -> None:
    validate_schema(schema)
    validator = Draft7Validator(schema)
    errors = sorted(validator.iter_errors(data), key=lambda e: e.path)
    if errors:
        msgs = [f"{list(e.path)}: {e.message}" if e.path else e.message for e in errors[:5]]
        raise HTTPException(status_code=400, detail="; ".join(msgs))
