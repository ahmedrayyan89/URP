import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import EntityDefinitionCard from "../components/entities/EntityDefinitionCard";
import { IconPlus, IconSearch } from "../components/layout/Icons";

// Import CMI Integrated Entities list pages for embedding as tabs
import VendorListPage from "../cmi/pages/VendorListPage";
import ContractListPage from "../cmi/pages/ContractListPage";
import ProductListPage from "../cmi/pages/ProductListPage";
import RawMaterialsListPage from "../cmi/pages/RawMaterialsListPage";

export default function EntitiesPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const [definitions, setDefinitions] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Detect active tab from URL path
  const getActiveTab = () => {
    if (pathname.endsWith("/entities/instances")) return "instances";
    if (pathname.endsWith("/entities/vendors")) return "vendors";
    if (pathname.endsWith("/entities/contracts")) return "contracts";
    if (pathname.endsWith("/entities/products")) return "products";
    if (pathname.endsWith("/entities/raw-materials")) return "raw_materials";
    return "definitions"; // default
  };

  const tab = getActiveTab();

  const load = () => {
    setLoading(true);
    Promise.all([
      api.listEntityDefinitions(projectId),
      api.listAllEntityInstances(projectId, statusFilter || undefined),
    ])
      .then(([defs, insts]) => {
        setDefinitions(defs.definitions || []);
        setInstances(insts.instances || []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [projectId, statusFilter]);

  const q = query.trim().toLowerCase();

  const filteredDefs = definitions.filter(
    (d) =>
      !q ||
      d.name.toLowerCase().includes(q) ||
      d.description?.toLowerCase().includes(q)
  );

  const filteredInsts = instances.filter(
    (i) =>
      !q ||
      i.definition_name?.toLowerCase().includes(q) ||
      JSON.stringify(i.data).toLowerCase().includes(q)
  );

  return (
    <div className="shell-page">
      <div className="kb-catalog-header-ref" style={{ marginBottom: 20 }}>
        <div className="kb-catalog-header-left">
          <h1 className="shell-page-title">Entities</h1>
          <p className="shell-page-sub">
            Typed JSON schemas and instances — contracts, POs, vendors, and more.
          </p>
        </div>
        {(tab === "definitions" || tab === "instances") && (
          <div className="kb-catalog-header-right">
            <div className="kb-catalog-search-ref">
              <IconSearch size={16} />
              <input
                className="connectors-search-input"
                placeholder="Search..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => navigate(`/projects/${projectId}/entities/definitions/new`)}
            >
              <IconPlus size={16} />
              New Entity
            </button>
          </div>
        )}
      </div>

      <div className="kb-detail-tabs mb-2" style={{ display: "flex", gap: 16 }}>
        <button
          type="button"
          className={`kb-detail-tab ${tab === "definitions" ? "active" : ""}`}
          onClick={() => navigate(`/projects/${projectId}/entities`)}
        >
          Definitions
        </button>
        <button
          type="button"
          className={`kb-detail-tab ${tab === "instances" ? "active" : ""}`}
          onClick={() => navigate(`/projects/${projectId}/entities/instances`)}
        >
          Instances
        </button>
        <button
          type="button"
          className={`kb-detail-tab ${tab === "vendors" ? "active" : ""}`}
          onClick={() => navigate(`/projects/${projectId}/entities/vendors`)}
        >
          Vendors
        </button>
        <button
          type="button"
          className={`kb-detail-tab ${tab === "contracts" ? "active" : ""}`}
          onClick={() => navigate(`/projects/${projectId}/entities/contracts`)}
        >
          Contracts
        </button>
        <button
          type="button"
          className={`kb-detail-tab ${tab === "products" ? "active" : ""}`}
          onClick={() => navigate(`/projects/${projectId}/entities/products`)}
        >
          Products
        </button>
        <button
          type="button"
          className={`kb-detail-tab ${tab === "raw_materials" ? "active" : ""}`}
          onClick={() => navigate(`/projects/${projectId}/entities/raw-materials`)}
        >
          Raw Materials
        </button>
      </div>

      {tab === "instances" && (
        <div className="mb-2">
          <select
            className="input"
            style={{ maxWidth: 200 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All statuses</option>
            <option value="draft">Draft</option>
            <option value="validated">Validated</option>
            <option value="error">Error</option>
          </select>
        </div>
      )}

      {error && <div className="alert alert-error mb-2">{error}</div>}

      {tab === "definitions" && (
        loading ? (
          <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
        ) : filteredDefs.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No entity definitions</div>
            <div className="empty-sub">Create your first entity type to get started.</div>
          </div>
        ) : (
          <div className="entity-card-grid">
            {filteredDefs.map((d) => (
              <EntityDefinitionCard
                key={d.id}
                definition={d}
                onClick={() =>
                  navigate(`/projects/${projectId}/entities/definitions/${d.id}`)
                }
              />
            ))}
          </div>
        )
      )}

      {tab === "instances" && (
        loading ? (
          <div className="empty"><span className="spinner" style={{ width: 24, height: 24 }} /></div>
        ) : filteredInsts.length === 0 ? (
          <div className="empty">
            <div className="empty-title">No instances</div>
            <div className="empty-sub">Create instances from an entity definition detail page.</div>
          </div>
        ) : (
          <div className="card">
            <div className="data-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Data preview</th>
                    <th>Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInsts.map((inst) => (
                    <tr
                      key={inst.id}
                      className="clickable-row"
                      onClick={() =>
                        navigate(`/projects/${projectId}/entities/instances/${inst.id}`)
                      }
                    >
                      <td>{inst.definition_name}</td>
                      <td><span className="badge badge-grey">{inst.status}</span></td>
                      <td>{JSON.stringify(inst.data).slice(0, 80)}...</td>
                      <td>{new Date(inst.updated_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      {tab === "vendors" && <VendorListPage embed={true} />}
      {tab === "contracts" && <ContractListPage embed={true} />}
      {tab === "products" && <ProductListPage embed={true} />}
      {tab === "raw_materials" && <RawMaterialsListPage embed={true} />}
    </div>
  );
}
