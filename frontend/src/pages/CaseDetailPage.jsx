import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import CaseAuditPanel from "../components/procurement/CaseAuditPanel";

const TABS = ["Overview", "Reconciliation", "Audit trail"];

export default function CaseDetailPage() {
  const { projectId, caseId } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [tab, setTab] = useState("Overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [escalating, setEscalating] = useState(false);

  useEffect(() => {
    setLoading(true);
    api
      .getProcurementCase(decodeURIComponent(caseId))
      .then(setCaseData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  const handleEscalate = async () => {
    setEscalating(true);
    try {
      const updated = await api.escalateProcurementCase(decodeURIComponent(caseId));
      setCaseData(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setEscalating(false);
    }
  };

  if (loading) {
    return <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>;
  }

  if (!caseData) {
    return <div className="alert alert-error">Case not found</div>;
  }

  return (
    <div className="shell-page">
      <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate(`/projects/${projectId}/dashboard`)}>
        ← Command Center
      </button>

      <div className="flex-between mb-2">
        <div>
          <h1 className="shell-page-title">{caseData.case_id}</h1>
          <p className="shell-page-sub">{caseData.label}</p>
        </div>
        <div className="header-actions-group">
          {caseData.status !== "escalated" && (
            <button type="button" className="btn btn-primary btn-sm" onClick={handleEscalate} disabled={escalating}>
              {escalating ? "Escalating..." : "Take Action — Escalate to R&C"}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {caseData.status === "escalated" && (
        <div className="alert alert-success mb-2">
          Escalated — Workflow {caseData.workflow_id}
          <ul className="mt-1">
            {(caseData.workflow_log || []).map((line, i) => <li key={i}>{line}</li>)}
          </ul>
        </div>
      )}

      <div className="kb-wizard-steps mb-2">
        {TABS.map((t) => (
          <button key={t} type="button" className={`kb-wizard-step ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="card kb-tab-panel">
          <p className="text-sm text-muted mb-2">{caseData.narrative}</p>
          <dl className="kb-review-list">
            <dt>Risk score</dt><dd>{caseData.risk_score}/100 ({caseData.severity_band})</dd>
            <dt>Financial exposure</dt><dd>${Number(caseData.financial_exposure || 0).toLocaleString()}</dd>
            <dt>Completeness</dt><dd>{Math.round((caseData.completeness_score || 0) * 100)}%</dd>
            <dt>Process flags</dt><dd>{(caseData.process_flags || []).join(", ") || "—"}</dd>
          </dl>
        </div>
      )}

      {tab === "Reconciliation" && (
        <div className="card kb-tab-panel">
          <h4 className="mb-2">Price trajectory</h4>
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Bid</th>
                  <th>Contract</th>
                  <th>PO/GR</th>
                  <th>Qty</th>
                  <th>Variance</th>
                  <th>Exposure</th>
                </tr>
              </thead>
              <tbody>
                {(caseData.price_matrix || []).map((row) => (
                  <tr key={row.line_id}>
                    <td>{row.description || row.line_id}</td>
                    <td>{row.bid_unit_price != null ? `$${row.bid_unit_price}` : "—"}</td>
                    <td>{row.contract_unit_price != null ? `$${row.contract_unit_price}` : "—"}</td>
                    <td>{row.po_unit_price != null ? `$${row.po_unit_price}` : "—"}</td>
                    <td>{row.quantity?.toLocaleString?.() ?? row.quantity}</td>
                    <td>${row.variance}</td>
                    <td><strong>${Number(row.exposure).toLocaleString()}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h4 className="mt-2 mb-1">Process checks</h4>
          <ul className="kb-table-list">
            {(caseData.process_flags || []).map((f) => (
              <li key={f}><span className="badge badge-grey">{f}</span></li>
            ))}
          </ul>
          {(caseData.collusion_signals || []).length > 0 && (
            <>
              <h4 className="mt-2 mb-1">Collusion signals</h4>
              <ul className="kb-table-list">
                {caseData.collusion_signals.map((s, i) => (
                  <li key={i}>{s.evidence}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {tab === "Audit trail" && (
        <CaseAuditPanel caseData={caseData} />
      )}
    </div>
  );
}
