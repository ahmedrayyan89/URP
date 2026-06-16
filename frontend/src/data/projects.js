export const PROJECTS = [
  {
    id: "acme-corp-risk",
    name: "Acme Corp Risk",
    description: "Enterprise risk intelligence for HR policies, vendor assessments, and compliance.",
  },
  {
    id: "vendor-assessment",
    name: "Vendor Assessment Program",
    description: "Third-party risk monitoring, audit tracking, and vendor register management.",
  },
  {
    id: "compliance-hub",
    name: "Compliance Hub",
    description: "SOC 2, ISO 27001 controls mapping and regulatory policy knowledge base.",
  },
  {
    id: "internal-audit",
    name: "Internal Audit Workspace",
    description: "Audit findings, remediation workflows, and structured risk registers.",
  },
];

export function getProject(id) {
  return PROJECTS.find((p) => p.id === id);
}
