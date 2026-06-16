import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CONNECTOR_CATEGORIES } from "../data/connectors";
import ConnectorIcon from "../components/connectors/ConnectorIcon";
import FileConnectorModal from "../components/connectors/FileConnectorModal";
import { IconCloudUpload, IconSearch } from "../components/layout/Icons";

export default function ConnectorsPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);

  const q = query.trim().toLowerCase();

  const filteredCategories = CONNECTOR_CATEGORIES.map((cat) => ({
    ...cat,
    connectors: cat.connectors.filter(
      (c) => !q || c.name.toLowerCase().includes(q)
    ),
  })).filter((cat) => cat.connectors.length > 0);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleConnectorClick = (connector) => {
    if (connector.id === "file") {
      setShowFileModal(true);
      return;
    }
    showToast(`${connector.name} connector setup coming soon`);
  };

  return (
    <div className="shell-page connectors-page">
      <div className="connectors-header">
        <div className="connectors-title-row">
          <div className="connectors-title">
            <IconCloudUpload size={22} />
            <h1>Add Connector</h1>
          </div>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => navigate(`/projects/${projectId}/connectors/existing`)}
          >
            See Connectors
          </button>
        </div>

        <div className="connectors-search">
          <IconSearch size={16} />
          <input
            type="text"
            className="connectors-search-input"
            placeholder="Search connectors..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {toast && <div className="connectors-toast">{toast}</div>}

      {filteredCategories.length === 0 ? (
        <div className="empty">
          <div className="empty-title">No connectors found</div>
          <div className="empty-sub">Try a different search term.</div>
        </div>
      ) : (
        filteredCategories.map((cat) => (
          <section key={cat.id} className="connector-category">
            <h2 className="connector-category-title">{cat.label}</h2>
            <div className="connectors-grid">
              {cat.connectors.map((connector) => (
                <button
                  key={connector.id}
                  type="button"
                  className="connector-tile"
                  onClick={() => handleConnectorClick(connector)}
                >
                  <div className="connector-tile-icon-wrap">
                    <ConnectorIcon connectorId={connector.id} size={26} />
                  </div>
                  <span className="connector-tile-name">{connector.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))
      )}

      {showFileModal && (
        <FileConnectorModal
          projectId={projectId}
          onClose={() => setShowFileModal(false)}
          onSuccess={() => {
            setShowFileModal(false);
            showToast("File connector added successfully");
          }}
        />
      )}
    </div>
  );
}
