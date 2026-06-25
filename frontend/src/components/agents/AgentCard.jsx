import { IconBot, IconMoreVertical } from "../layout/Icons";
import { useEffect, useRef, useState } from "react";

const STATUS_CLASS = {
  draft: "agent-status-draft",
  active: "agent-status-active",
  pending: "agent-status-pending",
  building: "agent-status-building",
  error: "agent-status-error",
};

export default function AgentCard({ agent, onClick, onEdit, onDuplicate, onDelete, onTest }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  const status = agent.status || "draft";
  const platformTag = agent.import_platform
    ? agent.import_platform.toUpperCase()
    : null;
  const sourceLabel = agent.source === "built" && agent.framework === "langgraph"
    ? "LANGGRAPH"
    : agent.source === "built"
      ? "AI AGENT"
      : platformTag
        ? `IMPORTED · ${platformTag}`
        : "IMPORTED";

  return (
    <div className="agent-card" onClick={onClick} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && onClick?.()}>
      <div className="agent-card-header">
        <div
          className="agent-pill-icon"
          style={{ background: `${agent.icon_color || "#3b82f6"}22`, color: agent.icon_color || "#3b82f6" }}
        >
          <IconBot size={18} />
        </div>
        <span className="agent-card-name">{agent.name}</span>
        <span className={`agent-status-badge ${STATUS_CLASS[status] || "agent-status-draft"}`}>
          {status.toUpperCase()}
        </span>
        <div className="agent-card-menu" ref={menuRef}>
          <button
            type="button"
            className="btn btn-ghost btn-sm agent-menu-btn"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(!menuOpen);
            }}
          >
            <IconMoreVertical size={16} />
          </button>
          {menuOpen && (
            <div className="agent-dropdown">
              <button type="button" onClick={(e) => { e.stopPropagation(); onEdit?.(); setMenuOpen(false); }}>Edit</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onTest?.(); setMenuOpen(false); }}>Test</button>
              <button type="button" onClick={(e) => { e.stopPropagation(); onDuplicate?.(); setMenuOpen(false); }}>Duplicate</button>
              <button type="button" className="danger" onClick={(e) => { e.stopPropagation(); onDelete?.(); setMenuOpen(false); }}>Delete</button>
            </div>
          )}
        </div>
      </div>
      <p className="agent-card-desc">{agent.description || "No description."}</p>
      <div className="agent-card-footer">
        <IconBot size={12} />
        <span>{sourceLabel}</span>
      </div>
    </div>
  );
}
