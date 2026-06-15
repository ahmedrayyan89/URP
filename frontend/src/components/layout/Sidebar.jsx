const NAV = [
  {
    section: "Intelligence",
    items: [
      { id: "search", icon: "⌕", label: "Retrieval Search" },
    ],
  },
  {
    section: "Data",
    items: [
      { id: "knowledge", icon: "⊟", label: "Knowledge Base" },
    ],
  },
];

export default function Sidebar({ view, setView, stats }) {
  return (
    <aside className="sidebar">
      {NAV.map((group) => (
        <div key={group.section}>
          <div className="sidebar-section-label">{group.section}</div>
          <nav className="sidebar-nav">
            {group.items.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${view === item.id ? "active" : ""}`}
                onClick={() => setView(item.id)}
              >
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      ))}

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <div
          className="text-xs text-muted fw-600"
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 8,
          }}
        >
          Index
        </div>
        <div className="sidebar-footer-stat">
          <span className="sidebar-footer-label">Documents</span>
          <span className="sidebar-footer-val accent">
            {stats.total_documents}
          </span>
        </div>
        <div className="sidebar-footer-stat">
          <span className="sidebar-footer-label">Chunks</span>
          <span className="sidebar-footer-val">
            {stats.total_chunks}
          </span>
        </div>
        <div className="sidebar-footer-stat">
          <span className="sidebar-footer-label">Search</span>
          <span className="sidebar-footer-val green">hybrid</span>
        </div>
      </div>
    </aside>
  );
}