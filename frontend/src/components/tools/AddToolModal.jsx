import { useEffect, useState } from "react";
import { api } from "../../lib/api";

const TOOL_TYPES = [
  { value: "kb_retrieval", label: "Knowledge base retrieval", enabled: true },
  { value: "web_search", label: "Web search", enabled: false },
  { value: "http", label: "HTTP endpoint", enabled: false },
];

export default function AddToolModal({ projectId, onClose, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("kb_retrieval");
  const [kbId, setKbId] = useState("");
  const [kbs, setKbs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.listKnowledgeBases(projectId).then((d) => {
      const list = d.knowledge_bases || [];
      setKbs(list);
      if (list.length && !kbId) setKbId(list[0].id);
    }).catch(() => {});
  }, [projectId]);

  const selectedKb = kbs.find((k) => k.id === kbId);
  const endpoint = kbId ? `/api/knowledge-bases/${kbId}/query` : "";

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (type === "kb_retrieval" && !kbId) {
      setError("Select a knowledge base");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tool = await api.createTool({
        project_id: projectId,
        name: name.trim(),
        description: description.trim(),
        type,
        config: { kb_id: kbId },
        status: "active",
      });
      onSuccess(tool);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal kb-wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Add tool</h3>
          <button type="button" className="modal-close" onClick={onClose}>×</button>
        </div>
        <p className="text-sm text-muted mb-2">
          Register a reusable tool that agents can call at runtime.
        </p>

        <form onSubmit={handleSave}>
          <div className="form-row">
            <label className="form-label">Tool name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <label className="form-label">Description</label>
            <textarea className="input textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="form-row">
            <label className="form-label">Type</label>
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {TOOL_TYPES.map((t) => (
                <option key={t.value} value={t.value} disabled={!t.enabled}>
                  {t.label}{!t.enabled ? " (coming soon)" : ""}
                </option>
              ))}
            </select>
          </div>

          {type === "kb_retrieval" && (
            <>
              <div className="form-row">
                <label className="form-label">Knowledge base</label>
                <select className="input" value={kbId} onChange={(e) => setKbId(e.target.value)}>
                  {kbs.length === 0 && <option value="">No knowledge bases</option>}
                  {kbs.map((kb) => (
                    <option key={kb.id} value={kb.id}>{kb.name}</option>
                  ))}
                </select>
              </div>
              {endpoint && (
                <div className="card kb-api-block">
                  <h4 className="kb-api-label">Retrieval endpoint</h4>
                  <code className="kb-api-code">POST {endpoint}</code>
                  {selectedKb && (
                    <p className="text-sm text-muted mt-1">{selectedKb.description || "Hybrid vector + BM25 search"}</p>
                  )}
                </div>
              )}
            </>
          )}

          {error && <div className="alert alert-error mb-2">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || (type === "kb_retrieval" && !kbId)}>
              {loading ? "Saving..." : "Add tool"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
