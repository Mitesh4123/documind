import { useState, useRef } from "react";
import api from "../api/client.js";

export default function UploadBox({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    setError("");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="border border-dashed border-gray-700 rounded-xl p-8 text-center bg-gray-900">
      <p className="text-gray-300 mb-3">Upload a PDF to get started</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={uploading}
        className="text-sm text-gray-400"
      />
      {uploading && <p className="text-indigo-400 text-sm mt-2">Uploading & extracting text...</p>}
      {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
    </div>
  );
}
