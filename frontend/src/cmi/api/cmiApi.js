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

export async function fetchContractAgentStatus(contractId) {
  return cmiCall(`/contracts/${contractId}/agent/status`);
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
