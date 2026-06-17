function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "_")
    .slice(0, 48) || "entity";
}

const TYPE_MAP = {
  string: { type: "string" },
  number: { type: "number" },
  boolean: { type: "boolean" },
  date: { type: "string", format: "date" },
  array: { type: "array", items: { type: "string" } },
  object: { type: "object" },
  enum: { type: "string" },
};

export function fieldsToSchema(fields) {
  const properties = {};
  const required = [];
  for (const field of fields) {
    const name = field.name?.trim();
    if (!name) continue;
    const prop = { ...TYPE_MAP[field.type] || { type: "string" } };
    if (field.description) prop.description = field.description;
    if (field.type === "enum" && field.enum_values) {
      prop.enum = field.enum_values.split(",").map((v) => v.trim()).filter(Boolean);
    }
    properties[name] = prop;
    if (field.required) required.push(name);
  }
  const schema = {
    $schema: "http://json-schema.org/draft-07/schema#",
    type: "object",
    properties,
  };
  if (required.length) schema.required = required;
  return schema;
}

export default function EntitySchemaBuilder({ fields, onChange }) {
  const schema = fieldsToSchema(fields);

  const addField = () => {
    onChange([
      ...fields,
      { name: "", type: "string", required: false, description: "", enum_values: "" },
    ]);
  };

  const updateField = (idx, key, value) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, [key]: value } : f));
    onChange(next);
  };

  const removeField = (idx) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  return (
    <div className="schema-builder-split">
      <div className="schema-builder-fields">
        <div className="flex-between mb-2">
          <h4 className="kb-settings-title">Fields</h4>
          <button type="button" className="btn btn-ghost btn-sm" onClick={addField}>
            + Add field
          </button>
        </div>
        {fields.length === 0 ? (
          <p className="text-sm text-muted">Add at least one field to define this entity.</p>
        ) : (
          fields.map((field, idx) => (
            <div key={idx} className="schema-field-row card">
              <input
                className="input"
                placeholder="Field name"
                value={field.name}
                onChange={(e) => updateField(idx, "name", e.target.value)}
              />
              <select
                className="input"
                value={field.type}
                onChange={(e) => updateField(idx, "type", e.target.value)}
              >
                <option value="string">String</option>
                <option value="number">Number</option>
                <option value="boolean">Boolean</option>
                <option value="date">Date</option>
                <option value="array">Array</option>
                <option value="object">Object</option>
                <option value="enum">Enum</option>
              </select>
              <input
                className="input"
                placeholder="Description"
                value={field.description}
                onChange={(e) => updateField(idx, "description", e.target.value)}
              />
              {field.type === "enum" && (
                <input
                  className="input"
                  placeholder="Enum values (comma-separated)"
                  value={field.enum_values}
                  onChange={(e) => updateField(idx, "enum_values", e.target.value)}
                />
              )}
              <label className="connector-check-item">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => updateField(idx, "required", e.target.checked)}
                />
                Required
              </label>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeField(idx)}>
                Remove
              </button>
            </div>
          ))
        )}
      </div>
      <div className="schema-builder-preview">
        <h4 className="kb-settings-title">JSON Schema preview</h4>
        <pre className="kb-api-pre">{JSON.stringify(schema, null, 2)}</pre>
      </div>
    </div>
  );
}

export { slugify };
