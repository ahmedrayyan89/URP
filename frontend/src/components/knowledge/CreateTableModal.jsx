import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { IconUpload } from "../layout/Icons";

export default function CreateTableModal({ onClose, onCreated }) {
  const [mode, setMode] = useState("template");
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listStructuredTemplates()
      .then((data) => {
        const list = data.templates || [];
        setTemplates(list);
        if (list.length) setTemplateId(list[0].id);
      })
      .catch((err) => setError(err.message));
  }, []);

  const selectedTemplate = templates.find((t) => t.id === templateId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Table name is required");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let table;
      if (mode === "template") {
        table = await api.createStructuredTable({
          template_id: templateId,
          name: name.trim(),
          description: description.trim(),
        });
      } else {
        if (!csvFile) {
          setError("Please select a CSV file");
          setLoading(false);
          return;
        }
        table = await api.importStructuredTableCsv(
          name.trim(),
          description.trim(),
          csvFile
        );
      }
      onCreated(table);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Create structured table</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-tabs">
          <button
            type="button"
            className={`modal-tab ${mode === "template" ? "active" : ""}`}
            onClick={() => setMode("template")}
          >
            From template
          </button>
          <button
            type="button"
            className={`modal-tab ${mode === "csv" ? "active" : ""}`}
            onClick={() => setMode("csv")}
          >
            Import CSV
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Table name</label>
            <input
              className="input"
              placeholder="e.g. Q1 Vendor Assessments"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-row">
            <label className="form-label">Description</label>
            <input
              className="input"
              placeholder="Optional description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {mode === "template" && (
            <div className="form-row">
              <label className="form-label">Template</label>
              <select
                className="input select"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              {selectedTemplate && (
                <p className="text-xs text-muted mt-1">
                  {selectedTemplate.description} ·{" "}
                  {selectedTemplate.columns.length} columns
                </p>
              )}
            </div>
          )}

          {mode === "csv" && (
            <div className="form-row">
              <label className="form-label">CSV file</label>
              <label className="upload-zone">
                <IconUpload size={20} />
                <span>{csvFile ? csvFile.name : "Choose .csv file"}</span>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  hidden
                  onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
                />
              </label>
              <p className="text-xs text-muted mt-1">
                First row must be column headers. UTF-8 encoding. Max 2MB.
              </p>
            </div>
          )}

          {error && <div className="alert alert-error mb-2">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Creating...
                </>
              ) : mode === "csv" ? (
                "Import table"
              ) : (
                "Create table"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
