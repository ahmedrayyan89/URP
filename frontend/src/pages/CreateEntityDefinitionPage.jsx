import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import EntitySchemaBuilder, { slugify } from "../components/entities/EntitySchemaBuilder";

export default function CreateEntityDefinitionPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("manual");
  const [fields, setFields] = useState([
    { name: "", type: "string", required: false, description: "", enum_values: "" },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleNameChange = (val) => {
    setName(val);
    if (!slug || slug === slugify(name)) setSlug(slugify(val));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const def = await api.createEntityDefinition({
        project_id: projectId,
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim(),
        source_type: sourceType,
        fields: fields.filter((f) => f.name.trim()),
      });
      navigate(`/projects/${projectId}/entities/definitions/${def.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell-page">
      <button
        type="button"
        className="btn btn-ghost btn-sm mb-2"
        onClick={() => navigate(`/projects/${projectId}/entities`)}
      >
        ← Entities
      </button>
      <h1 className="shell-page-title">New Entity Definition</h1>

      <form onSubmit={handleSubmit} className="card" style={{ padding: 24 }}>
        <div className="form-row">
          <label className="form-label">Name</label>
          <input className="input" value={name} onChange={(e) => handleNameChange(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Slug</label>
          <input className="input" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Description</label>
          <textarea className="input textarea" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="form-row">
          <label className="form-label">Source type</label>
          <select className="input" value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <option value="manual">Manual</option>
            <option value="document_intelligence">Document Intelligence</option>
            <option value="api">API</option>
            <option value="connector">Connector</option>
          </select>
        </div>

        <EntitySchemaBuilder fields={fields} onChange={setFields} />

        {error && <div className="alert alert-error mt-2">{error}</div>}

        <div className="modal-actions mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => navigate(`/projects/${projectId}/entities`)}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Saving..." : "Create entity"}
          </button>
        </div>
      </form>
    </div>
  );
}
