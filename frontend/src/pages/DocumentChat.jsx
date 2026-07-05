import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import React from "react";
import api from "../api/client.js";

function MarkdownAnswer({ text }) {
  // Simple markdown renderer — bold, inline code, line breaks, lists
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />;
        // Bullet list
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-indigo-400 mt-0.5">•</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          );
        }
        // Numbered list
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1];
          return (
            <div key={i} className="flex gap-2">
              <span className="text-indigo-400 font-mono text-xs mt-0.5 w-4">{num}.</span>
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
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-700 text-indigo-300 px-1 rounded text-xs font-mono">$1</code>')
    .replace(/\*(.+?)\*/g, '<em class="text-gray-300">$1</em>');
}

export default function DocumentChat() {
  const { id } = useParams();
  const [document, setDocument] = useState(null);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => { loadDocument(); loadHistory(); }, [id]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [history]);

  async function loadDocument() {
    try {
      const res = await api.get(`/documents/${id}`);
      setDocument(res.data.document);
    } catch (err) { console.error(err); }
  }

  async function loadHistory() {
    try {
      const res = await api.get(`/documents/${id}/chat-history`);
      setHistory(res.data.history);
    } catch (err) { console.error(err); }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;
    setError("");
    setAsking(true);
    const q = question;
    setQuestion("");
    try {
      const res = await api.post(`/documents/${id}/ask`, { question: q });
      setHistory((prev) => [...prev, {
        question: q,
        answer: res.data.answer,
        sourceChunks: res.data.sourceChunks,
        createdAt: new Date().toISOString(),
      }]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get an answer. Try again.");
    } finally {
      setAsking(false);
    }
  }

  async function handleSummarize() {
    setSummaryLoading(true);
    setError("");
    try {
      const res = await api.get(`/documents/${id}/summary`);
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function openPdf(pageNumber = null) {
    try {
      const res = await api.get(`/documents/${id}/file`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(pageNumber ? `${url}#page=${pageNumber}` : url, "_blank");
    } catch (err) {
      setError("Failed to open PDF.");
    }
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const notReady = document.embeddingStatus !== "ready";
  const failed = document.embeddingStatus === "failed";

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center gap-4">
          <Link to="/" className="text-gray-500 hover:text-gray-300 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-white truncate text-sm">{document.originalName}</p>
            <p className="text-xs text-gray-500">
              {document.pageCount} pages · {document.chunkCount || 0} chunks ·{" "}
              <span className={failed ? "text-red-400" : notReady ? "text-yellow-400" : "text-emerald-400"}>
                {failed ? "Setup failed" : notReady ? "Indexing..." : "Ready"}
              </span>
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => openPdf()}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors"
            >
              View PDF
            </button>
            <button
              onClick={handleSummarize}
              disabled={summaryLoading || notReady}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 disabled:opacity-40 transition-colors"
            >
              {summaryLoading ? "Summarizing..." : "Summarize"}
            </button>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-6 py-6 flex flex-col">
        {summary && (
          <div className="mb-6 p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/40">
            <p className="text-xs font-medium text-indigo-400 mb-2 uppercase tracking-wider">Summary</p>
            <p className="text-sm text-gray-300 leading-relaxed">{summary}</p>
          </div>
        )}

        <div className="flex-1 space-y-6">
          {history.length === 0 && (
            <div className="text-center py-16">
              {failed ? (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-red-900/30 flex items-center justify-center mx-auto mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-gray-400 font-medium">Indexing failed</p>
                  <p className="text-gray-600 text-sm mt-1">
                    {document.summary || "This PDF's text couldn't be extracted. Try a text-based PDF."}
                  </p>
                </>
              ) : notReady ? (
                <>
                  <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-gray-400 text-sm">Indexing your document...</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 font-medium">Ask anything about this document</p>
                  <p className="text-gray-600 text-sm mt-1">Answers are grounded in the document's content</p>
                </>
              )}
            </div>
          )}

          {history.map((msg, i) => (
            <div key={i} className="space-y-3">
              {/* Question */}
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[80%] text-sm">
                  {msg.question}
                </div>
              </div>

              {/* Answer */}
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 text-xs font-bold text-gray-300">
                  D
                </div>
                <div className="flex-1">
                  <div className="bg-gray-900 border border-gray-800 rounded-2xl rounded-tl-sm px-4 py-3 text-gray-300">
                    <MarkdownAnswer text={msg.answer} />
                  </div>

                  {msg.sourceChunks?.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-400 transition-colors select-none">
                        {msg.sourceChunks.length} source{msg.sourceChunks.length > 1 ? "s" : ""}
                      </summary>
                      <div className="mt-2 space-y-1.5">
                        {msg.sourceChunks.map((c, j) => (
                          <button
                            key={j}
                            onClick={() => openPdf(c.pageNumber)}
                            className="block w-full text-left text-xs text-gray-500 bg-gray-900 hover:bg-gray-800 rounded-lg px-3 py-2 transition-colors border border-gray-800"
                          >
                            <span className="text-indigo-400 font-medium">
                              {c.label}{c.pageNumber ? ` · p.${c.pageNumber}` : ""}
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
          ))}
          <div ref={bottomRef} />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm py-2 px-3 rounded-lg bg-red-900/20 border border-red-800/30 mb-3">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleAsk} className="flex gap-2 pt-4 border-t border-gray-800/50">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={notReady ? "Waiting for indexing to complete..." : "Ask a question about this document..."}
            disabled={notReady || asking}
            className="flex-1 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-indigo-600 outline-none text-sm text-white placeholder-gray-600 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={notReady || asking || !question.trim()}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-sm font-medium text-white transition-colors"
          >
            {asking ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
