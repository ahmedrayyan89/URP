import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchVendorSummaries, createContract } from "../api/cmiApi";

const IconUpload = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-3)", marginBottom: 8 }}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const IconCloud = ({ color }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: color || "currentColor" }}>
    <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
  </svg>
);

const IconCheck = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: "white" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default function UploadContractPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [vendorsList, setVendorsList] = useState([]);
  
  // Form State
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    vendor_id: "",
    type: "Master Agreement",
    start_date: "",
    end_date: "",
    human_review: true,
  });

  useEffect(() => {
    fetchVendorSummaries()
      .then(setVendorsList)
      .catch(() => {});
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer?.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setFormData(prev => ({ ...prev, title: droppedFile.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFormData(prev => ({ ...prev, title: selectedFile.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleNextStep1 = () => {
    if (!file) {
      // Mock file selection if none selected (for demo purposes)
      setFile({ name: "Demo_Contract_2026.pdf" });
      setFormData(prev => ({ ...prev, title: "Demo_Contract_2026" }));
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!formData.title || !formData.vendor_id || !formData.start_date || !formData.end_date) {
      setError("Please fill all required fields.");
      return;
    }
    setError(null);
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    const vendor = vendorsList.find((v) => v.id === formData.vendor_id);
    const body = {
      title: formData.title,
      vendor_id: formData.vendor_id,
      vendor_name: vendor ? vendor.name : null,
      type: formData.type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: "AI Processing",
    };

    try {
      const newContract = await createContract(body);
      navigate(`/projects/${projectId}/entities/contracts/${newContract.id}`);
    } catch (err) {
      setError(err.message || "Failed to create contract");
      setLoading(false);
    }
  };

  const renderStepIcon = (num) => {
    const isCompleted = step > num;
    const isCurrent = step === num;
    
    return (
      <div style={{
        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: isCompleted ? "var(--green)" : isCurrent ? "#2563eb" : "white",
        border: `2px solid ${isCompleted ? "var(--green)" : isCurrent ? "#2563eb" : "var(--border)"}`,
        color: isCompleted || isCurrent ? "white" : "var(--text-3)",
        fontWeight: 600, fontSize: 14, zIndex: 2
      }}>
        {isCompleted ? <IconCheck /> : num}
      </div>
    );
  };

  return (
    <div className="shell-page" style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-3)", marginBottom: 8 }}>
        <span style={{ cursor: "pointer" }} onClick={() => navigate(`/projects/${projectId}/entities/contracts`)}>Contracts</span>
        <span style={{ color: "var(--border)" }}>/</span>
        <span style={{ color: "var(--text-2)", fontWeight: 500 }}>Upload Contract</span>
      </div>
      
      <h1 className="shell-page-title" style={{ marginBottom: 8 }}>Upload Contract</h1>
      <p style={{ color: "var(--text-3)", fontSize: 14, marginBottom: 32 }}>
        Upload a PDF — extraction runs asynchronously on the server; track progress here or on the contract page.
      </p>

      {error && <div className="alert alert-error mb-4">{error}</div>}

      <div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
        
        {/* Left Sidebar - Stepper */}
        <div style={{ width: 280, flexShrink: 0, position: "relative" }}>
          <div style={{ position: "absolute", left: 16, top: 32, bottom: 32, width: 2, background: "var(--border)", zIndex: 1 }}>
            {step > 1 && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: step === 3 ? "100%" : "50%", background: "var(--green)", transition: "height 0.3s" }} />}
          </div>
          
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 48, position: "relative", zIndex: 2 }}>
            {renderStepIcon(1)}
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: step >= 1 ? "var(--text)" : "var(--text-3)" }}>Upload & Extract Header</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>PDF + optional header extraction (runs on server)</div>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 48, position: "relative", zIndex: 2 }}>
            {renderStepIcon(2)}
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: step >= 2 ? "var(--text)" : "var(--text-3)" }}>Vendor & Contract Details</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Confirm or edit vendor and dates</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "flex-start", gap: 16, position: "relative", zIndex: 2 }}>
            {renderStepIcon(3)}
            <div style={{ paddingTop: 6 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: step >= 3 ? "var(--text)" : "var(--text-3)" }}>Preview & Submit</div>
              <div style={{ fontSize: 12, color: "var(--text-3)", marginTop: 4 }}>Submit - full extraction runs in background</div>
            </div>
          </div>
        </div>

        {/* Right Content Area */}
        <div style={{ flex: 1, background: "white", border: "1px solid var(--border)", borderRadius: 12, padding: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
          
          {/* STEP 1: Upload */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>Upload Contract File (Raw Extraction)</h2>
              
              <div 
                style={{ border: "2px dashed var(--border)", borderRadius: 12, padding: "48px 24px", textAlign: "center", background: "var(--surface-2)", cursor: "pointer", marginBottom: 32, transition: "background 0.2s" }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <input type="file" id="file-upload" accept=".pdf" style={{ display: "none" }} onChange={handleFileChange} />
                <IconUpload />
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>
                  {file ? file.name : "Drag and drop your contract PDF here"}
                </div>
                <div style={{ fontSize: 12, color: "var(--text-3)" }}>or click to browse files (PDF up to 50MB)</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
                <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
                <span style={{ fontSize: 12, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.05em" }}>OR</span>
                <div style={{ height: 1, flex: 1, background: "var(--border)" }} />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-2)" }}>Import from</span>
                <select className="input" style={{ width: 200, padding: "6px 12px" }}>
                  <option>File Storage</option>
                  <option>Salesforce</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 40 }}>
                <button className="btn btn-ghost" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 10, background: "white" }}>
                  <IconCloud color="#2563eb" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Google Drive</span>
                </button>
                <button className="btn btn-ghost" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12, border: "1px solid var(--border)", borderRadius: 10, background: "white" }}>
                  <IconCloud color="#0ea5e9" />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>OneDrive</span>
                </button>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-ghost" onClick={() => navigate(`/projects/${projectId}/entities/contracts`)}>
                  &lt; Back to Contracts
                </button>
                <button className="btn btn-primary" onClick={handleNextStep1} style={{ padding: "10px 24px", background: "#8b5cf6", border: "none" }}>
                  Extract Header & Continue &gt;
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Details */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Vendor & Contract Details</h2>
              
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, color: "var(--text-3)", marginBottom: 6 }}>File</label>
                <input className="input" value={file?.name || "Demo_Contract.pdf"} disabled style={{ width: "100%", background: "var(--surface-2)", color: "var(--text-3)" }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Vendor *</label>
                <select className="input" style={{ width: "100%" }} value={formData.vendor_id} onChange={(e) => setFormData({...formData, vendor_id: e.target.value})}>
                  <option value="">Select vendor...</option>
                  {vendorsList.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Contract Type *</label>
                <select className="input" style={{ width: "100%" }} value={formData.type} onChange={(e) => setFormData({...formData, type: e.target.value})}>
                  <option value="Master Agreement">Master Agreement</option>
                  <option value="Purchase Order">Purchase Order</option>
                  <option value="Amendment">Amendment</option>
                  <option value="Renewal">Renewal</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Start date *</label>
                  <input type="date" className="input" style={{ width: "100%" }} value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>End date *</label>
                  <input type="date" className="input" style={{ width: "100%" }} value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} />
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text-2)", marginBottom: 6 }}>Contract title</label>
                <input type="text" className="input" style={{ width: "100%" }} value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
                <div style={{ fontSize: 11, color: "var(--text-3)", marginTop: 6 }}>If empty, the PDF file name (without .pdf) is used.</div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px", background: "var(--surface-2)", borderRadius: 8, marginBottom: 40, border: "1px solid var(--border)" }}>
                <input type="checkbox" id="human-review" style={{ width: 16, height: 16, cursor: "pointer" }} checked={formData.human_review} onChange={(e) => setFormData({...formData, human_review: e.target.checked})} />
                <label htmlFor="human-review" style={{ fontSize: 13, color: "var(--text-2)", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-flex", background: "#dbeafe", color: "#1e40af", padding: 4, borderRadius: 4 }}><IconCheck /></span>
                  Human Review Before Submission
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-ghost" onClick={() => setStep(1)}>
                  &lt; Back
                </button>
                <button className="btn btn-primary" onClick={handleNextStep2} style={{ padding: "10px 32px", background: "#2563eb", border: "none" }}>
                  Next &gt;
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Preview */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Preview & Submit</h2>
              
              <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, padding: 24, marginBottom: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "16px 0", fontSize: 13.5 }}>
                  <div style={{ color: "var(--text-3)" }}>Contract title</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{formData.title}</div>
                  
                  <div style={{ color: "var(--text-3)" }}>Vendor</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{vendorsList.find(v => v.id === formData.vendor_id)?.name}</div>
                  
                  <div style={{ color: "var(--text-3)" }}>Contract Type</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{formData.type}</div>
                  
                  <div style={{ color: "var(--text-3)" }}>Start date</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{formData.start_date}</div>
                  
                  <div style={{ color: "var(--text-3)" }}>End date</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{formData.end_date}</div>
                  
                  <div style={{ color: "var(--text-3)" }}>File</div>
                  <div style={{ fontWeight: 600, textAlign: "right" }}>{file?.name || "Demo_Contract.pdf"}</div>
                  
                  <div style={{ color: "var(--text-3)" }}>Human Review</div>
                  <div style={{ fontWeight: 600, textAlign: "right", color: formData.human_review ? "#2563eb" : "var(--text)" }}>{formData.human_review ? "Enabled" : "Disabled"}</div>
                </div>
              </div>

              <div style={{ background: "#faf5ff", border: "1px solid #e9d5ff", padding: 20, borderRadius: 8, marginBottom: 40 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#9333ea", marginBottom: 6 }}>System processing</div>
                <div style={{ fontSize: 12.5, color: "var(--text-2)", lineHeight: 1.5 }}>
                  After you submit, the server saves the file immediately and runs Document Intelligence and AI parsing in the background (non-blocking). Terms, pricing, and clauses appear when each stage completes — progress is shown below. You will be notified to review the results before final submission.
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, borderTop: "1px solid var(--border)" }}>
                <button className="btn btn-ghost" onClick={() => setStep(2)}>
                  &lt; Back
                </button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={loading} style={{ padding: "10px 32px", background: "#2563eb", border: "none", display: "flex", alignItems: "center", gap: 8 }}>
                  {loading && <span className="spinner" style={{ width: 14, height: 14, borderTopColor: "white" }} />}
                  Upload & Process
                </button>
              </div>
              <div style={{ textAlign: "right", marginTop: 12, fontSize: 11, color: "var(--text-3)" }}>
                Live pipeline stages appear below after you submit — the server does not block on long OCR/LLM work.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
