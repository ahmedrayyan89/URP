import { useState, useEffect } from "react";
import Topbar from "./components/layout/Topbar";
import KnowledgeBase from "./components/knowledge/KnowledgeBase";
import SearchPanel from "./components/retrieval/SearchPanel";
import { IconSearch, IconDatabase } from "./components/layout/Icons";
import { api } from "./lib/api";

const NAV = [
  { id: "search", label: "Retrieval Search", icon: IconSearch },
  { id: "knowledge", label: "Knowledge Base", icon: IconDatabase },
];

export default function App() {
  const [view, setView] = useState("search");
  const [systemReady, setSystemReady] = useState(false);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_chunks: 0,
  });

  const refreshStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.health();
        if (res.status === "ok") {
          setSystemReady(true);
          refreshStats();
        }
      } catch {
        setTimeout(checkHealth, 2500);
      }
    };
    checkHealth();
  }, []);

  return (
    <div className="app">
      <Topbar systemReady={systemReady} stats={stats} />

      <div className="app-nav-wrap">
        <nav className="app-nav">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={`app-nav-item ${view === id ? "active" : ""}`}
              onClick={() => setView(id)}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      <main className="main">
        {view === "search" && (
          <SearchPanel
            systemReady={systemReady}
            onNavigate={setView}
          />
        )}
        {view === "knowledge" && (
          <KnowledgeBase onStatsChange={refreshStats} />
        )}
      </main>
    </div>
  );
}
