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
  getKbStatus: (kbId) => req(`/knowledge-bases/${kbId}/status`),
  createKnowledgeBase: (payload) =>
    req("/knowledge-bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateKnowledgeBase: (kbId, payload) =>
    req(`/knowledge-bases/${kbId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteKnowledgeBase: (kbId) =>
    req(`/knowledge-bases/${kbId}`, { method: "DELETE" }),
  listKbDocuments: (kbId) => req(`/knowledge-bases/${kbId}/documents`),
  uploadKbDocument: async (kbId, file) => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/knowledge-bases/${kbId}/documents`, {
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
  deleteKbDocument: (kbId, docId) =>
    req(`/knowledge-bases/${kbId}/documents/${docId}`, { method: "DELETE" }),
  reindexKbDocument: (kbId, docId) =>
    req(`/knowledge-bases/${kbId}/documents/${docId}/reindex`, { method: "POST" }),
  reindexKnowledgeBase: (kbId) =>
    req(`/knowledge-bases/${kbId}/reindex`, { method: "POST" }),
  queryKnowledgeBase: (kbId, payload) =>
    req(`/knowledge-bases/${kbId}/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),

  // Entity definitions
  listEntityDefinitions: (projectId) =>
    req(`/entity-definitions?project_id=${encodeURIComponent(projectId)}`),
  getEntityDefinition: (id) => req(`/entity-definitions/${id}`),
  createEntityDefinition: (payload) =>
    req("/entity-definitions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateEntityDefinition: (id, payload) =>
    req(`/entity-definitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteEntityDefinition: (id) =>
    req(`/entity-definitions/${id}`, { method: "DELETE" }),

  // Entity instances
  listAllEntityInstances: (projectId, status) => {
    const params = new URLSearchParams();
    if (projectId) params.set("project_id", projectId);
    if (status) params.set("status", status);
    const q = params.toString();
    return req(`/entities/instances${q ? `?${q}` : ""}`);
  },
  getEntityInstance: (instanceId) => req(`/entities/instances/${instanceId}`),
  listEntityInstances: (slug, projectId, status) => {
    const params = new URLSearchParams({ project_id: projectId });
    if (status) params.set("status", status);
    return req(`/entities/${slug}?${params}`);
  },
  createEntityInstance: (slug, payload) =>
    req(`/entities/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateEntityInstance: (slug, instanceId, projectId, payload) =>
    req(`/entities/${slug}/${instanceId}?project_id=${encodeURIComponent(projectId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteEntityInstance: (slug, instanceId) =>
    req(`/entities/${slug}/${instanceId}`, { method: "DELETE" }),

  // Agents
  listAgents: (projectId) =>
    req(`/agents?project_id=${encodeURIComponent(projectId)}`),
  getAgent: (id) => req(`/agents/${id}`),
  createImportedAgent: (payload) =>
    req("/agents/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  createBuiltAgent: (payload) =>
    req("/agents/built", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  updateAgent: (id, payload) =>
    req(`/agents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  deleteAgent: (id) => req(`/agents/${id}`, { method: "DELETE" }),
  duplicateAgent: (id) => req(`/agents/${id}/duplicate`, { method: "POST" }),
  testAgentConnectionPreview: (payload) =>
    req("/agents/test-connection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  testAgentConnection: (id, payload) =>
    req(`/agents/${id}/test-connection`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    }),
  invokeAgent: (id, payload) =>
    req(`/agents/${id}/invoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }),
  listAgentInvocations: (id, limit = 50) =>
    req(`/agents/${id}/invocations?limit=${limit}`),

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
