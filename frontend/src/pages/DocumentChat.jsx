import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client.js";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function MarkdownText({ text }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-1" />;
        if (line.match(/^#{1,3}\s/)) {
          return <p key={i} className="font-semibold text-gray-900" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^#+\s/, "")) }} />;
        }
        if (line.match(/^[-*]\s/)) {
          return (
            <div key={i} className="flex gap-2">
              <span className="text-gray-400 mt-0.5 flex-shrink-0">•</span>
              <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: formatInline(line.slice(2)) }} />
            </div>
          );
        }
        if (line.match(/^\d+\.\s/)) {
          const num = line.match(/^(\d+)\./)[1];
          return (
            <div key={i} className="flex gap-2">
              <span className="text-gray-400 flex-shrink-0 w-4 text-right text-xs mt-0.5">{num}.</span>
              <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^\d+\.\s/, "")) }} />
            </div>
          );
        }
        return <p key={i} className="text-gray-700" dangerouslySetInnerHTML={{ __html: formatInline(line) }} />;
      })}
    </div>
  );
}

function formatInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-gray-100 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">$1</code>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function CitationChip({ chunk, onPageJump }) {
  return (
    <button
      onClick={() => onPageJump(chunk.pageNumber)}
      className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-xs font-medium hover:bg-indigo-100 transition-colors"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
      {chunk.label}{chunk.pageNumber ? ` · p.${chunk.pageNumber}` : ""}
    </button>
  );
}

