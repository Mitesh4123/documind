import React, { useEffect, useState, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client.js";

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
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusPill({ status }) {
  const map = {
    ready: { label: "Ready", cls: "pill-ready" },
    processing: { label: "Indexing", cls: "pill-processing" },
    pending: { label: "Pending", cls: "pill-pending" },
    failed: { label: "Failed", cls: "pill-failed" },
  };
  const s = map[status] || map.pending;
  return (
    <span className={`pill ${s.cls}`}>
      {status === "processing" && (
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
      )}
      {s.label}
    </span>
  );
}

function DocumentCard({ doc, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  const isReady = doc.embeddingStatus === "ready";

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Track recent docs in localStorage
  function handleOpen() {
    const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
    const filtered = recent.filter((r) => r.id !== doc._id);
    filtered.unshift({ id: doc._id, name: doc.originalName });
    localStorage.setItem("dm_recent", JSON.stringify(filtered.slice(0, 5)));
  }

  return (
    <div className="card card-hover group relative fade-in">
      {/* Top area */}
      <Link
        to={`/document/${doc._id}`}
        onClick={handleOpen}
        className="block p-4 no-underline"
      >
        {/* File icon */}
        <div className="w-10 h-10 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center mb-3">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>

        {/* Name */}
        <h3 className="text-sm font-medium text-gray-900 leading-tight mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {doc.originalName}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          {doc.pageCount > 0 && <span>{doc.pageCount}p</span>}
          {doc.pageCount > 0 && doc.sizeBytes && <span>·</span>}
          {doc.sizeBytes && <span>{formatSize(doc.sizeBytes)}</span>}
          {doc.chunkCount > 0 && <><span>·</span><span>{doc.chunkCount} chunks</span></>}
        </div>

        {/* Status + date row */}
        <div className="flex items-center justify-between">
          <StatusPill status={doc.embeddingStatus || "pending"} />
          <span className="text-xs text-gray-400">{formatDate(doc.createdAt)}</span>
        </div>
      </Link>

      {/* Actions menu */}
      <div className="absolute top-3 right-3" ref={menuRef}>
        <button
          onClick={(e) => { e.preventDefault(); setShowMenu(!showMenu); }}
          className="w-6 h-6 rounded flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-all"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/>
          </svg>
        </button>

        {showMenu && (
          <div className="absolute right-0 top-7 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-20">
            <Link
              to={`/document/${doc._id}`}
              onClick={handleOpen}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 no-underline"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
              </svg>
              Open
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => { onDelete(doc._id); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
              </svg>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="card p-4">
      <div className="skeleton w-10 h-10 rounded-lg mb-3" />
      <div className="skeleton h-4 w-3/4 mb-1" />
      <div className="skeleton h-3 w-1/2 mb-3" />
      <div className="skeleton h-5 w-16" />
    </div>
  );
}

function UploadZone({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    if (file.type !== "application/pdf") { setError("Only PDF files are supported."); return; }
    setError(""); setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await api.post("/documents/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
        className={`
          border-2 border-dashed rounded-lg px-6 py-8 text-center cursor-pointer transition-all duration-150
          ${dragging ? "border-indigo-400 bg-indigo-50" : uploading ? "border-gray-200 bg-gray-50 cursor-default" : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"}
        `}
      >
        <input ref={inputRef} type="file" accept="application/pdf" onChange={(e) => upload(e.target.files[0])} disabled={uploading} className="hidden" />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-gray-500">Uploading and extracting text…</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center mb-1">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                {dragging ? "Drop to upload" : "Drop a PDF here"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">or <span className="text-indigo-600 cursor-pointer">browse files</span> · PDF up to 20 MB</p>
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        {error}
      </p>}
    </div>
  );
}

function EmptyState({ onUploadClick }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
      </div>
      <h3 className="text-sm font-semibold text-gray-900 mb-1">No documents yet</h3>
      <p className="text-sm text-gray-500 mb-4 max-w-xs">Upload a PDF to get started. You can ask questions, generate summaries, and search across all your documents.</p>
    </div>
  );
}

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // grid | list

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  // Poll while any doc is still processing
  useEffect(() => {
    const hasPending = documents.some(
      (d) => ["pending", "processing"].includes(d.embeddingStatus) || d.status === "processing"
    );
    if (!hasPending) return;
    const id = setInterval(fetchDocuments, 4000);
    return () => clearInterval(id);
  }, [documents, fetchDocuments]);

  async function handleDelete(id) {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
      // Remove from recent
      const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
      localStorage.setItem("dm_recent", JSON.stringify(recent.filter((r) => r.id !== id)));
    } catch (err) {
      console.error(err);
    }
  }

  const readyCount = documents.filter((d) => d.embeddingStatus === "ready").length;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-title">Documents</h1>
          <p className="text-small mt-0.5">
            {loading ? "Loading…" : `${documents.length} document${documents.length !== 1 ? "s" : ""} · ${readyCount} ready`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-md p-0.5">
            <button
              onClick={() => setView("grid")}
              className={`p-1.5 rounded ${view === "grid" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="Grid view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button
              onClick={() => setView("list")}
              className={`p-1.5 rounded ${view === "list" ? "bg-white shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              title="List view"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Upload zone */}
      <div className="mb-8">
        <UploadZone onUploaded={fetchDocuments} />
      </div>

      {/* Documents */}
      {loading ? (
        <div className={view === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          : "space-y-2"
        }>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : documents.length === 0 ? (
        <EmptyState />
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard key={doc._id} doc={doc} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <ListView documents={documents} onDelete={handleDelete} />
      )}
    </div>
  );
}

function ListView({ documents, onDelete }) {
  return (
    <div className="card divide-y divide-gray-100">
      {documents.map((doc) => {
        const isReady = doc.embeddingStatus === "ready";
        return (
          <div key={doc._id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 group transition-colors">
            <div className="w-8 h-8 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <Link
              to={`/document/${doc._id}`}
              className="flex-1 min-w-0 no-underline"
              onClick={() => {
                const recent = JSON.parse(localStorage.getItem("dm_recent") || "[]");
                const filtered = recent.filter((r) => r.id !== doc._id);
                filtered.unshift({ id: doc._id, name: doc.originalName });
                localStorage.setItem("dm_recent", JSON.stringify(filtered.slice(0, 5)));
              }}
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
            <span className="text-xs text-gray-400 w-20 text-right">{formatDate(doc.createdAt)}</span>
            <button
              onClick={() => onDelete(doc._id)}
              className="btn-ghost p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
