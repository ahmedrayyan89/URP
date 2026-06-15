import { useState } from "react";
import UnstructuredPanel from "./UnstructuredPanel";
import StructuredPanel from "./StructuredPanel";
import PageHeader from "../layout/PageHeader";

export default function KnowledgeBase({ onStatsChange }) {
  const [tab, setTab] = useState("unstructured");

  return (
    <div className="page">
      <PageHeader
        title="Knowledge Base"
        subtitle={
          tab === "unstructured"
            ? "Ingest and manage unstructured policy documents into the vector index. Watch the ingestion pipeline execute in real-time."
            : "Browse structured HR and policy lookup tables with exact row and column values."
        }
      />

      <div className="tabs">
        <button
          type="button"
          className={`tab ${tab === "unstructured" ? "active" : ""}`}
          onClick={() => setTab("unstructured")}
        >
          Unstructured
        </button>
        <button
          type="button"
          className={`tab ${tab === "structured" ? "active" : ""}`}
          onClick={() => setTab("structured")}
        >
          Structured (DB / Tables)
        </button>
      </div>

      {tab === "unstructured" && (
        <UnstructuredPanel onRefresh={onStatsChange} />
      )}
      {tab === "structured" && <StructuredPanel />}
    </div>
  );
}