function SourcesPanel({ chunks, onPageJump }) {
  const [expanded, setExpanded] = useState(false);
  if (!chunks || chunks.length === 0) return null;

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          className={`transition-transform ${expanded ? "rotate-90" : ""}`}>
          <polyline points="9 18 15 12 9 6"/>
        </svg>
        {chunks.length} source{chunks.length > 1 ? "s" : ""}
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {chunks.map((c, i) => (
            <div
              key={i}
              onClick={() => onPageJump(c.pageNumber)}
              className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all group"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-indigo-600">{c.label}</span>
                {c.pageNumber && <span className="text-xs text-gray-400">· Page {c.pageNumber}</span>}
                <span className="ml-auto text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">View in PDF →</span>
              </div>
              <p className="text-xs text-gray-500 line-clamp-2">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatMessage({ msg, onPageJump }) {
  return (
    <div className="space-y-3 fade-in">
      {/* User question */}
      <div className="flex justify-end">
        <div className="bubble-user">
          {msg.question}
        </div>
      </div>

      {/* AI answer */}
      <div className="flex gap-3 items-start">
        <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="bubble-ai">
            <MarkdownText text={msg.answer} />
            <SourcesPanel chunks={msg.sourceChunks} onPageJump={onPageJump} />
          </div>
          {msg.createdAt && (
            <p className="text-xs text-gray-400 mt-1 ml-1">{formatTime(msg.createdAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DocInfoPanel({ doc, onSummarize, summary, summaryLoading }) {
  async function openPdf(page = null) {
    try {
      const res = await api.get(`/documents/${doc._id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(page ? `${url}#page=${page}` : url, "_blank");
    } catch {}
  }

  const statusMap = {
    ready: { label: "Chat ready", cls: "pill-ready" },
    processing: { label: "Indexing…", cls: "pill-processing" },
    pending: { label: "Pending", cls: "pill-pending" },
    failed: { label: "Setup failed", cls: "pill-failed" },
  };
  const s = statusMap[doc.embeddingStatus] || statusMap.pending;

  return (
    <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-white h-full overflow-y-auto">
      <div className="p-5">
        {/* File info */}
        <div className="mb-5">
          <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center mb-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 leading-tight mb-2">{doc.originalName}</h3>
          <span className={`pill ${s.cls}`}>{s.label}</span>
        </div>

        <hr className="divider mb-4" />

        {/* Metadata */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Pages</span>
            <span className="text-xs font-medium text-gray-900">{doc.pageCount || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Chunks</span>
            <span className="text-xs font-medium text-gray-900">{doc.chunkCount || "—"}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Size</span>
            <span className="text-xs font-medium text-gray-900">
              {doc.sizeBytes ? `${(doc.sizeBytes / (1024 * 1024)).toFixed(1)} MB` : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Uploaded</span>
            <span className="text-xs font-medium text-gray-900">
              {new Date(doc.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <hr className="divider mb-4" />

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => openPdf()}
            className="btn-secondary w-full justify-center text-xs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>
            View PDF
          </button>
          <button
            onClick={onSummarize}
            disabled={summaryLoading || doc.embeddingStatus !== "ready"}
            className="btn-secondary w-full justify-center text-xs"
          >
            {summaryLoading ? (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/>
                <line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>
              </svg>
            )}
            {summaryLoading ? "Summarizing…" : "Summarize"}
          </button>
        </div>

        {/* Summary */}
        {summary && (
          <>
            <hr className="divider my-4" />
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">Summary</p>
              <p className="text-xs text-gray-500 leading-relaxed">{summary}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function DocumentChat() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [history, setHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [summary, setSummary] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    loadDoc();
    loadHistory();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function loadDoc() {
    try {
      const res = await api.get(`/documents/${id}`);
      setDoc(res.data.document);
      // Store in recent
      const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
      const filtered = recent.filter((r) => r.id !== id);
      filtered.unshift({ id, name: res.data.document.originalName });
      localStorage.setItem("dm_recent", JSON.stringify(filtered.slice(0, 5)));
    } catch {}
  }

  async function loadHistory() {
    try {
      const res = await api.get(`/documents/${id}/chat-history`);
      setHistory(res.data.history);
    } catch {}
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
      setError(err.response?.data?.message || "Failed to get an answer.");
      setQuestion(q);
    } finally {
      setAsking(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }

  async function handleSummarize() {
    setSummaryLoading(true);
    try {
      const res = await api.get(`/documents/${id}/summary`);
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handlePageJump(pageNumber) {
    if (!pageNumber) return;
    try {
      const res = await api.get(`/documents/${id}/file`, { responseType: "blob" });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      window.open(`${url}#page=${pageNumber}`, "_blank");
    } catch {}
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
      </div>
    );
  }

  const notReady = doc.embeddingStatus !== "ready";
  const failed = doc.embeddingStatus === "failed";

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
          <Link to="/" className="btn-ghost p-1.5 text-gray-500">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-semibold text-gray-900 truncate">{doc.originalName}</h1>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 bg-[#f7f7f5]">
          {history.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-20">
              {failed ? (
                <>
                  <div className="w-12 h-12 bg-red-50 border border-red-200 rounded-2xl flex items-center justify-center mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Indexing failed</p>
                  <p className="text-xs text-gray-500 max-w-xs">{doc.summary || "This PDF's text couldn't be extracted. Try a text-based PDF."}</p>
                </>
              ) : notReady ? (
                <>
                  <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mb-3" />
                  <p className="text-sm text-gray-500">Indexing your document…</p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-900 mb-1">Ask anything about this document</p>
                  <p className="text-xs text-gray-400">Answers are grounded in the document's content</p>

                  {/* Suggested questions */}
                  <div className="flex flex-wrap gap-2 justify-center mt-4 max-w-sm">
                    {["Summarize this document", "What are the key findings?", "What is the main topic?"].map((q) => (
                      <button
                        key={q}
                        onClick={() => setQuestion(q)}
                        className="text-xs px-3 py-1.5 bg-white border border-gray-200 rounded-full text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {history.map((msg, i) => (
            <ChatMessage key={i} msg={msg} onPageJump={handlePageJump} />
          ))}

          {asking && (
            <div className="flex gap-3 items-start fade-in">
              <div className="w-6 h-6 bg-gray-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
              </div>
              <div className="bubble-ai">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600 flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-200 bg-white flex-shrink-0">
          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={notReady ? "Waiting for indexing to complete…" : "Ask a question…"}
              disabled={notReady || asking}
              className="input flex-1"
              autoFocus
            />
            <button
              type="submit"
              disabled={notReady || asking || !question.trim()}
              className="btn-primary px-4 flex-shrink-0"
            >
              {asking ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </form>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Answers are grounded in document content · Sources cited inline
          </p>
        </div>
      </div>

      {/* Right info panel */}
      <DocInfoPanel
        doc={doc}
        onSummarize={handleSummarize}
        summary={summary}
        summaryLoading={summaryLoading}
      />
    </div>
  );
}
