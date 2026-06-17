import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../../lib/api";

export default function KBSettingsTab({ kb, onUpdated, onDeleted }) {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState(kb.name);
  const [description, setDescription] = useState(kb.description || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const updated = await api.updateKnowledgeBase(kb.id, { name, description });
      onUpdated?.(updated);
      setMessage("Settings saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReindex = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.reindexKnowledgeBase(kb.id);
      setMessage("Re-indexing started.");
      onUpdated?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${kb.name}"? This cannot be undone.`)) return;
    setLoading(true);
    try {
      await api.deleteKnowledgeBase(kb.id);
      onDeleted?.();
      navigate(`/projects/${projectId}/knowledge`);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="kb-tab-panel">
      <form onSubmit={handleSave} className="card kb-settings-form">
        <div className="form-row">
          <label className="form-label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Description</label>
          <textarea className="input textarea" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          Save changes
        </button>
      </form>

      <div className="card mt-2">
        <h4 className="kb-settings-title">Indexing</h4>
        <p className="text-sm text-muted mb-2">Re-trigger indexing for all configured data sources.</p>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleReindex} disabled={loading}>
          Re-index all
        </button>
      </div>

      <div className="card mt-2 kb-danger-zone">
        <h4 className="kb-settings-title">Danger zone</h4>
        <button type="button" className="btn btn-danger btn-sm" onClick={handleDelete} disabled={loading}>
          Delete knowledge base
        </button>
      </div>

      {message && <div className="alert alert-success mt-2">{message}</div>}
      {error && <div className="alert alert-error mt-2">{error}</div>}
    </div>
  );
}
