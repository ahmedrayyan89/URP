/**
 * CMI API client — calls URP's backend at /api/cmi/*
 * No separate CMI backend needed; URP's backend proxies to PostgreSQL.
 */

const BASE = "/api/cmi";

async function cmiCall(endpoint, options = {}) {
  const res = await fetch(`${BASE}${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Vendors ──────────────────────────────────────────────────────
export async function fetchVendors({ page = 1, pageSize = 20, status, category, search } = {}) {
  const p = new URLSearchParams({ page, page_size: pageSize });
  if (status) p.set("status", status);
  if (category) p.set("category", category);
  if (search) p.set("search", search);
  return cmiCall(`/vendors?${p}`);
}

export async function fetchVendorSummaries() {
  return cmiCall("/vendors/summary");
}

export async function fetchVendorById(id) {
  return cmiCall(`/vendors/${id}`);
}

export async function fetchVendorContracts(id) {
  return cmiCall(`/vendors/${id}/contracts`);
}

export async function createVendor(body) {
  return cmiCall("/vendors", { method: "POST", body: JSON.stringify(body) });
}

export async function updateVendor(id, body) {
  return cmiCall(`/vendors/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function deleteVendor(id) {
  return cmiCall(`/vendors/${id}`, { method: "DELETE" });
}

export async function fetchVendorCostModels(id) {
  // URP backend mirrors the CMI cost-models sub-route (returns empty list if none)
  return cmiCall(`/vendors/${id}/cost-models`).catch(() => []);
}

export function sumVendorSpendByPeriod(totalSpend) {
  if (!totalSpend || typeof totalSpend !== "object") return 0;
  return Object.values(totalSpend).reduce((a, b) => a + (Number(b) || 0), 0);
}

export function formatCurrency(amount) {
  if (!amount && amount !== 0) return "—";
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Contracts ─────────────────────────────────────────────────────
export async function fetchContracts({ page = 1, pageSize = 20, archived = false, status, vendorId, search } = {}) {
  const p = new URLSearchParams({ page, page_size: pageSize, archived });
  if (status) p.set("status", status);
  if (vendorId) p.set("vendor_id", vendorId);
  if (search) p.set("search", search);
  return cmiCall(`/contracts?${p}`);
}

export async function fetchContractById(id) {
  return cmiCall(`/contracts/${id}`);
}

export async function createContract(body) {
  return cmiCall("/contracts", { method: "POST", body: JSON.stringify(body) });
}

export async function updateContract(id, body) {
  return cmiCall(`/contracts/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function archiveContract(id) {
  return cmiCall(`/contracts/${id}/archive`, { method: "PATCH" });
}

export async function deleteContract(id) {
  return archiveContract(id);
}

export async function bulkArchiveContracts(contractIds) {
  return cmiCall("/contracts/bulk-archive", {
    method: "POST",
    body: JSON.stringify({ contract_ids: contractIds }),
  });
}

export async function fetchContractAgentStatus(contractId) {
  return cmiCall(`/contracts/${contractId}/agent/status`);
}

export async function fetchContractTerms(contractId) {
  return cmiCall(`/contracts/${contractId}/terms`);
}

export async function updateContractTerm(contractId, termId, status) {
  return cmiCall(`/contracts/${contractId}/terms/${termId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function fetchContractDocuments(contractId) {
  return cmiCall(`/contracts/${contractId}/documents`);
}

export async function fetchContractExtractedIngredients(contractId) {
  return cmiCall(`/contracts/${contractId}/ingredients`);
}

export async function fetchContractPdfObjectUrl(contractId) {
  const res = await fetch(`${BASE}/contracts/${contractId}/pdf`);
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

export async function getContractDocumentUrl(contractId) {
  return cmiCall(`/contracts/${contractId}/document-url`);
}

export async function resumeContractAgent(contractId, body = {}) {
  return cmiCall(`/contracts/${contractId}/agent/resume`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// ── Products ──────────────────────────────────────────────────────
export async function fetchProducts({ page = 1, pageSize = 20, status, category, search } = {}) {
  const p = new URLSearchParams({ page, page_size: pageSize });
  if (status) p.set("status", status);
  if (category) p.set("category", category);
  if (search) p.set("search", search);
  return cmiCall(`/products?${p}`);
}

export async function fetchProductById(id) {
  return cmiCall(`/products/${id}`);
}

export async function createProduct(body) {
  return cmiCall("/products", { method: "POST", body: JSON.stringify(body) });
}

export async function updateProduct(id, body) {
  return cmiCall(`/products/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

export async function fetchProductVendors(productId) {
  return cmiCall(`/products/${productId}/vendors`);
}

export async function fetchProductBOM(productId) {
  return cmiCall(`/products/${productId}/bom`);
}
