import {
  IconShield,
  IconBell,
  IconChevronDown,
} from "./Icons";

export default function Topbar({ systemReady, stats }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <div className="topbar-logo-icon">
            <IconShield size={18} />
          </div>
          <span className="topbar-logo-text">Unified Risk Platform</span>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-chip">
          <span>Documents</span>
          <span className="topbar-chip-val">{stats.total_documents}</span>
        </div>

        <div className="topbar-chip">
          <span>Chunks</span>
          <span className="topbar-chip-val">{stats.total_chunks}</span>
        </div>

        <div
          className={`status-indicator ${systemReady ? "" : "loading"}`}
        >
          <span
            className={`status-dot ${systemReady ? "" : "loading"}`}
          />
          {systemReady ? "System Ready" : "Loading Models..."}
        </div>

        <div className="topbar-org">
          URP-ORG
          <IconChevronDown />
        </div>

        <button className="topbar-icon-btn" type="button" aria-label="Notifications">
          <IconBell size={18} />
        </button>

        <div className="topbar-avatar" title="User">R</div>
      </div>
    </header>
  );
}
