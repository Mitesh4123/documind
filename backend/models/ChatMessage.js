import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
  {
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    sourceChunks: [
      {
        label: String,
        chunkIndex: Number,
        text: String,
        score: Number,
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("ChatMessage", chatMessageSchema);
