export default function ToolCard({ tool, onDelete }) {
  const endpoint = tool.config?.endpoint || "—";
  const kbName = tool.config?.kb_name || tool.config?.kb_id || "—";

  return (
    <div className="tool-card card">
      <div className="tool-card-header">
        <h3 className="tool-card-name">{tool.name}</h3>
        <span className="badge badge-grey">{tool.type?.replace("_", " ")}</span>
      </div>
      <p className="tool-card-desc">{tool.description || "No description."}</p>
      <div className="tool-card-meta">
        <span className="text-sm text-muted">Knowledge base: {kbName}</span>
        <code className="tool-card-endpoint">POST {endpoint}</code>
      </div>
      <div className="tool-card-actions">
        <button type="button" className="btn btn-ghost btn-sm danger-text" onClick={onDelete}>
          Delete
        </button>
      </div>
    </div>
  );
}
