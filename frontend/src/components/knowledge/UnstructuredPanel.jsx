import { useState, useEffect, useRef } from "react";
import { api, streamIngest } from "../../lib/api";
import { formatBytes, formatDate, formatTime } from "../../lib/utils.jsx";
import IngestionPipeline from "./IngestionPipeline";
import {
  IconFolder,
  IconPen,
  IconFileText,
  IconLayers,
} from "../layout/Icons";

export default function UnstructuredPanel({ onRefresh }) {
  const [subTab, setSubTab] = useState("preload");
  const [preloadDocs, setPreloadDocs] = useState([]);
  const [indexedDocs, setIndexedDocs] = useState([]);
  const [ingestingFile, setIngestingFile] = useState(null);
  const [ingesting, setIngesting] = useState(false);

  const [currentStage, setCurrentStage] = useState(null);
  const [logs, setLogs] = useState([]);
  const [chunksPreview, setChunksPreview] = useState(null);

  const [selectedDocChunks, setSelectedDocChunks] = useState(null);
  const [selectedDocTitle, setSelectedDocTitle] = useState("");

  const [form, setForm] = useState({
    title: "",
    content: "",
    source: "",
    doc_type: "policy",
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [preload, docs] = await Promise.all([
      api.listPreload().catch(() => ({ documents: [] })),
      api.listDocuments().catch(() => ({ documents: [] })),
    ]);
    setPreloadDocs(preload.documents || []);
    setIndexedDocs(
      (docs.documents || []).filter((d) => d.category === "unstructured")
    );
  };

  const addLog = (msg, type = "info") => {
    setLogs((prev) => [
      ...prev.slice(-80),
      { time: formatTime(), msg, type },
    ]);
  };

  const resetPipeline = () => {
    setCurrentStage(null);
    setChunksPreview(null);
    setLogs([]);
  };

  const handleStreamEvents = async (response) => {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop();

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const raw = line.slice(6).trim();
        if (raw === "[DONE]") return;

        try {
          const event = JSON.parse(raw);
          const { stage, message, chunks_preview } = event;

          addLog(message, stage === "complete" ? "success" : "info");
          setCurrentStage(stage);

          if (chunks_preview) setChunksPreview(chunks_preview);
        } catch {}
      }
    }
  };

  const ingestPreload = async (doc) => {
    if (ingestingFile) return;
    resetPipeline();
    setIngestingFile(doc.filename);
    addLog(`Starting: ${doc.title}`);

    try {
      const res = await streamIngest(`/ingest/preload/${doc.filename}`);
      await handleStreamEvents(res);
      addLog(`${doc.title} indexed successfully`, "success");
      await loadData();
      onRefresh();
    } catch (err) {
      addLog(`Error: ${err.message}`, "error");
    } finally {
      setIngestingFile(null);
    }
  };

  const ingestManual = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    resetPipeline();
    setIngesting(true);
    addLog(`Starting: ${form.title}`);

    try {
      const res = await streamIngest("/ingest/stream", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      await handleStreamEvents(res);
      addLog(`${form.title} indexed`, "success");
      setForm({ title: "", content: "", source: "", doc_type: "policy" });
      await loadData();
      onRefresh();
    } catch (err) {
      addLog(`Error: ${err.message}`, "error");
    } finally {
      setIngesting(false);
    }
  };

  const viewChunks = async (doc) => {
    if (selectedDocTitle === doc.title) {
      setSelectedDocChunks(null);
      setSelectedDocTitle("");
      return;
    }
    const data = await api.getChunks(doc.doc_id);
    setSelectedDocChunks(data.chunks);
    setSelectedDocTitle(doc.title);
  };

  const deleteDoc = async (docId, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await api.deleteDocument(docId);
    addLog(`Deleted: ${title}`, "warn");
    setSelectedDocChunks(null);
    setSelectedDocTitle("");
    await loadData();
    onRefresh();
  };

  const isIngesting = !!ingestingFile || ingesting;
  const showPipeline = currentStage !== null || logs.length > 0;

  return (
    <div>
      <div className="tabs">
        {[
          { id: "preload", label: "Bundled Documents" },
          { id: "paste", label: "Paste Text" },
          { id: "indexed", label: `Indexed (${indexedDocs.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            className={`tab ${subTab === t.id ? "active" : ""}`}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === "preload" && (
        <>
          <div className="card mb-2">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon">
                  <IconFolder size={18} />
                </span>
                Available Policy Documents
              </div>
              <span className="badge badge-grey">
                {preloadDocs.length} files
              </span>
            </div>
            <div className="preload-grid">
              {preloadDocs.map((doc) => {
                const isThis = ingestingFile === doc.filename;
                const already = indexedDocs.some(
                  (d) => d.source === doc.filename
                );
                return (
                  <button
                    key={doc.filename}
                    type="button"
                    className="preload-card"
                    onClick={() => ingestPreload(doc)}
                    disabled={isIngesting || already}
                  >
                    <div className="preload-card-name">
                      {isThis && <span className="spinner" />}
                      {doc.title}
                    </div>
                    <div className="preload-card-meta">
                      {already
                        ? "Already indexed"
                        : `${formatBytes(doc.size)} · ${doc.line_count} lines`}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {showPipeline && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">
                    <IconLayers size={18} />
                  </span>
                  Ingestion Pipeline
                </div>
                {currentStage === "complete" && (
                  <span className="badge badge-green">Complete</span>
                )}
              </div>
              <IngestionPipeline
                currentStage={currentStage}
                logs={logs}
                chunksPreview={chunksPreview}
              />
            </div>
          )}
        </>
      )}

      {subTab === "paste" && (
        <>
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="card-title-icon">
                  <IconPen size={18} />
                </span>
                Paste Document Text
              </div>
            </div>
            <form onSubmit={ingestManual}>
              <div className="form-row">
                <label className="form-label">Document Title</label>
                <input
                  className="input"
                  placeholder="e.g. Vendor Risk Assessment Policy"
                  value={form.title}
                  onChange={(e) =>
                    setForm({ ...form, title: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">Source Reference</label>
                <input
                  className="input"
                  placeholder="e.g. vendor_risk_policy_v2.txt"
                  value={form.source}
                  onChange={(e) =>
                    setForm({ ...form, source: e.target.value })
                  }
                />
              </div>
              <div className="form-row">
                <label className="form-label">Content</label>
                <textarea
                  className="textarea"
                  style={{ minHeight: 180 }}
                  placeholder="Paste document content here..."
                  value={form.content}
                  onChange={(e) =>
                    setForm({ ...form, content: e.target.value })
                  }
                />
              </div>
              <button
                className="btn btn-primary"
                type="submit"
                disabled={ingesting || !form.title || !form.content}
              >
                {ingesting ? (
                  <>
                    <span className="spinner" />
                    Ingesting...
                  </>
                ) : (
                  "Ingest Document"
                )}
              </button>
            </form>
          </div>

          {showPipeline && (
            <div className="card mt-2">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">
                    <IconLayers size={18} />
                  </span>
                  Ingestion Pipeline
                </div>
              </div>
              <IngestionPipeline
                currentStage={currentStage}
                logs={logs}
                chunksPreview={chunksPreview}
              />
            </div>
          )}
        </>
      )}

      {subTab === "indexed" && (
        <>
          {indexedDocs.length === 0 ? (
            <div className="empty">
              <div className="empty-icon-wrap">
                <IconFileText size={24} />
              </div>
              <div className="empty-title">No documents indexed yet</div>
              <div className="empty-sub">
                Go to Bundled Documents to ingest your first policy file
              </div>
            </div>
          ) : (
            <div className="doc-grid">
              {indexedDocs.map((doc) => (
                <div key={doc.doc_id} className="doc-card">
                  <div className="doc-card-top">
                    <div className="doc-card-icon-wrap">
                      <IconFileText size={20} />
                    </div>
                    <span className="badge badge-green">Indexed</span>
                  </div>
                  <div className="doc-card-title">{doc.title}</div>
                  <div className="doc-card-meta">
                    {doc.chunk_count} chunks · {formatBytes(doc.file_size)} ·{" "}
                    {formatDate(doc.ingested_at)}
                  </div>
                  <div className="doc-card-actions">
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => viewChunks(doc)}
                    >
                      {selectedDocTitle === doc.title
                        ? "Hide chunks"
                        : "View chunks"}
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteDoc(doc.doc_id, doc.title)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedDocChunks && (
            <div className="card mt-2">
              <div className="card-header">
                <div className="card-title">
                  <span className="card-title-icon">
                    <IconLayers size={18} />
                  </span>
                  Chunks — {selectedDocTitle}
                </div>
                <span className="badge badge-blue">
                  {selectedDocChunks.length} chunks
                </span>
              </div>
              <div className="chunk-list">
                {selectedDocChunks.map((chunk, i) => (
                  <div key={chunk.chunk_id} className="chunk-item">
                    <div className="chunk-header">
                      <span className="chunk-index">
                        #{chunk.metadata?.chunk_index ?? i}
                      </span>
                      <span>
                        {chunk.content.split(" ").length} words
                      </span>
                      <span style={{ marginLeft: "auto" }}>
                        char {chunk.metadata?.start_char}–
                        {chunk.metadata?.end_char}
                      </span>
                    </div>
                    <div className="chunk-body">{chunk.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
