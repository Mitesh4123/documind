import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../api/client.js";
import UploadBox from "../components/UploadBox.jsx";
import { useToast } from "../components/Toast.jsx";

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusPill({ status }) {
  const map = {
    ready:      { label: "Ready",    cls: "pill-ready" },
    processing: { label: "Indexing", cls: "pill-processing" },
    pending:    { label: "Pending",  cls: "pill-pending" },
    failed:     { label: "Failed",   cls: "pill-failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`pill ${s.cls}`}>
      {status === "processing" && (
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse inline-block" />
      )}
      {s.label}
    </span>
  );
}

function DocumentCard({ doc, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    if (showMenu) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);

  function trackRecent() {
    const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
    const filtered = recent.filter((r) => r.id !== doc._id);
    filtered.unshift({ id: doc._id, name: doc.originalName });
    localStorage.setItem("dm_recent", JSON.stringify(filtered.slice(0, 5)));
  }

  const isReady = doc.embeddingStatus === "ready";

  return (
    <div className="card card-hover group relative fade-in flex flex-col">
      <Link to={`/document/${doc._id}`} onClick={trackRecent} className="block p-4 flex-1 no-underline">
        {/* File icon area */}
        <div className="flex items-start justify-between mb-3">
          <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={isReady ? "#6366f1" : "#9ca3af"} strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <StatusPill status={doc.embeddingStatus || "pending"} />
        </div>

        {/* Name */}
        <h3 className="text-sm font-semibold text-gray-900 leading-snug mb-1.5 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {doc.originalName}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
          {doc.pageCount > 0 && <span>{doc.pageCount} pages</span>}
          {doc.pageCount > 0 && <span>·</span>}
          <span>{formatSize(doc.sizeBytes)}</span>
          {doc.chunkCount > 0 && <><span>·</span><span>{doc.chunkCount} chunks</span></>}
        </div>
      </Link>

      {/* Footer */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
        <div className="flex items-center gap-1">
          {isReady && (
            <span className="text-xs text-indigo-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Open →
            </span>
          )}
        </div>
      </div>

      {/* 3-dot menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowMenu(!showMenu); }}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
            <div className="absolute right-0 top-7 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
              <Link
                to={`/document/${doc._id}`}
                onClick={() => { trackRecent(); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 no-underline"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                Open
              </Link>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { onDelete(doc._id); setShowMenu(false); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="skeleton h-5 w-14 rounded-full" />
      </div>
      <div className="skeleton h-4 w-3/4 mb-1.5" />
      <div className="skeleton h-3 w-1/2 mb-4" />
      <div className="skeleton h-3 w-16" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">No documents yet</h3>
      <p className="text-sm text-gray-400 max-w-xs">
        Upload a PDF above to get started. You can then chat with it, generate summaries, and search across multiple documents.
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(() => localStorage.getItem("dm_view") || "grid");
  const { toast } = useToast();

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents);
    } catch {
      toast("Failed to load documents", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  useEffect(() => {
    const hasPending = documents.some(
      (d) => ["pending", "processing"].includes(d.embeddingStatus) || d.status === "processing"
    );
    if (!hasPending) return;
    const id = setInterval(fetchDocuments, 4000);
    return () => clearInterval(id);
  }, [documents, fetchDocuments]);

  function toggleView(v) {
    setView(v);
    localStorage.setItem("dm_view", v);
  }

  async function handleDelete(id) {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
      localStorage.setItem("dm_recent", JSON.stringify(recent.filter((r) => r.id !== id)));
      toast("Document deleted", "info");
    } catch {
      toast("Failed to delete document", "error");
    }
  }

  const readyCount = documents.filter((d) => d.embeddingStatus === "ready").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-title">Documents</h1>
          <p className="text-small mt-0.5">
            {loading
              ? "Loading…"
              : `${documents.length} document${documents.length !== 1 ? "s" : ""}${readyCount > 0 ? ` · ${readyCount} ready to chat` : ""}`
            }
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-md p-0.5 gap-0.5">
          <button
            onClick={() => toggleView("grid")}
            title="Grid view"
            className={`p-1.5 rounded transition-all ${view === "grid" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
            </svg>
          </button>
          <button
            onClick={() => toggleView("list")}
            title="List view"
            className={`p-1.5 rounded transition-all ${view === "list" ? "bg-white shadow-sm text-gray-700" : "text-gray-400 hover:text-gray-600"}`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Upload */}
      <div className="mb-8">
        <UploadBox onUploaded={() => { fetchDocuments(); toast("Document uploaded — indexing started", "success"); }} />
      </div>

      {/* Documents */}
      {loading ? (
        <div className={view === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-2"}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : documents.length === 0 ? (
        <div className="grid grid-cols-1"><EmptyState /></div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {documents.map((doc) => (
            <ListRow key={doc._id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function ListRow({ doc, onDelete }) {
  function trackRecent() {
    const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
    const filtered = recent.filter((r) => r.id !== doc._id);
    filtered.unshift({ id: doc._id, name: doc.originalName });
    localStorage.setItem("dm_recent", JSON.stringify(filtered.slice(0, 5)));
  }

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 group transition-colors">
      <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <Link
        to={`/document/${doc._id}`}
        onClick={trackRecent}
        className="flex-1 min-w-0 no-underline"
      >
        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
          {doc.originalName}
        </p>
        <p className="text-xs text-gray-400">
          {doc.pageCount > 0 && `${doc.pageCount} pages · `}
          {formatSize(doc.sizeBytes)}
          {doc.chunkCount > 0 && ` · ${doc.chunkCount} chunks`}
        </p>
      </Link>
      <StatusPill status={doc.embeddingStatus || "pending"} />
      <span className="text-xs text-gray-400 w-16 text-right flex-shrink-0">{formatDate(doc.createdAt)}</span>
      <button
        onClick={() => onDelete(doc._id)}
        className="btn-ghost p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6M14 11v6"/>
        </svg>
      </button>
    </div>
  );
}
