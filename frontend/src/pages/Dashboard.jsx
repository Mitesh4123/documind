import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client.js";
import UploadBox from "../components/UploadBox.jsx";
import DocumentList from "../components/DocumentList.jsx";

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

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-semibold">DocuMind</h1>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-200">
          Log out
        </button>
      </div>

      <UploadBox onUploaded={fetchDocuments} />

      {loading ? (
        <p className="text-gray-500 text-center mt-8">Loading documents...</p>
      ) : (
        <DocumentList documents={documents} onDelete={handleDelete} />
      )}
    </div>
  );
}
