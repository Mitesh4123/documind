import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../api/client.js";


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

  useEffect(() => {
    loadDocument();
    loadHistory();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  async function loadDocument() {
    try {
      const res = await api.get(`/documents/${id}`);
      setDocument(res.data.document);
    } catch (err) {
      console.error("Failed to load document", err);
    }
  }

  async function loadHistory() {
    try {
      const res = await api.get(`/documents/${id}/chat-history`);
      setHistory(res.data.history);
    } catch (err) {
      console.error("Failed to load chat history", err);
    }
  }

  async function handleAsk(e) {
    e.preventDefault();
    if (!question.trim()) return;

    setError("");
    setAsking(true);
    const askedQuestion = question;
    setQuestion("");

    try {
      const res = await api.post(`/documents/${id}/ask`, { question: askedQuestion });
      setHistory((prev) => [
        ...prev,
        {
          question: askedQuestion,
          answer: res.data.answer,
          sourceChunks: res.data.sourceChunks,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to get an answer");
    } finally {
      setAsking(false);
    }
  }

  async function handleSummarize() {
    setSummaryLoading(true);
    try {
      const res = await api.get(`/documents/${id}/summary`);
      setSummary(res.data.summary);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate summary");
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
    setError("Failed to open PDF");
  }
}

  function handleCitationClick(pageNumber) {
  openPdf(pageNumber);
}

  if (!document) {
    return <p className="text-gray-500 text-center mt-20">Loading...</p>;
  }

  const notReady = document.embeddingStatus !== "ready";

  return (
    <div className="h-screen flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div>
          <Link to="/" className="text-gray-400 hover:text-gray-200 text-sm">
            ← Back
          </Link>
          <h1 className="text-lg font-semibold">{document.originalName}</h1>
          <p className="text-xs text-gray-500">
            {document.pageCount} pages · {document.chunkCount || 0} chunks ·{" "}
            <span className={notReady ? "text-yellow-400" : "text-green-400"}>
              {notReady ? `Preparing (${document.embeddingStatus})...` : "Ready to chat"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => openPdf()}
            className="text-sm bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded"
          >
            View PDF
          </button>
          <button
            onClick={handleSummarize}
            disabled={summaryLoading || notReady}
            className="text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded"
          >
            {summaryLoading ? "Summarizing..." : "Summarize"}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Chat column */}
        <div className="flex flex-col w-full max-w-3xl mx-auto px-4 py-4">
          {summary && (
            <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-400 mb-1">Summary</p>
              <p className="text-sm">{summary}</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-4 mb-4">
            {history.length === 0 && (
              <p className="text-gray-500 text-center mt-8">
                {notReady
                  ? "Document is still being processed — chat will be available shortly."
                  : "Ask a question about this document to get started."}
              </p>
            )}

            {history.map((msg, i) => (
              <div key={i} className="space-y-2">
                <div className="bg-indigo-900/40 rounded-lg p-3 ml-auto max-w-[80%] text-sm">
                  {msg.question}
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-3 max-w-[90%] text-sm">
                  <p className="whitespace-pre-wrap">{msg.answer}</p>
                  {msg.sourceChunks?.length > 0 && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer">
                        {msg.sourceChunks.length} source chunk(s)
                      </summary>
                      <div className="mt-2 space-y-2">
                        {msg.sourceChunks.map((c, j) => (
                          <button
                            key={j}
                            onClick={() => handleCitationClick(c.pageNumber)}
                            className="block w-full text-left text-xs text-gray-400 bg-gray-800 hover:bg-gray-700 rounded p-2 transition"
                          >
                            <span className="text-indigo-400 font-medium">
                              {c.label}
                              {c.pageNumber ? ` · Page ${c.pageNumber}` : ""}
                            </span>{" "}
                            — {c.text.slice(0, 200)}
                            {c.text.length > 200 ? "..." : ""}
                          </button>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}

          <form onSubmit={handleAsk} className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={notReady ? "Waiting for document to be ready..." : "Ask a question..."}
              disabled={notReady || asking}
              className="flex-1 p-3 rounded-lg bg-gray-800 border border-gray-700 outline-none focus:border-indigo-500 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={notReady || asking || !question.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-5 rounded-lg font-medium"
            >
              {asking ? "..." : "Ask"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
