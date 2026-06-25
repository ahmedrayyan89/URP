import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

export default function ProcurementDashboardPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
    api
      .listProcurementCases()
      .then((d) => setCases(d.cases || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setError(null);
    try {
      await api.seedProcurementDemo();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSeeding(false);
    }
  };

  const scoreClass = (score) => {
    if (score >= 95) return "case-score-critical";
    if (score >= 80) return "case-score-high";
    return "case-score-medium";
  };

  return (
    <div className="shell-page">
      <div className="kb-catalog-header-ref">
        <div className="kb-catalog-header-left">
          <h1 className="shell-page-title">Procure Guard — High-Risk Queue</h1>
          <p className="shell-page-sub">
            Prioritized procurement anomalies flagged in the last 24 hours.
          </p>
        </div>
        <div className="header-actions-group">
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleSeed} disabled={seeding}>
            {seeding ? "Running pipeline..." : "Run demo scenarios"}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {loading ? (
        <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
      ) : cases.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No cases in queue</div>
          <div className="empty-sub">Run demo scenarios to populate CASE-010 and CASE-011.</div>
          <button type="button" className="btn btn-primary btn-sm mt-2" onClick={handleSeed} disabled={seeding}>
            Run demo scenarios
          </button>
        </div>
      ) : (
        <div className="case-card-grid">
          {cases.map((c) => (
            <div
              key={c.case_id}
              className="case-card card"
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/projects/${projectId}/cases/${encodeURIComponent(c.case_id)}`)}
              onKeyDown={(e) => e.key === "Enter" && navigate(`/projects/${projectId}/cases/${encodeURIComponent(c.case_id)}`)}
            >
              <div className="case-card-top">
                <span className="case-id">{c.case_id}</span>
                <span className={`case-score-pill ${scoreClass(c.risk_score)}`}>
                  {c.risk_score}/100
                </span>
              </div>
              <p className="case-label">{c.label}</p>
              <div className="case-metrics">
                <span>Exposure: <strong>${Number(c.financial_exposure || 0).toLocaleString()}</strong></span>
                <span className="badge badge-grey">{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
