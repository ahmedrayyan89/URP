import { IconBox } from "../layout/Icons";

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function EntityDefinitionCard({ definition, onClick }) {
  return (
    <button type="button" className="entity-card" onClick={onClick}>
      <div className="entity-card-top">
        <div className="entity-card-icon">
          <IconBox size={18} />
        </div>
        <span className="entity-card-slug">{definition.slug}</span>
      </div>
      <h3 className="entity-card-name">{definition.name}</h3>
      <p className="entity-card-desc">{definition.description || "No description."}</p>
      <div className="entity-card-footer">
        <span>{definition.instance_count ?? 0} instances</span>
        <span>Updated {formatDate(definition.updated_at)}</span>
      </div>
    </button>
  );
}
