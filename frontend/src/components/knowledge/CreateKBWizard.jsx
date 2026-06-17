import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { IconUpload } from "../layout/Icons";

const STEPS_UNSTRUCTURED = [
  "Basics",
  "Data sources",
  "Chunking",
  "Retrieval",
  "Review",
];
const STEPS_STRUCTURED = ["Basics", "Data sources", "Review"];

export default function CreateKBWizard({ projectId, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("unstructured");
  const [files, setFiles] = useState([]);
  const [connectorIds, setConnectorIds] = useState([]);
  const [connectors, setConnectors] = useState([]);
  const [structuredTables, setStructuredTables] = useState([]);
  const [tableIds, setTableIds] = useState([]);
  const [useDbConnection, setUseDbConnection] = useState(false);
  const [dbConfig, setDbConfig] = useState({
    host: "",
    port: 5432,
    database: "",
    username: "",
    password: "",
  });
  const [chunkStrategy, setChunkStrategy] = useState("semantic");
  const [chunkSize, setChunkSize] = useState(512);
  const [chunkOverlap, setChunkOverlap] = useState(64);
  const [useVector, setUseVector] = useState(true);
  const [useBm25, setUseBm25] = useState(true);
  const [useGraph, setUseGraph] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const steps = type === "structured" ? STEPS_STRUCTURED : STEPS_UNSTRUCTURED;
  const isLast = step === steps.length - 1;

  useEffect(() => {
    api.listConnectors(projectId).then((d) => setConnectors(d.connectors || [])).catch(() => {});
    api.listStructuredTables().then((d) => setStructuredTables(d.tables || [])).catch(() => {});
  }, [projectId]);

  const toggleConnector = (id) => {
    setConnectorIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleTable = (id) => {
    setTableIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const validateStep = () => {
    if (step === 0 && !name.trim()) {
      setError("Name is required");
      return false;
    }
    if (step === 1 && type === "structured" && !useDbConnection && tableIds.length === 0) {
      setError("Select at least one structured table or enable DB connection");
      return false;
    }
    setError(null);
    return true;
  };

  const next = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const back = () => {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dataSources = connectorIds.map((id) => ({
        kind: "connector",
        connector_id: id,
      }));

      const payload = {
        project_id: projectId,
        name: name.trim(),
        description: description.trim(),
        type,
        chunking_config: {
          strategy: chunkStrategy,
          chunk_size: chunkSize,
          overlap: chunkOverlap,
        },
        retrieval_config: {
          use_vector: useVector,
          use_bm25: useBm25,
          use_knowledge_graph: useGraph,
        },
        data_sources: dataSources,
        structured_table_ids: type === "structured" ? tableIds : [],
        connection_config:
          type === "structured" && useDbConnection ? dbConfig : null,
      };

      const kb = await api.createKnowledgeBase(payload);

      if (type === "unstructured" && files.length) {
        for (const file of files) {
          await api.uploadKbDocument(kb.id, file);
        }
      }

      onCreated(kb);
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
          <h3 className="modal-title">New Knowledge Base</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="kb-wizard-hint text-sm text-muted mb-2">
          Search across many documents and answer questions — not single-document extraction.
        </p>

        <div className="kb-wizard-steps">
          {steps.map((label, i) => (
            <div
              key={label}
              className={`kb-wizard-step ${i === step ? "active" : ""} ${i < step ? "done" : ""}`}
            >
              <span className="kb-wizard-step-num">{i + 1}</span>
              <span className="kb-wizard-step-label">{label}</span>
            </div>
          ))}
        </div>

        <div className="kb-wizard-body">
          {step === 0 && (
            <>
              <div className="form-row">
                <label className="form-label">Name</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. HR Policies"
                />
              </div>
              <div className="form-row">
                <label className="form-label">Description</label>
                <textarea
                  className="input textarea"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this KB contain?"
                />
                <span className="form-hint">Used by agents for tool routing</span>
              </div>
              <div className="form-row">
                <label className="form-label">Type</label>
                <div className="form-segment">
                  <button
                    type="button"
                    className={`form-segment-btn ${type === "unstructured" ? "active" : ""}`}
                    onClick={() => { setType("unstructured"); setStep(0); }}
                  >
                    Unstructured
                  </button>
                  <button
                    type="button"
                    className={`form-segment-btn ${type === "structured" ? "active" : ""}`}
                    onClick={() => { setType("structured"); setStep(0); }}
                  >
                    Structured
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 1 && type === "unstructured" && (
            <>
              <div className="form-row">
                <label className="form-label">File upload</label>
                <label className="upload-zone">
                  <IconUpload size={20} />
                  <span>
                    {files.length
                      ? `${files.length} file(s) selected`
                      : "Choose or drop files"}
                  </span>
                  <input
                    type="file"
                    hidden
                    multiple
                    accept=".txt,.pdf,.csv,.md,.doc,.docx"
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="form-label">Connectors</label>
                {connectors.length === 0 ? (
                  <p className="text-sm text-muted">No connectors configured yet.</p>
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
              <div className="data-source-options mt-1">
                <span className="data-source-option data-source-option--disabled">
                  GCS <span className="badge badge-grey">Coming soon</span>
                </span>
                <span className="data-source-option data-source-option--disabled">
                  SharePoint <span className="badge badge-grey">Coming soon</span>
                </span>
              </div>
            </>
          )}

          {step === 1 && type === "structured" && (
            <>
              <div className="form-row">
                <label className="form-label">Structured tables</label>
                {structuredTables.length === 0 ? (
                  <p className="text-sm text-muted">No structured tables available.</p>
                ) : (
                  <div className="connector-checklist">
                    {structuredTables.map((t) => (
                      <label key={t.id} className="connector-check-item">
                        <input
                          type="checkbox"
                          checked={tableIds.includes(t.id)}
                          onChange={() => toggleTable(t.id)}
                        />
                        <span>{t.name}</span>
                        <span className="badge badge-grey">{t.row_count} rows</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-row">
                <label className="connector-check-item">
                  <input
                    type="checkbox"
                    checked={useDbConnection}
                    onChange={(e) => setUseDbConnection(e.target.checked)}
                  />
                  Connect to external database (stored for future text-to-SQL)
                </label>
              </div>
              {useDbConnection && (
                <div className="kb-create-advanced">
                  <div className="form-row">
                    <label className="form-label">Host</label>
                    <input className="input" value={dbConfig.host} onChange={(e) => setDbConfig({ ...dbConfig, host: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Port</label>
                    <input className="input" type="number" value={dbConfig.port} onChange={(e) => setDbConfig({ ...dbConfig, port: Number(e.target.value) })} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Database</label>
                    <input className="input" value={dbConfig.database} onChange={(e) => setDbConfig({ ...dbConfig, database: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Username</label>
                    <input className="input" value={dbConfig.username} onChange={(e) => setDbConfig({ ...dbConfig, username: e.target.value })} />
                  </div>
                  <div className="form-row">
                    <label className="form-label">Password</label>
                    <input className="input" type="password" value={dbConfig.password} onChange={(e) => setDbConfig({ ...dbConfig, password: e.target.value })} />
                  </div>
                </div>
              )}
            </>
          )}

          {step === 2 && type === "unstructured" && (
            <>
              <div className="form-row">
                <label className="form-label">Chunk strategy</label>
                <select className="input" value={chunkStrategy} onChange={(e) => setChunkStrategy(e.target.value)}>
                  <option value="semantic">Semantic (recursive)</option>
                  <option value="fixed_size">Fixed-size</option>
                  <option value="sliding_window">Sliding window</option>
                </select>
              </div>
              <div className="form-row">
                <label className="form-label">Chunk size: {chunkSize}</label>
                <input type="range" min={128} max={2048} step={64} value={chunkSize} onChange={(e) => setChunkSize(Number(e.target.value))} className="kb-slider" />
              </div>
              <div className="form-row">
                <label className="form-label">Overlap: {chunkOverlap}</label>
                <input type="range" min={0} max={256} step={16} value={chunkOverlap} onChange={(e) => setChunkOverlap(Number(e.target.value))} className="kb-slider" />
              </div>
            </>
          )}

          {step === 3 && type === "unstructured" && (
            <>
              <div className="kb-toggle-row">
                <div>
                  <strong>Vector search</strong>
                  <p className="text-sm text-muted">Semantic similarity via embeddings</p>
                </div>
                <input type="checkbox" checked={useVector} onChange={(e) => setUseVector(e.target.checked)} />
              </div>
              <div className="kb-toggle-row">
                <div>
                  <strong>BM25</strong>
                  <p className="text-sm text-muted">Keyword matching for exact terms</p>
                </div>
                <input type="checkbox" checked={useBm25} onChange={(e) => setUseBm25(e.target.checked)} />
              </div>
              <div className="kb-toggle-row">
                <div>
                  <strong>Knowledge graph</strong>
                  <p className="text-sm text-muted">Relationship traversal (coming soon)</p>
                </div>
                <input type="checkbox" checked={useGraph} onChange={(e) => setUseGraph(e.target.checked)} disabled />
              </div>
            </>
          )}

          {((type === "unstructured" && step === 4) || (type === "structured" && step === 2)) && (
            <dl className="kb-review-list">
              <dt>Name</dt><dd>{name}</dd>
              <dt>Type</dt><dd>{type}</dd>
              <dt>Description</dt><dd>{description || "—"}</dd>
              {type === "unstructured" && (
                <>
                  <dt>Files</dt><dd>{files.length || "None"}</dd>
                  <dt>Connectors</dt><dd>{connectorIds.length || "None"}</dd>
                  <dt>Chunking</dt><dd>{chunkStrategy}, size {chunkSize}, overlap {chunkOverlap}</dd>
                  <dt>Retrieval</dt>
                  <dd>
                    {[useVector && "Vector", useBm25 && "BM25", useGraph && "Graph"].filter(Boolean).join(", ") || "None"}
                  </dd>
                </>
              )}
              {type === "structured" && (
                <>
                  <dt>Tables</dt><dd>{tableIds.length ? tableIds.join(", ") : "None"}</dd>
                  <dt>DB connection</dt><dd>{useDbConnection ? dbConfig.host || "Configured" : "None"}</dd>
                </>
              )}
            </dl>
          )}
        </div>

        {error && <div className="alert alert-error mb-2">{error}</div>}

        <div className="modal-actions">
          <button type="button" className="btn btn-ghost" onClick={step === 0 ? onClose : back}>
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {!isLast ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Next
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Knowledge Base"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
