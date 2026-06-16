const BASE = "/api";

async function req(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, options);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(
      typeof err.detail === "string"
        ? err.detail
        : err.detail?.[0]?.msg || "Request failed"
    );
  }
  return res.json();
}

export const api = {
  // Health
  health: () => req("/health"),

  // Knowledge base
  listDocuments: () => req("/knowledge/documents"),
  getChunks: (docId) => req(`/knowledge/documents/${docId}/chunks`),
  deleteDocument: (docId) =>
    req(`/knowledge/documents/${docId}`, { method: "DELETE" }),
  listPreload: () => req("/knowledge/preload"),
  getStats: () => req("/knowledge/stats"),

  // Structured tables
  listStructuredTemplates: () => req("/structured/templates"),
  listStructuredTables: () => req("/structured/tables"),
  getStructuredTable: (tableId) => req(`/structured/tables/${tableId}`),
  createStructuredTable: (payload) =>
    req("/structured/tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  importStructuredTableCsv: async (name, description, file) => {
    const form = new FormData();
    form.append("file", file);
    form.append("name", name);
    form.append("description", description);
    const res = await fetch(`${BASE}/structured/tables/import`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(
        typeof err.detail === "string" ? err.detail : "Import failed"
      );
    }
    return res.json();
  },
  deleteStructuredTable: (tableId) =>
    req(`/structured/tables/${tableId}`, { method: "DELETE" }),
  replaceStructuredRows: (tableId, rows) =>
    req(`/structured/tables/${tableId}/rows`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    }),

  // Connectors
  listConnectors: (projectId) =>
    req(`/connectors?project_id=${encodeURIComponent(projectId)}`),
  uploadFileConnector: async (projectId, file, name = "") => {
    const form = new FormData();
    form.append("project_id", projectId);
    form.append("file", file);
    if (name) form.append("name", name);
    const res = await fetch(`${BASE}/connectors/file`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(
        typeof err.detail === "string" ? err.detail : "Upload failed"
      );
    }
    return res.json();
  },

  // Knowledge bases
  listKnowledgeBases: (projectId) =>
    req(`/knowledge-bases?project_id=${encodeURIComponent(projectId)}`),
  getKnowledgeBase: (kbId) => req(`/knowledge-bases/${kbId}`),
  createKnowledgeBase: (payload) =>
    req("/knowledge-bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteKnowledgeBase: (kbId) =>
    req(`/knowledge-bases/${kbId}`, { method: "DELETE" }),

  // Retrieval
  search: (payload) =>
    req("/retrieval/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
};

export function streamIngest(url, options = {}) {
  return fetch(`${BASE}${url}`, {
    method: "POST",
    ...options,
  });
}
