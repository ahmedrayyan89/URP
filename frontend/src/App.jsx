import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProjectShell from "./layouts/ProjectShell";
import LoginPage from "./pages/LoginPage";
import ProjectsPage from "./pages/ProjectsPage";
import ConnectorsPage from "./pages/ConnectorsPage";
import ExistingConnectorsPage from "./pages/ExistingConnectorsPage";
import KnowledgeBaseCatalogPage from "./pages/KnowledgeBaseCatalogPage";
import KnowledgeBaseDetailPage from "./pages/KnowledgeBaseDetailPage";
import DocumentIntelligencePage from "./pages/DocumentIntelligencePage";
import EntitiesPage from "./pages/EntitiesPage";
import CreateEntityDefinitionPage from "./pages/CreateEntityDefinitionPage";
import EntityDefinitionDetailPage from "./pages/EntityDefinitionDetailPage";
import EntityInstanceDetailPage from "./pages/EntityInstanceDetailPage";
import AgentsPage from "./pages/AgentsPage";
import CreateAgentBuilderPage from "./pages/CreateAgentBuilderPage";
import AgentDetailPage from "./pages/AgentDetailPage";
import ToolsPage from "./pages/ToolsPage";
import ProcurementDashboardPage from "./pages/ProcurementDashboardPage";
import CaseDetailPage from "./pages/CaseDetailPage";
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
          element={<ProcurementDashboardPage />}
        />
        <Route path="cases/:caseId" element={<CaseDetailPage />} />
        <Route
          path="entities"
          element={<EntitiesPage />}
        />
        <Route path="entities/definitions/new" element={<CreateEntityDefinitionPage />} />
        <Route path="entities/definitions/:defId" element={<EntityDefinitionDetailPage />} />
        <Route path="entities/instances/:instanceId" element={<EntityInstanceDetailPage />} />
        <Route path="knowledge" element={<KnowledgeBaseCatalogPage />} />
        <Route path="knowledge/:kbId" element={<KnowledgeBaseDetailPage />} />
        <Route path="document-intelligence" element={<DocumentIntelligencePage />} />
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
        <Route path="agents" element={<AgentsPage />} />
        <Route path="agents/new" element={<CreateAgentBuilderPage />} />
        <Route path="agents/:agentId" element={<AgentDetailPage />} />
        <Route path="tools" element={<ToolsPage />} />
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
