export default function KBApiTab({ kbId }) {
  const endpoint = `/api/knowledge-bases/${kbId}/query`;
  const curl = `curl -X POST "http://localhost:8000${endpoint}" \\
  -H "Content-Type: application/json" \\
  -d '{"query": "What is the remote work policy?", "top_k": 5}'`;

  const sampleResponse = `{
  "query": "What is the remote work policy?",
  "answer": "...",
  "chunks": [
    {
      "chunk_id": "...",
      "content": "...",
      "score": 0.82,
      "retriever": "vector",
      "metadata": { "doc_title": "...", "kb_id": "${kbId}" }
    }
  ],
  "sources": ["Remote Work Policy"],
  "total_results": 5
}`;

  return (
    <div className="kb-tab-panel">
      <p className="text-sm text-muted mb-2">
        Agents call this endpoint to retrieve context from this knowledge base.
      </p>

      <div className="card kb-api-block">
        <h4 className="kb-api-label">Endpoint</h4>
        <code className="kb-api-code">POST {endpoint}</code>
      </div>

      <div className="card kb-api-block mt-2">
        <h4 className="kb-api-label">Sample request (curl)</h4>
        <pre className="kb-api-pre">{curl}</pre>
      </div>

      <div className="card kb-api-block mt-2">
        <h4 className="kb-api-label">Response shape</h4>
        <pre className="kb-api-pre">{sampleResponse}</pre>
      </div>
    </div>
  );
}
