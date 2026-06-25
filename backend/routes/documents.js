import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Document from "../models/Document.js";
import ChatMessage from "../models/ChatMessage.js";
import authMiddleware from "../middleware/auth.js";
import { extractTextFromPdf } from "../utils/pdfExtract.js";
import { chunkText } from "../utils/chunkText.js";
import { embedText, embedTextBatch } from "../utils/embeddings.js";
import { upsertChunks, queryChunks, deleteDocumentVectors } from "../utils/pinecone.js";
import { askWithContext, summarizeDocument } from "../utils/gemini.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, "..", "uploads");

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname.replace(/\s+/g, "_")}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB cap
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Only PDF files are supported in Phase 1"));
  },
});

const router = express.Router();

/**
 * Runs in the background after upload: chunks the extracted text,
 * embeds each chunk via OpenAI, and stores the vectors in Pinecone.
 * Not awaited by the upload route so the user gets a fast response;
 * the frontend polls document status to know when it's ready to chat.
 */
async function processEmbeddings(doc) {
  try {
    doc.embeddingStatus = "processing";
    await doc.save();

    const chunks = chunkText(doc.extractedText);

    if (chunks.length === 0) {
      doc.embeddingStatus = "failed";
      await doc.save();
      return;
    }

    const embeddings = await embedTextBatch(chunks.map((c) => c.text));
    await upsertChunks(doc._id.toString(), chunks, embeddings);

    doc.chunkCount = chunks.length;
    doc.embeddingStatus = "ready";
    await doc.save();
  } catch (err) {
    console.error("Embedding pipeline failed for doc", doc._id.toString(), err.message);
    doc.embeddingStatus = "failed";
    await doc.save();
  }
}

// All document routes require auth
router.use(authMiddleware);

// Upload a document
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const doc = await Document.create({
      owner: req.userId,
      originalName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      status: "processing",
    });

    // Extract text synchronously so we know page count before responding
    try {
      const { text, pageCount } = await extractTextFromPdf(req.file.path);
      doc.extractedText = text;
      doc.pageCount = pageCount;
      doc.status = "ready";
      await doc.save();

      // Kick off chunking + embedding in the background — don't block the response
      processEmbeddings(doc);
    } catch (extractErr) {
      doc.status = "failed";
      await doc.save();
      console.error("PDF extraction failed:", extractErr.message);
    }

    res.status(201).json({
      message: "Document uploaded",
      document: {
        id: doc._id,
        originalName: doc.originalName,
        pageCount: doc.pageCount,
        status: doc.status,
        embeddingStatus: doc.embeddingStatus,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});

// List all documents for the logged-in user
router.get("/", async (req, res) => {
  try {
    const docs = await Document.find({ owner: req.userId })
      .select("originalName pageCount status embeddingStatus createdAt sizeBytes chunkCount")
      .sort({ createdAt: -1 });

    res.json({ documents: docs });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get a single document (includes extracted text — useful for Phase 2 testing)
router.get("/:id", async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });
    res.json({ document: doc });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Ask a question about a document (RAG: embed question -> retrieve chunks -> Gemini answers)
router.post("/:id/ask", async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: "Question is required" });
    }

    const doc = await Document.findOne({ _id: req.params.id, owner: req.userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.embeddingStatus !== "ready") {
      return res.status(409).json({
        message: `Document isn't ready for questions yet (status: ${doc.embeddingStatus})`,
      });
    }

    const questionEmbedding = await embedText(question);
    const topChunks = await queryChunks(doc._id.toString(), questionEmbedding, 5);

    if (topChunks.length === 0) {
      return res.status(404).json({ message: "No relevant content found in this document" });
    }

    const { answer, sourceChunks } = await askWithContext(question, topChunks);

    const chatMessage = await ChatMessage.create({
      document: doc._id,
      owner: req.userId,
      question,
      answer,
      sourceChunks,
    });

    res.json({
      answer,
      sourceChunks,
      messageId: chatMessage._id,
    });
  } catch (err) {
    console.error("Ask failed:", err.message);
    res.status(500).json({ message: "Failed to answer question", error: err.message });
  }
});

// Get chat history for a document
router.get("/:id/chat-history", async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const history = await ChatMessage.find({ document: doc._id, owner: req.userId })
      .sort({ createdAt: 1 })
      .select("question answer sourceChunks createdAt");

    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get or generate a document summary
router.get("/:id/summary", async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (doc.summary) {
      return res.json({ summary: doc.summary, cached: true });
    }

    if (!doc.extractedText) {
      return res.status(409).json({ message: "Document text not extracted yet" });
    }

    const summary = await summarizeDocument(doc.extractedText);
    doc.summary = summary;
    await doc.save();

    res.json({ summary, cached: false });
  } catch (err) {
    console.error("Summary generation failed:", err.message);
    res.status(500).json({ message: "Failed to generate summary", error: err.message });
  }
});

// Delete a document
router.delete("/:id", async (req, res) => {
  try {
    const doc = await Document.findOne({ _id: req.params.id, owner: req.userId });
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (fs.existsSync(doc.filePath)) fs.unlinkSync(doc.filePath);

    // Clean up vectors and chat history so nothing orphaned is left behind
    try {
      await deleteDocumentVectors(doc._id.toString());
    } catch (vectorErr) {
      console.error("Vector cleanup failed:", vectorErr.message);
    }
    await ChatMessage.deleteMany({ document: doc._id });

    await doc.deleteOne();

    res.json({ message: "Document deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
