import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import UploadBox from "../components/UploadBox.jsx";
import DocumentList from "../components/DocumentList.jsx";
import React from "react";
import MultiDocSearch from "../components/MultiDocSearch.jsx";

export default function Dashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await api.get("/documents");
      setDocuments(res.data.documents);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    const hasPending = documents.some(
      (d) => d.status === "processing" || ["pending", "processing"].includes(d.embeddingStatus)
    );
    if (!hasPending) return;
    const interval = setInterval(fetchDocuments, 4000);
    return () => clearInterval(interval);
  }, [documents, fetchDocuments]);

  async function handleDelete(id) {
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((d) => d._id !== id));
    } catch (err) {
      console.error("Delete failed", err);
    }
  }

  function handleLogout() {
    localStorage.removeItem("documind_token");
    navigate("/login");
  }

  const readyCount = documents.filter((d) => d.embeddingStatus === "ready").length;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-xs font-bold">D</div>
            <span className="font-semibold text-white">DocuMind</span>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Upload section */}
        <section className="mb-8">
          <h1 className="text-xl font-semibold text-white mb-1">Your documents</h1>
          <p className="text-sm text-gray-500 mb-5">
            Upload a PDF to extract its content and chat with it.
          </p>
          <UploadBox onUploaded={fetchDocuments} />
        </section>

        {/* Documents */}
        {loading ? (
          <DocumentSkeleton />
        ) : (
          <>
            <DocumentList documents={documents} onDelete={handleDelete} />
            {readyCount >= 1 && <MultiDocSearch />}
          </>
        )}
      </main>
    </div>
  );
}

function DocumentSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2].map((i) => (
        <div key={i} className="h-20 bg-gray-900 rounded-xl border border-gray-800" />
      ))}
    </div>
  );
}
