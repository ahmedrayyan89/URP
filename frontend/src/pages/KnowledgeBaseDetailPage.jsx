import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import KBOverviewTab from "../components/knowledge/kb-detail/KBOverviewTab";
import KBDocumentsTab from "../components/knowledge/kb-detail/KBDocumentsTab";
import KBTestQueryTab from "../components/knowledge/kb-detail/KBTestQueryTab";
import KBApiTab from "../components/knowledge/kb-detail/KBApiTab";
import KBSettingsTab from "../components/knowledge/kb-detail/KBSettingsTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "documents", label: "Documents" },
  { id: "test", label: "Test query" },
  { id: "api", label: "API" },
  { id: "settings", label: "Settings" },
];

export default function KnowledgeBaseDetailPage() {
  const { projectId, kbId } = useParams();
  const navigate = useNavigate();
  const [kb, setKb] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const loadKb = useCallback(async () => {
    const data = await api.getKnowledgeBase(kbId);
    setKb(data);
    return data;
  }, [kbId]);

  const loadStatus = useCallback(async () => {
    const data = await api.getKbStatus(kbId);
    setStatus(data);
    return data;
  }, [kbId]);

  useEffect(() => {
    Promise.all([loadKb(), loadStatus()])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadKb, loadStatus]);

  useEffect(() => {
    if (!kb || (status?.status !== "indexing" && status?.status !== "initializing")) {
      return undefined;
    }
    const interval = setInterval(() => {
      loadStatus().then((s) => {
        if (s.status === "ready" || s.status === "error") {
          loadKb();
        }
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [kb, status?.status, loadKb, loadStatus]);

  if (loading) {
    return (
      <div className="shell-page">
        <div className="empty">
          <span className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      </div>
    );
  }

  if (error || !kb) {
    return (
      <div className="shell-page">
        <div className="alert alert-error">{error || "Knowledge base not found"}</div>
        <button
          type="button"
          className="btn btn-ghost btn-sm mt-2"
          onClick={() => navigate(`/projects/${projectId}/knowledge`)}
        >
          ← Back to catalog
        </button>
      </div>
    );
  }

  return (
    <div className="shell-page kb-detail-page">
      <div className="kb-detail-header">
        <div className="kb-detail-header-left">
          <button
            type="button"
            className="btn btn-ghost btn-sm kb-detail-back"
            onClick={() => navigate(`/projects/${projectId}/knowledge`)}
          >
            ← Knowledge Bases
          </button>
          <h1 className="kb-detail-title">{kb.name}</h1>
          <p className="kb-detail-sub text-sm text-muted">
            Retrieval layer — search across documents to answer questions.
          </p>
        </div>
      </div>

      <div className="kb-detail-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`kb-detail-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="kb-detail-content">
        {activeTab === "overview" && (
          <KBOverviewTab kb={kb} status={status} />
        )}
        {activeTab === "documents" && (
          <KBDocumentsTab
            kbId={kbId}
            kb={kb}
            onRefresh={() => {
              loadKb();
              loadStatus();
            }}
          />
        )}
        {activeTab === "test" && <KBTestQueryTab kbId={kbId} />}
        {activeTab === "api" && <KBApiTab kbId={kbId} />}
        {activeTab === "settings" && (
          <KBSettingsTab
            kb={kb}
            onUpdated={() => {
              loadKb();
              loadStatus();
            }}
          />
        )}
      </div>
    </div>
  );
}
