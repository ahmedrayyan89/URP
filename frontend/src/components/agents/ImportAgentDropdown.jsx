import { useEffect, useRef, useState } from "react";
import { IconChevronDown } from "../layout/Icons";

const OPTIONS = [
  { id: "gcp", label: "Import from GCP" },
  { id: "aws", label: "Import from AWS" },
  { id: "azure", label: "Import from Azure" },
  { id: "a2a", label: "Import via A2A" },
];

export default function ImportAgentDropdown({ onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div className="import-dropdown-wrap" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-sm import-dropdown-btn"
        onClick={() => setOpen(!open)}
      >
        Import
        <IconChevronDown size={14} />
      </button>
      {open && (
        <div className="agent-dropdown import-dropdown-menu">
          {OPTIONS.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                setOpen(false);
                onSelect(opt.id);
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
