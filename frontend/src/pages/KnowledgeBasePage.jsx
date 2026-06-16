import KnowledgeBase from "../components/knowledge/KnowledgeBase";
import { useProject } from "../layouts/ProjectShell";

export default function KnowledgeBasePage() {
  const { refreshStats } = useProject();

  return (
    <div className="shell-page shell-page--flush">
      <KnowledgeBase onStatsChange={refreshStats} />
    </div>
  );
}
