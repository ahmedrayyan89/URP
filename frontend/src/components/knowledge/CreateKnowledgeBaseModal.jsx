import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { IconUpload } from "../layout/Icons";

const INDEXING_STRATEGIES = [
  { value: "semantic", label: "Semantic chunking" },
  { value: "fixed_size", label: "Fixed-size" },
  { value: "sliding_window", label: "Sliding window" },
];

const VECTOR_DBS = [
  { value: "chromadb", label: "Chroma (current)" },
  { value: "pinecone", label: "Pinecone" },
  { value: "weaviate", label: "Weaviate" },
  { value: "pgvector", label: "pgvector" },
];

const EMBEDDING_MODELS = [
  { value: "BAAI/bge-small-en-v1.5", label: "BAAI/bge-small-en-v1.5 (default)" },
  { value: "text-embedding-3-small", label: "OpenAI text-embedding-3-small" },
  { value: "all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2" },
  { value: "intfloat/e5-base-v2", label: "intfloat/e5-base-v2" },
];

export default function CreateKnowledgeBaseModal({
  projectId,
  onClose,
  onCreated,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("unstructured");
  const [indexingStrategy, setIndexingStrategy] = useState("semantic");
  const [vectorDb, setVectorDb] = useState("chromadb");
  const [knowledgeGraph, setKnowledgeGraph] = useState(false);
  const [embeddingModel, setEmbeddingModel] = useState("BAAI/bge-small-en-v1.5");
  const [dataSourceKind, setDataSourceKind] = useState("file_upload");
  const [file, setFile] = useState(null);
  const [connectorIds, setConnectorIds] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .listConnectors(projectId)
      .then((data) => setConnectors(data.connectors || []))
      .catch(() => setConnectors([]));
  }, [projectId]);

  const toggleConnector = (id) => {
    setConnectorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    if (dataSourceKind === "file_upload" && !file) {
      setError("Please select a file for upload");
      return;
    }
    if (dataSourceKind === "connectors" && connectorIds.length === 0) {
      setError("Select at least one connector");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const kb = await api.createKnowledgeBase({
        project_id: projectId,
        name: name.trim(),
        description: description.trim(),
        type,
        indexing_strategy: indexingStrategy,
        vector_db: vectorDb,
        knowledge_graph: knowledgeGraph,
        embedding_model: embeddingModel,
        data_source: {
          kind: dataSourceKind,
          file_name: file?.name || null,
          connector_ids: dataSourceKind === "connectors" ? connectorIds : [],
        },
      });
      onCreated(kb);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal kb-create-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 className="modal-title">Create Knowledge Base</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="kb-create-form">
            <div className="form-row">
              <label className="form-label">Name</label>
              <input
                className="input"
                placeholder="e.g. HR Policies"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <label className="form-label">Description</label>
              <textarea
                className="input textarea"
                rows={2}
                placeholder="What does this KB contain?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <span className="form-hint">Used by agents for tool routing</span>
            </div>

            <div className="form-row">
              <label className="form-label">Type</label>
              <div className="form-segment">
                <button
                  type="button"
                  className={`form-segment-btn ${
                    type === "unstructured" ? "active" : ""
                  }`}
                  onClick={() => setType("unstructured")}
                >
                  Unstructured
                </button>
                <button
                  type="button"
                  className={`form-segment-btn ${
                    type === "structured" ? "active" : ""
                  }`}
                  onClick={() => setType("structured")}
                >
                  Structured
                </button>
              </div>
            </div>

            <div className="kb-create-advanced">
              <div className="form-row">
                <label className="form-label">Indexing Strategy</label>
                <select
                  className="input"
                  value={indexingStrategy}
                  onChange={(e) => setIndexingStrategy(e.target.value)}
                >
                  {INDEXING_STRATEGIES.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Vector DB</label>
                <select
                  className="input"
                  value={vectorDb}
                  onChange={(e) => setVectorDb(e.target.value)}
                >
                  {VECTOR_DBS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label">Knowledge Graph</label>
                <div className="form-toggle">
                  <button
                    type="button"
                    className={`form-toggle-btn ${
                      !knowledgeGraph ? "active" : ""
                    }`}
                    onClick={() => setKnowledgeGraph(false)}
                  >
                    Disabled
                  </button>
                  <button
                    type="button"
                    className={`form-toggle-btn ${
                      knowledgeGraph ? "active" : ""
                    }`}
                    onClick={() => setKnowledgeGraph(true)}
                  >
                    Enabled
                  </button>
                </div>
              </div>

              <div className="form-row">
                <label className="form-label">Embedding Model</label>
                <select
                  className="input"
                  value={embeddingModel}
                  onChange={(e) => setEmbeddingModel(e.target.value)}
                >
                  {EMBEDDING_MODELS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <label className="form-label">Data Source</label>
              <div className="data-source-options">
                <label className="data-source-option">
                  <input
                    type="radio"
                    name="dataSource"
                    checked={dataSourceKind === "file_upload"}
                    onChange={() => setDataSourceKind("file_upload")}
                  />
                  File Upload
                </label>
                <label className="data-source-option">
                  <input
                    type="radio"
                    name="dataSource"
                    checked={dataSourceKind === "connectors"}
                    onChange={() => setDataSourceKind("connectors")}
                  />
                  Link Connector
                </label>
                <label className="data-source-option data-source-option--disabled">
                  <input type="radio" disabled />
                  GCS
                  <span className="badge badge-grey">Coming soon</span>
                </label>
                <label className="data-source-option data-source-option--disabled">
                  <input type="radio" disabled />
                  SharePoint
                  <span className="badge badge-grey">Coming soon</span>
                </label>
              </div>

              {dataSourceKind === "file_upload" && (
                <div className="data-source-panel">
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
              )}

              {dataSourceKind === "connectors" && (
                <div className="data-source-panel">
                  {connectors.length === 0 ? (
                    <p className="text-sm text-muted">
                      No connectors configured. Add a File connector first.
                    </p>
                  ) : (
                    <div className="connector-checklist">
                      {connectors.map((c) => (
                        <label key={c.id} className="connector-check-item">
                          <input
                            type="checkbox"
                            checked={connectorIds.includes(c.id)}
                            onChange={() => toggleConnector(c.id)}
                          />
                          <span>{c.name}</span>
                          <span className="badge badge-grey">{c.type}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                  Creating...
                </>
              ) : (
                "Create Knowledge Base"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
