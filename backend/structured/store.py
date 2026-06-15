import csv
import io
import json
import re
import uuid
from pathlib import Path

from fastapi import HTTPException

TABLES_FILE = Path("./data/structured_tables.json")
TEMPLATES_FILE = Path("./data/table_templates.json")


def slugify(value: str) -> str:
    value = value.lower().strip()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "_", value)
    return value[:48] or "table"


def _load_raw() -> list[dict]:
    if not TABLES_FILE.exists():
        return []
    with open(TABLES_FILE, encoding="utf-8") as f:
        tables = json.load(f)
    for t in tables:
        if "source" not in t:
            t["source"] = "system"
    return tables


def _save_raw(tables: list[dict]) -> None:
    TABLES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(TABLES_FILE, "w", encoding="utf-8") as f:
        json.dump(tables, f, indent=2, ensure_ascii=False)


def list_tables_meta() -> list[dict]:
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "description": t["description"],
            "source_doc": t.get("source_doc", "user"),
            "source": t.get("source", "system"),
            "column_count": len(t["columns"]),
            "row_count": len(t["rows"]),
        }
        for t in _load_raw()
    ]


def get_table(table_id: str) -> dict:
    table = next((t for t in _load_raw() if t["id"] == table_id), None)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    return table


def _unique_table_id(name: str, tables: list[dict]) -> str:
    base = slugify(name)
    existing = {t["id"] for t in tables}
    if base not in existing:
        return base
    return f"{base}_{uuid.uuid4().hex[:6]}"


def _columns_from_headers(headers: list[str]) -> list[dict]:
    columns = []
    used_keys: set[str] = set()
    for header in headers:
        label = header.strip() or "Column"
        key = slugify(label)
        if key in used_keys:
            key = f"{key}_{len(used_keys)}"
        used_keys.add(key)
        columns.append({"key": key, "label": label})
    return columns


def list_templates() -> list[dict]:
    if not TEMPLATES_FILE.exists():
        return []
    with open(TEMPLATES_FILE, encoding="utf-8") as f:
        return json.load(f)


def get_template(template_id: str) -> dict:
    template = next(
        (t for t in list_templates() if t["id"] == template_id), None
    )
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


def create_table_from_template(
    template_id: str, name: str, description: str = ""
) -> dict:
    template = get_template(template_id)
    tables = _load_raw()
    table = {
        "id": _unique_table_id(name, tables),
        "name": name.strip(),
        "description": description.strip() or template["description"],
        "source_doc": "user",
        "source": "user",
        "columns": [dict(c) for c in template["columns"]],
        "rows": [],
    }
    tables.append(table)
    _save_raw(tables)
    return table


def create_table_from_csv(
    name: str, description: str, file_content: bytes
) -> dict:
    try:
        text = file_content.decode("utf-8-sig")
    except UnicodeDecodeError as exc:
        raise HTTPException(
            status_code=400, detail="CSV must be UTF-8 encoded"
        ) from exc

    reader = csv.reader(io.StringIO(text))
    rows_raw = [row for row in reader if any(cell.strip() for cell in row)]
    if len(rows_raw) < 2:
        raise HTTPException(
            status_code=400,
            detail="CSV must have a header row and at least one data row",
        )

    headers = rows_raw[0]
    columns = _columns_from_headers(headers)
    data_rows = []
    for row in rows_raw[1:]:
        record = {}
        for i, col in enumerate(columns):
            record[col["key"]] = row[i].strip() if i < len(row) else ""
        data_rows.append(record)

    tables = _load_raw()
    table = {
        "id": _unique_table_id(name, tables),
        "name": name.strip(),
        "description": description.strip() or "Imported from CSV",
        "source_doc": "csv_import",
        "source": "user",
        "columns": columns,
        "rows": data_rows,
    }
    tables.append(table)
    _save_raw(tables)
    return table


def delete_table(table_id: str) -> None:
    tables = _load_raw()
    table = next((t for t in tables if t["id"] == table_id), None)
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")
    if table.get("source") == "system":
        raise HTTPException(
            status_code=403, detail="System tables cannot be deleted"
        )
    _save_raw([t for t in tables if t["id"] != table_id])


def replace_rows(table_id: str, rows: list[dict]) -> dict:
    tables = _load_raw()
    idx = next(
        (i for i, t in enumerate(tables) if t["id"] == table_id), None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="Table not found")

    table = tables[idx]
    keys = {c["key"] for c in table["columns"]}
    cleaned = []
    for row in rows:
        cleaned.append({k: str(row.get(k, "")) for k in keys})

    table["rows"] = cleaned
    tables[idx] = table
    _save_raw(tables)
    return table


def add_row(table_id: str, row: dict) -> dict:
    tables = _load_raw()
    idx = next(
        (i for i, t in enumerate(tables) if t["id"] == table_id), None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="Table not found")

    table = tables[idx]
    keys = [c["key"] for c in table["columns"]]
    new_row = {k: str(row.get(k, "")) for k in keys}
    table["rows"].append(new_row)
    tables[idx] = table
    _save_raw(tables)
    return table


def update_row(table_id: str, row_index: int, row: dict) -> dict:
    tables = _load_raw()
    idx = next(
        (i for i, t in enumerate(tables) if t["id"] == table_id), None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="Table not found")

    table = tables[idx]
    if row_index < 0 or row_index >= len(table["rows"]):
        raise HTTPException(status_code=404, detail="Row not found")

    keys = [c["key"] for c in table["columns"]]
    table["rows"][row_index] = {k: str(row.get(k, "")) for k in keys}
    tables[idx] = table
    _save_raw(tables)
    return table


def delete_row(table_id: str, row_index: int) -> dict:
    tables = _load_raw()
    idx = next(
        (i for i, t in enumerate(tables) if t["id"] == table_id), None
    )
    if idx is None:
        raise HTTPException(status_code=404, detail="Table not found")

    table = tables[idx]
    if row_index < 0 or row_index >= len(table["rows"]):
        raise HTTPException(status_code=404, detail="Row not found")

    del table["rows"][row_index]
    tables[idx] = table
    _save_raw(tables)
    return table
