import { useEffect, useRef, useState } from "react";
import { api } from "../../../lib/api";
import { IconUpload, IconTrash } from "../../layout/Icons";

function formatBytes(bytes) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function KBDocumentsTab({ kbId, kb, onRefresh }) {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const load = () => {
    setLoading(true);
    api
      .listKbDocuments(kbId)
      .then((d) => setDocs(d.documents || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [kbId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await api.uploadKbDocument(kbId, file);
      load();
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handleReindex = async (docId) => {
    try {
      await api.reindexKbDocument(kbId, docId);
      load();
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (docId) => {
    if (!window.confirm("Remove this document from the knowledge base?")) return;
    try {
      await api.deleteKbDocument(kbId, docId);
      load();
      onRefresh?.();
    } catch (err) {
      setError(err.message);
    }
  };

  if (kb?.type === "structured") {
    return (
      <div className="kb-tab-panel">
        <p className="text-muted">
          Structured knowledge bases use linked tables. Manage tables in the structured data section.
        </p>
        <ul className="kb-table-list">
          {(kb.structured_table_ids || []).map((id) => (
            <li key={id}>{id}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="kb-tab-panel">
      <div className="flex-between mb-2">
        <p className="text-sm text-muted">Ingested documents for this knowledge base.</p>
        <label className="btn btn-primary btn-sm">
          <IconUpload size={14} />
          {uploading ? "Uploading..." : "Upload"}
          <input ref={fileRef} type="file" hidden onChange={handleUpload} />
        </label>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {loading ? (
        <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
      ) : docs.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No documents yet</div>
          <div className="empty-sub">Upload a file to start indexing.</div>
        </div>
      ) : (
        <div className="card">
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Source</th>
                  <th>Size</th>
                  <th>Status</th>
                  <th>Indexed</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.doc_id}>
                    <td>{d.title}</td>
                    <td>{d.source}</td>
                    <td>{formatBytes(d.file_size)}</td>
                    <td><span className="badge badge-grey">{d.status}</span></td>
                    <td>{formatDate(d.indexed_at)}</td>
                    <td>
                      <div className="kb-doc-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleReindex(d.doc_id)}>
                          Re-index
                        </button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleRemove(d.doc_id)}>
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
