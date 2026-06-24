import { Link } from "react-router-dom";

const statusStyles = {
  uploaded: "bg-gray-700 text-gray-200",
  processing: "bg-yellow-700 text-yellow-200",
  ready: "bg-green-700 text-green-200",
  failed: "bg-red-700 text-red-200",
};

const embeddingStatusLabel = {
  pending: "Preparing chat...",
  processing: "Preparing chat...",
  ready: "Chat ready",
  failed: "Chat setup failed",
};

function formatSize(bytes) {
  if (!bytes) return "—";
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
}

export default function DocumentList({ documents, onDelete }) {
  if (documents.length === 0) {
    return <p className="text-gray-500 text-center mt-8">No documents yet. Upload one above.</p>;
  }

  return (
    <div className="space-y-3 mt-6">
      {documents.map((doc) => (
        <div
          key={doc._id}
          className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg p-4"
        >
          <Link to={`/document/${doc._id}`} className="flex-1 hover:opacity-80">
            <p className="font-medium">{doc.originalName}</p>
            <p className="text-sm text-gray-500">
              {doc.pageCount} pages · {formatSize(doc.sizeBytes)} ·{" "}
              {new Date(doc.createdAt).toLocaleDateString()}
              {doc.embeddingStatus && (
                <span className="text-indigo-400"> · {embeddingStatusLabel[doc.embeddingStatus]}</span>
              )}
            </p>
          </Link>

          <div className="flex items-center gap-3">
            <span className={`text-xs px-2 py-1 rounded-full ${statusStyles[doc.status]}`}>
              {doc.status}
            </span>
            <button
              onClick={() => onDelete(doc._id)}
              className="text-sm text-red-400 hover:text-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
