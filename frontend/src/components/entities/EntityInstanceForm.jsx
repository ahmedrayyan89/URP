export default function EntityInstanceForm({ schema, data, onChange }) {
  const properties = schema?.properties || {};

  const setValue = (key, value) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="entity-instance-form">
      {Object.entries(properties).map(([key, prop]) => (
        <div key={key} className="form-row">
          <label className="form-label">
            {key}
            {schema.required?.includes(key) && " *"}
          </label>
          {prop.type === "boolean" ? (
            <input
              type="checkbox"
              checked={!!data[key]}
              onChange={(e) => setValue(key, e.target.checked)}
            />
          ) : prop.enum ? (
            <select
              className="input"
              value={data[key] || ""}
              onChange={(e) => setValue(key, e.target.value)}
            >
              <option value="">Select...</option>
              {prop.enum.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          ) : prop.type === "number" ? (
            <input
              className="input"
              type="number"
              value={data[key] ?? ""}
              onChange={(e) => setValue(key, Number(e.target.value))}
            />
          ) : (
            <input
              className="input"
              value={data[key] ?? ""}
              onChange={(e) => setValue(key, e.target.value)}
            />
          )}
          {prop.description && <span className="form-hint">{prop.description}</span>}
        </div>
      ))}
    </div>
  );
}
