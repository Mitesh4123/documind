import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    originalName: { type: String, required: true },
    storedFileName: { type: String, required: true },
    filePath: { type: String, required: true },
    mimeType: { type: String },
    sizeBytes: { type: Number },
    pageCount: { type: Number, default: 0 },
    extractedText: { type: String, default: "" }, // full text, used for summaries
    pages: { type: [String], default: [] }, // per-page text, index 0 = page 1; used for page-aware chunking
    status: {
      type: String,
      enum: ["uploaded", "processing", "ready", "failed"],
      default: "uploaded",
    },
    chunkCount: { type: Number, default: 0 },
    embeddingStatus: {
      type: String,
      enum: ["pending", "processing", "ready", "failed"],
      default: "pending",
    },
    summary: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Document", documentSchema);
