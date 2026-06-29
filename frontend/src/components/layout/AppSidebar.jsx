import { NavLink, useNavigate, useParams } from "react-router-dom";
import {
  IconLayoutDashboard,
  IconBox,
  IconDatabase,
  IconScan,
  IconPlug,
  IconGitBranch,
  IconBot,
  IconWrench,
  IconServer,
  IconWorkflow,
  IconShield,
} from "./Icons";
import { getProject } from "../../data/projects";

const NAV = [
  { segment: "dashboard", label: "Dashboard", icon: IconLayoutDashboard },
  { segment: "entities", label: "Entities", icon: IconBox },
  { segment: "knowledge", label: "Knowledge Base", icon: IconDatabase },
  { segment: "document-intelligence", label: "Document Intelligence", icon: IconScan },
  { segment: "connectors", label: "Connectors", icon: IconPlug },
  { segment: "pipelines", label: "Data Pipelines", icon: IconGitBranch },
  { segment: "agents", label: "Agents", icon: IconBot },
  { segment: "tools", label: "Tools", icon: IconWrench },
  { segment: "mcp", label: "MCP Servers", icon: IconServer },
  { segment: "workflows", label: "Workflows", icon: IconWorkflow },
];

export default function AppSidebar() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const project = getProject(projectId);
  const base = `/projects/${projectId}`;

  return (
    <aside className="app-sidebar">
      <button
        type="button"
        className="app-sidebar-brand"
        onClick={() => navigate("/projects")}
        title="Back to projects"
      >
        <IconShield size={18} />
        <span>Unified Risk Platform</span>
      </button>

      {project && (
        <div className="app-sidebar-project">{project.name}</div>
      )}

      <nav className="app-sidebar-nav">
        {NAV.map(({ segment, label, icon: Icon }) => {
          if (segment === "entities") {
            return (
              <div key={segment} className="sidebar-nav-group">
                <NavLink
                  to={`${base}/${segment}`}
                  className={({ isActive }) =>
                    `sidebar-nav-item${isActive ? " active" : ""}`
                  }
                >
                  <Icon size={18} />
                  {label}
                </NavLink>
                <div className="sidebar-submenu">
                  <NavLink to={`${base}/entities/vendors`} className="sidebar-submenu-item">
                    Vendors
                  </NavLink>
                  <NavLink to={`${base}/entities/contracts`} className="sidebar-submenu-item">
                    Contracts
                  </NavLink>
                  <NavLink to={`${base}/entities/products`} className="sidebar-submenu-item">
                    Products
                  </NavLink>
                </div>
              </div>
            );
          }
          return (
            <NavLink
              key={segment}
              to={`${base}/${segment}`}
              className={({ isActive }) =>
                `sidebar-nav-item${isActive ? " active" : ""}`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
