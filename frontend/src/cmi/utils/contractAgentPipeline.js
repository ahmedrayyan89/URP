/**
 * Contract Agent pipeline utilities — shared across upload and monitoring views.
 * Ported from CMI's TypeScript contractAgentPipeline.ts to plain JS.
 */

export const CONTRACT_AGENT_PIPELINE_STORAGE_KEY = "contract_agent_pipeline_v1";
export const CONTRACT_AGENT_PIPELINE_EVENT = "contract-agent-pipeline";

/** Ordered pipeline steps displayed on the Contract Agent card. */
export const CONTRACT_AGENT_PIPELINE_STEPS = [
  { id: "uploaded",    label: "Contract uploaded",         shortLabel: "Upload",  purpose: "Accept the PDF, create the contract row, and persist the document to storage." },
  { id: "extraction",  label: "Extraction running",        shortLabel: "Extract", purpose: "Run document intelligence: OCR, tables, and full text." },
  { id: "reeval",      label: "Re-evaluating",             shortLabel: "Parse",   purpose: "Parse terms and ingredients with Azure OpenAI." },
  { id: "terms",       label: "Saving extracted terms",    shortLabel: "Terms",   purpose: "Write contract clauses and citations to structured term rows." },
  { id: "ingredients", label: "Saving extracted lines",    shortLabel: "Lines",   purpose: "Persist priced lines, MOQ, and run ingredient mapping." },
  { id: "complete",    label: "Complete",                  shortLabel: "Done",    purpose: "Contract Pending Review; review queue updated." },
];

export function readPipelineSnapshot() {
  try {
    const raw = localStorage.getItem(CONTRACT_AGENT_PIPELINE_STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p.updatedAt !== "number" || typeof p.activeStepIndex !== "number") return null;
    return p;
  } catch {
    return null;
  }
}

export function writePipelineSnapshot(s) {
  try {
    localStorage.setItem(CONTRACT_AGENT_PIPELINE_STORAGE_KEY, JSON.stringify(s));
  } catch { /* quota */ }
  window.dispatchEvent(new CustomEvent(CONTRACT_AGENT_PIPELINE_EVENT, { detail: s }));
}

export function clearPipelineSnapshot() {
  try {
    localStorage.removeItem(CONTRACT_AGENT_PIPELINE_STORAGE_KEY);
  } catch { /* ignore */ }
  window.dispatchEvent(new CustomEvent(CONTRACT_AGENT_PIPELINE_EVENT, {
    detail: { updatedAt: Date.now(), source: "system", activeStepIndex: -1, status: "idle" },
  }));
}

export function agentPipelinePhaseToStepIndex(phase) {
  switch ((phase || "").toLowerCase()) {
    case "queued":
    case "uploaded":           return 0;
    case "extraction_running": return 1;
    case "reevaluating":       return 2;
    case "saving_terms":       return 3;
    case "saving_ingredients": return 4;
    case "complete":
    case "failed":             return 5;
    default:                   return 0;
  }
}
