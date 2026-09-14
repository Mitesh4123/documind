import React, { useState, useRef } from "react";
import api from "../api/client.js";

export default function UploadBox({ onUploaded }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRef = useRef(null);

  async function upload(file) {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("File size must be under 20 MB.");
      return;
    }

    setError("");
    setSuccess(false);
    setUploading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    try {
      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); }}
        onDrop={(e) => { e.preventDefault(); setDragging(false); upload(e.dataTransfer.files[0]); }}
        className={`
          relative border-2 border-dashed rounded-xl px-6 py-8 text-center transition-all duration-150 overflow-hidden
          ${dragging
            ? "border-indigo-400 bg-indigo-50 scale-[1.01]"
            : uploading
            ? "border-gray-200 bg-gray-50 cursor-default"
            : success
            ? "border-green-300 bg-green-50 cursor-pointer"
            : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 cursor-pointer"
          }
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={(e) => upload(e.target.files[0])}
          disabled={uploading}
          className="hidden"
        />

        {/* Progress bar */}
        {uploading && progress > 0 && (
          <div className="absolute bottom-0 left-0 h-0.5 bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        )}

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="relative w-10 h-10">
              <div className="w-10 h-10 border-2 border-gray-200 rounded-full" />
              <div className="absolute inset-0 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Uploading{progress > 0 ? ` ${progress}%` : "…"}</p>
              <p className="text-xs text-gray-400 mt-0.5">Extracting text from PDF</p>
            </div>
          </div>
        ) : success ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-green-700">Upload successful!</p>
            <p className="text-xs text-green-600">Your document is being indexed…</p>
          </div>
        ) : dragging ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p className="text-sm font-medium text-indigo-700">Drop to upload</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop a PDF here, or{" "}
                <span className="text-indigo-600">browse</span>
              </p>
              <p className="text-xs text-gray-400 mt-0.5">PDF files only · Max 20 MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
