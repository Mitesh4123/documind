import { Link } from "react-router-dom";
import React from "react";

const embeddingBadge = {
  pending:    { label: "Indexing...",   cls: "text-yellow-400 bg-yellow-400/10" },
  processing: { label: "Indexing...",   cls: "text-yellow-400 bg-yellow-400/10" },
  ready:      { label: "Chat ready",    cls: "text-emerald-400 bg-emerald-400/10" },
  failed:     { label: "Setup failed",  cls: "text-red-400 bg-red-400/10" },
};

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

function PdfIcon() {
  return (
    <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-indigo-400">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    </div>
  );
}

export default function DocumentList({ documents, onDelete }) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-16 px-4">
        <div className="w-14 h-14 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-500">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <p className="text-gray-400 font-medium">No documents yet</p>
        <p className="text-gray-600 text-sm mt-1">Upload a PDF above to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mb-6">
      {documents.map((doc) => {
        const badge = embeddingBadge[doc.embeddingStatus] || embeddingBadge.pending;
        const isReady = doc.embeddingStatus === "ready";

        return (
          <div
            key={doc._id}
            className="group flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all duration-200"
          >
            <PdfIcon />

            <Link to={`/document/${doc._id}`} className="flex-1 min-w-0">
              <p className="font-medium text-white truncate group-hover:text-indigo-300 transition-colors">
                {doc.originalName}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {doc.pageCount > 0 && `${doc.pageCount} pages · `}
                {formatSize(doc.sizeBytes)}
                {doc.chunkCount > 0 && ` · ${doc.chunkCount} chunks`}
                {" · "}
                {new Date(doc.createdAt).toLocaleDateString()}
              </p>
            </Link>

            <div className="flex items-center gap-3 flex-shrink-0">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${badge.cls}`}>
                {badge.label}
              </span>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(doc._id); }}
                className="text-gray-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete document"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4h6v2"/>
                </svg>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
