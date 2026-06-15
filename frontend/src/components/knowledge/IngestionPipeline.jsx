import { useEffect, useRef } from "react";
import { IconCheck } from "../layout/Icons";

const STAGES = [
  { key: "chunking", label: "Splitting into chunks", num: "1" },
  { key: "embedding", label: "Generating embeddings", num: "2" },
  { key: "storing", label: "Writing to vector index", num: "3" },
  { key: "indexing", label: "Rebuilding BM25 index", num: "4" },
  { key: "complete", label: "Ingestion complete", num: "5" },
];

function stageStatus(stageKey, currentStage) {
  const order = STAGES.map((s) => s.key);
  const cur = order.indexOf(currentStage);
  const idx = order.indexOf(stageKey);
  if (cur === -1) return "idle";
  if (idx < cur) return "done";
  if (idx === cur) return "active";
  return "idle";
}

export default function IngestionPipeline({
  currentStage,
  logs,
  chunksPreview,
}) {
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div>
      {/* Stage steps */}
      <div className="pipeline" style={{ marginBottom: 16 }}>
        {STAGES.map((s) => {
          const status = stageStatus(s.key, currentStage);
          return (
            <div key={s.key} className={`stage ${status}`}>
              <div className="stage-dot">
                {status === "done" ? <IconCheck size={12} /> : s.num}
              </div>
              <div className="stage-label">{s.label}</div>
              <div className="stage-detail">
                {status === "active" && "running..."}
                {status === "done" && "done"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chunk preview */}
      {chunksPreview && chunksPreview.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div
            className="text-xs text-muted fw-600"
            style={{
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Chunk Preview — {chunksPreview.length} chunks created
          </div>
          <div className="chunk-list">
            {chunksPreview.slice(0, 3).map((c) => (
              <div key={c.index} className="chunk-item">
                <div className="chunk-header">
                  <span className="chunk-index">#{c.index}</span>
                  <span>{c.word_count} words</span>
                </div>
                <div className="chunk-body">{c.content}</div>
              </div>
            ))}
            {chunksPreview.length > 3 && (
              <div className="text-xs text-muted" style={{ padding: "4px 2px" }}>
                +{chunksPreview.length - 3} more chunks
              </div>
            )}
          </div>
        </div>
      )}

      {/* Log */}
      {logs.length > 0 && (
        <div className="log" ref={logRef}>
          {logs.map((line, i) => (
            <div key={i} className="log-line">
              <span className="log-time">{line.time}</span>
              <span className={`log-msg ${line.type || "info"}`}>
                {line.msg}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}