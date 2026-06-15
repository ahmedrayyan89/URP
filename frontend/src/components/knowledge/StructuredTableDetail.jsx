import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { IconDatabase, IconTrash } from "../layout/Icons";

function emptyRow(columns) {
  return Object.fromEntries(columns.map((c) => [c.key, ""]));
}

export default function StructuredTableDetail({
  table,
  onBack,
  onUpdated,
  onDeleted,
}) {
  const [draftRows, setDraftRows] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);

  const isUserTable = table.source === "user";

  useEffect(() => {
    setDraftRows(table.rows.map((r) => ({ ...r })));
    setDirty(false);
  }, [table]);

  const updateCell = (rowIndex, key, value) => {
    setDraftRows((prev) =>
      prev.map((row, i) =>
        i === rowIndex ? { ...row, [key]: value } : row
      )
    );
    setDirty(true);
  };

  const addRow = () => {
    setDraftRows((prev) => [...prev, emptyRow(table.columns)]);
    setDirty(true);
  };

  const removeRow = (rowIndex) => {
    setDraftRows((prev) => prev.filter((_, i) => i !== rowIndex));
    setDirty(true);
  };

  const saveChanges = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.replaceStructuredRows(table.id, draftRows);
      setDirty(false);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteTable = async () => {
    if (
      !confirm(
        `Delete "${table.name}"? This cannot be undone.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      await api.deleteStructuredTable(table.id);
      onDeleted();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex-between mb-2">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onBack}>
          ← Back to tables
        </button>
        <div className="flex gap-2">
          {isUserTable && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={deleteTable}
              disabled={deleting}
            >
              {deleting ? (
                <span className="spinner" />
              ) : (
                <>
                  <IconTrash size={14} />
                  Delete table
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={saveChanges}
            disabled={!dirty || saving}
          >
            {saving ? (
              <>
                <span className="spinner" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <span className="card-title-icon">
              <IconDatabase size={18} />
            </span>
            {table.name}
          </div>
          <div className="flex gap-2">
            {table.source === "system" && (
              <span className="badge badge-blue">System</span>
            )}
            {isUserTable && (
              <span className="badge badge-amber">Custom</span>
            )}
            <span className="badge badge-grey">{table.source_doc}</span>
          </div>
        </div>

        <p className="text-sm text-muted mb-2">{table.description}</p>

        <div className="data-table-wrap data-table-editable">
          <table className="data-table">
            <thead>
              <tr>
                {table.columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
                <th className="data-table-actions-col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {draftRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={table.columns.length + 1}
                    className="text-muted text-sm"
                    style={{ textAlign: "center", padding: 24 }}
                  >
                    No rows yet. Click &quot;Add row&quot; to get started.
                  </td>
                </tr>
              ) : (
                draftRows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {table.columns.map((col) => (
                      <td key={col.key}>
                        <input
                          className="data-table-input"
                          value={row[col.key] ?? ""}
                          onChange={(e) =>
                            updateCell(rowIndex, col.key, e.target.value)
                          }
                        />
                      </td>
                    ))}
                    <td className="data-table-actions-col">
                      <button
                        type="button"
                        className="btn btn-ghost btn-xs"
                        onClick={() => removeRow(rowIndex)}
                        title="Remove row"
                      >
                        <IconTrash size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex-between mt-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
            + Add row
          </button>
          <div className="text-xs text-muted">
            {draftRows.length} rows · {table.columns.length} columns
            {dirty && " · Unsaved changes"}
          </div>
        </div>
      </div>
    </div>
  );
}
