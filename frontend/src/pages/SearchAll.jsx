import React, { useState } from "react";
import api from "../api/client.js";

function MarkdownText({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm text-gray-700 leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.match(/^[-*]\s/)) return (
          <div key={i} className="flex gap-2">
            <span className="text-gray-400 flex-shrink-0 mt-0.5">•</span>
            <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
          </div>
        );
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1];
          return (
            <div key={i} className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0 w-4 text-right text-xs mt-0.5">{num}.</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, "")) }} />
            </div>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
      })}
    </div>
  );
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>');
}

const SUGGESTED = [
  "What are the key conclusions across my documents?",
  "What security topics are covered?",
  "Summarize the main themes",
  "What recommendations are mentioned?",
];

export default function SearchAll() {
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  async function handleSearch(e) {
    e?.preventDefault();
    if (!question.trim()) return;
    setError("");
    setAsking(true);
    const q = question;
    setQuestion("");

    try {
      const res = await api.post("/documents/ask-all", { question: q });
      const entry = { question: q, ...res.data, ts: new Date().toISOString() };
      setResult(entry);
      setHistory((prev) => [entry, ...prev.slice(0, 9)]);
    } catch (err) {
      setError(err.response?.data?.message || "Search failed. Make sure you have at least one indexed document.");
    } finally {
      setAsking(false);
    }
  }

  async function openPdf(documentId, pageNumber) {
    try {
      const res = await api.get(`/documents/${documentId}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(pageNumber ? `${url}#page=${pageNumber}` : url, "_blank");
    } catch {}
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title mb-1">Search all documents</h1>
        <p className="text-small">Ask a question across all your indexed documents at once.</p>
      </div>

      {/* Search box */}
      <div className="card p-5 mb-6">
        <form onSubmit={handleSearch}>
          <label className="label">Your question</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything across your documents…"
              disabled={asking}
              className="input flex-1"
              autoFocus
            />
            <button
              type="submit"
              disabled={asking || !question.trim()}
              className="btn-primary flex-shrink-0"
            >
              {asking ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              )}
              {asking ? "Searching…" : "Search"}
            </button>
          </div>
        </form>

        {/* Suggested queries */}
        {!result && !asking && (
          <div className="mt-4">
            <p className="text-xs text-gray-400 mb-2">Try asking</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED.map((q) => (
                <button
                  key={q}
                  onClick={() => { setQuestion(q); }}
                  className="text-xs px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}

      {/* Loading state */}
      {asking && (
        <div className="card p-6 mb-4 fade-in">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-4 w-3/4" />
          </div>
        </div>
      )}

      {/* Result */}
      {result && !asking && (
        <div className="space-y-4 fade-in">
          {/* Question */}
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-semibold text-gray-600">
              Q
            </div>
            <p className="text-sm font-medium text-gray-900 pt-0.5">{result.question}</p>
          </div>

          {/* Answer card */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <span className="text-xs font-medium text-gray-500">
                Searched {result.searchedDocuments?.length || 0} document{result.searchedDocuments?.length !== 1 ? "s" : ""}
              </span>
            </div>

            <MarkdownText text={result.answer} />

            {/* Sources */}
            {result.sourceChunks?.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-3">
                  {result.sourceChunks.length} source{result.sourceChunks.length > 1 ? "s" : ""}
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {result.sourceChunks.map((c, i) => (
                    <button
                      key={i}
                      onClick={() => c.documentId && openPdf(c.documentId, c.pageNumber)}
                      disabled={!c.documentId}
                      className="text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all group disabled:cursor-default"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" className="flex-shrink-0">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                        </svg>
                        <span className="text-xs font-medium text-indigo-600">{c.label}</span>
                        {c.documentName && (
                          <span className="text-xs text-gray-400 truncate">· {c.documentName}</span>
                        )}
                        {c.pageNumber && (
                          <span className="text-xs text-gray-400 ml-auto flex-shrink-0">p.{c.pageNumber}</span>
                        )}
                        {c.documentId && (
                          <span className="text-xs text-indigo-500 ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                            View →
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2">{c.text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Searched docs */}
          {result.searchedDocuments?.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-400">Searched:</span>
              {result.searchedDocuments.map((d) => (
                <span key={d.id} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {d.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty state - no result yet */}
      {!result && !asking && !error && (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-900 mb-1">Search across all documents</p>
          <p className="text-xs text-gray-400 max-w-xs mx-auto">
            Ask a question and DocuMind will search through all your indexed documents simultaneously, retrieving the most relevant answers.
          </p>
        </div>
      )}
    </div>
  );
}
