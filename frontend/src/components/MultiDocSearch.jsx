import { useState } from "react";
import api from "../api/client.js";

export default function MultiDocSearch() {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function handleSearch(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setError("");
    setAsking(true);
    setResult(null);

    try {
      const res = await api.post("/documents/ask-all", { question });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed");
    } finally {
      setAsking(false);
    }
  }

  async function openDocumentPdf(documentId, pageNumber) {
    try {
      const res = await api.get(`/documents/${documentId}/file`, {
        responseType: "blob",
      });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(pageNumber ? `${url}#page=${pageNumber}` : url, "_blank");
    } catch (err) {
      console.error("Failed to open PDF", err);
    }
  }

  return (
    <div className="mt-8 border border-indigo-900/50 rounded-xl p-5 bg-indigo-950/20">
      <h2 className="text-sm font-semibold text-indigo-300 mb-3">
        🔍 Search across all documents
      </h2>

      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question across all your documents..."
          disabled={asking}
          className="flex-1 p-2.5 rounded-lg bg-gray-800 border border-gray-700 outline-none focus:border-indigo-500 text-sm disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={asking || !question.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-4 rounded-lg text-sm font-medium"
        >
          {asking ? "Searching..." : "Search"}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {result && (
        <div className="space-y-3">
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 text-sm">
            <p className="whitespace-pre-wrap">{result.answer}</p>
          </div>

          {result.sourceChunks?.length > 0 && (
            <details open>
              <summary className="text-xs text-gray-500 cursor-pointer mb-2">
                {result.sourceChunks.length} source chunk(s) from{" "}
                {result.searchedDocuments?.length} document(s)
              </summary>
              <div className="space-y-2">
                {result.sourceChunks.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => openDocumentPdf(c.documentId, c.pageNumber)}
                    disabled={!c.documentId}
                    className="block w-full text-left text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 disabled:cursor-default rounded p-2 transition"
                  >
                    <span className="text-indigo-400 font-medium">
                      {c.label}
                      {c.documentName ? ` · ${c.documentName}` : ""}
                      {c.pageNumber ? ` · Page ${c.pageNumber}` : ""}
                    </span>{" "}
                    — {c.text.slice(0, 200)}
                    {c.text.length > 200 ? "..." : ""}
                  </button>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
