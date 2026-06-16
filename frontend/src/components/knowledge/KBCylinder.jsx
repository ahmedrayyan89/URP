export default function KBCylinder({ kb, onClick }) {
  const typeLabel =
    kb.type === "structured" ? "Structured" : "Unstructured";

  return (
    <button type="button" className="kb-cylinder" onClick={onClick}>
      <span className="kb-cylinder-name">{kb.name}</span>
      <span
        className={`kb-cylinder-badge ${
          kb.type === "structured" ? "kb-cylinder-badge-structured" : ""
        }`}
      >
        {typeLabel}
      </span>
    </button>
  );
}
