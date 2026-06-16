import { useState, useEffect, createContext, useContext } from "react";
import { Outlet, Navigate, useParams } from "react-router-dom";
import AppSidebar from "../components/layout/AppSidebar";
import { getProject } from "../data/projects";
import { api } from "../lib/api";

const ProjectContext = createContext({
  systemReady: false,
  stats: { total_documents: 0, total_chunks: 0 },
  refreshStats: () => {},
});

export function useProject() {
  return useContext(ProjectContext);
}

export default function ProjectShell() {
  const { projectId } = useParams();
  const project = getProject(projectId);
  const [systemReady, setSystemReady] = useState(false);
  const [stats, setStats] = useState({
    total_documents: 0,
    total_chunks: 0,
  });

  const refreshStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {}
  };

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await api.health();
        if (res.status === "ok") {
          setSystemReady(true);
          refreshStats();
        }
      } catch {
        setTimeout(checkHealth, 2500);
      }
    };
    checkHealth();
  }, []);

  if (!project) {
    return <Navigate to="/projects" replace />;
  }

  return (
    <ProjectContext.Provider value={{ systemReady, stats, refreshStats }}>
      <div className="project-shell">
        <AppSidebar />
        <main className="project-main">
          <Outlet />
        </main>
      </div>
    </ProjectContext.Provider>
  );
}
