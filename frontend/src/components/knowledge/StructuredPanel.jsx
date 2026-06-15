import { useState, useEffect, useCallback } from "react";
import { api } from "../../lib/api";
import {
  IconDatabase,
  IconFileText,
  IconPlus,
} from "../layout/Icons";
import CreateTableModal from "./CreateTableModal";
import StructuredTableDetail from "./StructuredTableDetail";

export default function StructuredPanel() {
  const [tables, setTables] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [tableDetail, setTableDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);

  const loadTables = useCallback(async () => {
    const data = await api.listStructuredTables();
    setTables(data.tables || []);
  }, []);

  useEffect(() => {
    loadTables()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadTables]);

  const openTable = async (tableId) => {
    setSelectedId(tableId);
    setDetailLoading(true);
    setError(null);
    try {
      const data = await api.getStructuredTable(tableId);
      setTableDetail(data);
    } catch (err) {
      setError(err.message);
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setTableDetail(null);
  };

  const handleCreated = async (table) => {
    setShowCreate(false);
    await loadTables();
    openTable(table.id);
  };

  const handleDeleted = async () => {
    closeDetail();
    await loadTables();
  };

  if (loading) {
    return (
      <div className="empty">
        <span className="spinner" style={{ width: 24, height: 24 }} />
        <div className="empty-sub mt-2">Loading structured tables...</div>
      </div>
    );
  }

  if (selectedId) {
    if (detailLoading || !tableDetail) {
      return (
        <div className="empty">
          <span className="spinner" style={{ width: 24, height: 24 }} />
          <div className="empty-sub mt-2">Loading table...</div>
        </div>
      );
    }

    return (
      <StructuredTableDetail
        table={tableDetail}
        onBack={closeDetail}
        onUpdated={(updated) => {
          setTableDetail(updated);
          loadTables();
        }}
        onDeleted={handleDeleted}
      />
    );
  }

  return (
    <div>
      <div className="flex-between mb-2">
        <p className="text-sm text-muted">
          HR and policy lookup tables with exact values. Create from a
          template, import CSV, or edit rows inline.
        </p>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setShowCreate(true)}
        >
          <IconPlus size={16} />
          New table
        </button>
      </div>

      {error && <div className="alert alert-error mb-2">{error}</div>}

      <div className="feature-grid">
        {tables.map((table) => (
          <button
            key={table.id}
            type="button"
            className="feature-card structured-table-card"
            onClick={() => openTable(table.id)}
          >
            <div className="feature-card-top">
              <div className="feature-card-icon">
                <IconDatabase size={20} />
              </div>
              {table.source === "user" ? (
                <span className="badge badge-amber">Custom</span>
              ) : (
                <span className="badge badge-blue">System</span>
              )}
            </div>
            <div className="feature-card-title">{table.name}</div>
            <div className="feature-card-desc">{table.description}</div>
            <div className="feature-card-footer">
              <span className="status-dot-sm green" />
              {table.row_count} rows · {table.column_count} columns
              <span className="ml-auto badge badge-grey">
                {table.source_doc}
              </span>
            </div>
          </button>
        ))}
      </div>

      {tables.length === 0 && (
        <div className="empty">
          <div className="empty-icon-wrap">
            <IconFileText size={24} />
          </div>
          <div className="empty-title">No structured tables yet</div>
          <div className="empty-sub">
            Create a table from a template or import a CSV file.
          </div>
          <button
            type="button"
            className="btn btn-primary mt-2"
            onClick={() => setShowCreate(true)}
          >
            <IconPlus size={16} />
            Create your first table
          </button>
        </div>
      )}

      {showCreate && (
        <CreateTableModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
