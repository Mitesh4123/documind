import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api/client.js";

export default function DocumentChat() {
  const { id } = useParams();
  const navigate = useNavigate();

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

  if (!document) {
    return <p className="text-gray-500 text-center mt-20">Loading...</p>;
  }

  const notReady = document.embeddingStatus !== "ready";

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 flex flex-col min-h-screen">
      <div className="flex items-center justify-between mb-4">
        <Link to="/" className="text-gray-400 hover:text-gray-200 text-sm">
          ← Back
        </Link>
        <button
          onClick={handleSummarize}
          disabled={summaryLoading || notReady}
          className="text-sm bg-gray-800 hover:bg-gray-700 disabled:opacity-50 px-3 py-1.5 rounded"
        >
          {summaryLoading ? "Summarizing..." : "Summarize"}
        </button>
      </div>

      <h1 className="text-xl font-semibold mb-1">{document.originalName}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {document.pageCount} pages · {document.chunkCount || 0} chunks ·{" "}
        <span className={notReady ? "text-yellow-400" : "text-green-400"}>
          {notReady ? `Preparing (${document.embeddingStatus})...` : "Ready to chat"}
        </span>
      </p>

      {summary && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-400 mb-1">Summary</p>
          <p className="text-sm">{summary}</p>
        </div>
      )}

      <div className="flex-1 space-y-4 mb-4">
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
                      <div key={j} className="text-xs text-gray-400 bg-gray-800 rounded p-2">
                        <span className="text-gray-500">{c.label}</span> — {c.text.slice(0, 200)}
                        {c.text.length > 200 ? "..." : ""}
                      </div>
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

      <form onSubmit={handleAsk} className="flex gap-2 sticky bottom-4">
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
  );
}
