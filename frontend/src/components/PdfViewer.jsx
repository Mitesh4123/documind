import { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import api from "../api/client.js";
import React from "react";

// react-pdf needs a worker script; load it from a CDN matching the installed version
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

/**
 * Renders a PDF fetched from our authenticated /file endpoint.
 * Exposes a `jumpToPage` ref method so the parent (chat page) can scroll
 * to a specific page when a citation is clicked.
 */
export default function PdfViewer({ documentId, jumpToPageSignal }) {
  const [fileUrl, setFileUrl] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [error, setError] = useState("");
  const pageRefs = useRef({});

  useEffect(() => {
    let objectUrl;

    async function loadFile() {
      try {
        const res = await api.get(`/documents/${documentId}/file`, {
          responseType: "blob",
        });
        objectUrl = URL.createObjectURL(res.data);
        setFileUrl(objectUrl);
      } catch (err) {
        setError("Failed to load PDF file");
        console.error(err);
      }
    }

    loadFile();

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  // When the parent signals a new page to jump to, scroll it into view
  useEffect(() => {
    if (!jumpToPageSignal || !jumpToPageSignal.page) return;
    const target = pageRefs.current[jumpToPageSignal.page];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [jumpToPageSignal]);

  if (error) {
    return <p className="text-red-400 text-sm p-4">{error}</p>;
  }

  if (!fileUrl) {
    return <p className="text-gray-500 text-sm p-4">Loading PDF...</p>;
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-950 rounded-lg border border-gray-800">
      <Document
        file={fileUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={(err) => setError("Failed to render PDF: " + err.message)}
        loading={<p className="text-gray-500 text-sm p-4">Rendering...</p>}
      >
        {numPages &&
          Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
            <div
              key={pageNum}
              ref={(el) => (pageRefs.current[pageNum] = el)}
              className="border-b border-gray-800 p-2"
            >
              <p className="text-xs text-gray-600 mb-1">Page {pageNum}</p>
              <Page
                pageNumber={pageNum}
                width={380}
                renderAnnotationLayer={false}
                renderTextLayer={true}
              />
            </div>
          ))}
      </Document>
    </div>
  );
}
