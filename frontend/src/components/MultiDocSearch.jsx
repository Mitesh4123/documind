import { useState } from "react";
import api from "../api/client.js";
import React from "react";

function MarkdownAnswer({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.match(/^[-*]\s/)) return (
          <div key={i} className="flex gap-2">
            <span className="text-indigo-400">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
          </div>
        );
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
      })}
    </div>
  );
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-700 text-indigo-300 px-1 rounded text-xs font-mono">$1</code>');
}

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
      setError(err.response?.data?.message || "Search failed. Try again.");
    } finally {
      setAsking(false);
    }
  }

  async function openPdf(documentId, pageNumber) {
    try {
      const res = await api.get(`/documents/${documentId}/file`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(pageNumber ? `${url}#page=${pageNumber}` : url, "_blank");
    } catch { console.error("Failed to open PDF"); }
  }

  return (
    <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900/40 overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-lg bg-indigo-600/20 flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-indigo-400">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-white">Search all documents</h2>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question across all your documents..."
            disabled={asking}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-700 focus:border-indigo-600 outline-none text-sm text-white placeholder-gray-600 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={asking || !question.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-sm font-medium text-white transition-colors"
          >
            {asking ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : "Search"}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-xs mt-2 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </p>
        )}
      </div>

      {result && (
        <div className="border-t border-gray-800">
          <div className="px-5 py-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-300 mt-0.5">D</div>
              <div className="flex-1">
                <div className="text-gray-300">
                  <MarkdownAnswer text={result.answer} />
                </div>

                {result.sourceChunks?.length > 0 && (
                  <details className="mt-3">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
                      {result.sourceChunks.length} source{result.sourceChunks.length > 1 ? "s" : ""} from {result.searchedDocuments?.length} document{result.searchedDocuments?.length > 1 ? "s" : ""}
                    </summary>
                    <div className="mt-2 space-y-1.5">
                      {result.sourceChunks.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => c.documentId && openPdf(c.documentId, c.pageNumber)}
                          disabled={!c.documentId}
                          className="block w-full text-left text-xs text-gray-500 bg-gray-800 hover:bg-gray-750 rounded-lg px-3 py-2 transition-colors border border-gray-700 disabled:cursor-default"
                        >
                          <span className="text-indigo-400 font-medium">
                            {c.label}
                            {c.documentName && <span className="text-gray-500 font-normal"> · {c.documentName}</span>}
                            {c.pageNumber ? ` · p.${c.pageNumber}` : ""}
                          </span>
                          <span className="ml-2 text-gray-600">
                            {c.text.slice(0, 150)}{c.text.length > 150 ? "…" : ""}
                          </span>
                        </button>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
