import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProjectShell from "./layouts/ProjectShell";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import ConnectorsPage from "./pages/ConnectorsPage";
import ExistingConnectorsPage from "./pages/ExistingConnectorsPage";
import KnowledgeBaseCatalogPage from "./pages/KnowledgeBaseCatalogPage";
import KnowledgeBaseDetailPage from "./pages/KnowledgeBaseDetailPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import { isAuthenticated } from "./lib/auth";

function LoginRedirect({ children }) {
  if (isAuthenticated()) {
    return <Navigate to="/projects" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <LoginRedirect>
            <LoginPage />
          </LoginRedirect>
        }
      />

      <Route
        path="/projects"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/projects/:projectId"
        element={
          <ProtectedRoute>
            <ProjectShell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <PlaceholderPage
              title="Dashboard"
              description="Project overview and key risk metrics."
            />
          }
        />
        <Route
          path="entities"
          element={
            <PlaceholderPage
              title="Entities"
              description="Manage organizations, vendors, and business entities."
            />
          }
        />
        <Route path="knowledge" element={<KnowledgeBaseCatalogPage />} />
        <Route path="knowledge/:kbId" element={<KnowledgeBaseDetailPage />} />
        <Route path="connectors" element={<ConnectorsPage />} />
        <Route path="connectors/existing" element={<ExistingConnectorsPage />} />
        <Route
          path="pipelines"
          element={
            <PlaceholderPage
              title="Data Pipelines"
              description="Configure ingestion and transformation pipelines."
            />
          }
        />
        <Route
          path="agents"
          element={
            <PlaceholderPage
              title="Agents"
              description="Build and deploy intelligent risk agents."
            />
          }
        />
        <Route
          path="tools"
          element={
            <PlaceholderPage
              title="Tools"
              description="Register tools available to agents and workflows."
            />
          }
        />
        <Route
          path="mcp"
          element={
            <PlaceholderPage
              title="MCP Servers"
              description="Connect Model Context Protocol servers."
            />
          }
        />
        <Route
          path="workflows"
          element={
            <PlaceholderPage
              title="Workflows"
              description="Design multi-step automated workflows."
            />
          }
        />
      </Route>

      <Route
        path="*"
        element={
          <Navigate to={isAuthenticated() ? "/projects" : "/login"} replace />
        }
      />
    </Routes>
  );
}
