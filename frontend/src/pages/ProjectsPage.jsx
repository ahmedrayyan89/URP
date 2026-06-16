import { useNavigate } from "react-router-dom";
import { PROJECTS } from "../data/projects";
import { IconFolderOpen } from "../components/layout/Icons";
import { logout } from "../lib/auth";

export default function ProjectsPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="projects-page">
      <header className="projects-header">
        <div>
          <h1 className="projects-title">Your projects</h1>
          <p className="projects-sub">
            Select a project to open its workspace.
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
          Sign out
        </button>
      </header>

      <div className="projects-grid">
        {PROJECTS.map((project) => (
          <button
            key={project.id}
            type="button"
            className="project-card"
            onClick={() => navigate(`/projects/${project.id}/dashboard`)}
          >
            <div className="project-card-icon">
              <IconFolderOpen size={22} />
            </div>
            <div className="project-card-name">{project.name}</div>
            <div className="project-card-desc">{project.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
