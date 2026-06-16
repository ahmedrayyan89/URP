import { useState } from "react";
import { IconUpload } from "../layout/Icons";
import { api } from "../../lib/api";

export default function FileConnectorModal({ projectId, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const connector = await api.uploadFileConnector(projectId, file, name);
      onSuccess(connector);
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
          <h3 className="modal-title">File Connector</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="text-sm text-muted mb-2">
          Upload a file to register it as a data source connector.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label">Display name (optional)</label>
            <input
              className="input"
              placeholder="e.g. HR Policy Pack"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-row">
            <label className="form-label">File</label>
            <label className="upload-zone">
              <IconUpload size={20} />
              <span>{file ? file.name : "Choose or drop a file"}</span>
              <input
                type="file"
                hidden
                accept=".txt,.pdf,.csv,.md,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
          </div>

          {error && <div className="alert alert-error mb-2">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner" />
                  Uploading...
                </>
              ) : (
                "Add connector"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
