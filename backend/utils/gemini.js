import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

/**
 * Builds a grounded prompt and asks Gemini to answer using only the provided chunks.
 * Instructs the model to cite chunk numbers so the frontend can map them back to
 * approximate source locations in the document.
 */
export async function askWithContext(question, chunks) {
  const context = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
    .join("\n\n---\n\n");

  const prompt = `You are a helpful assistant answering questions about a document.
Use ONLY the context below to answer. If the answer isn't in the context, say you don't know — do not make anything up.
When you use information from a chunk, cite it like [Chunk N] right after the relevant sentence.

CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;

  const result = await model.generateContent(prompt);
  const answerText = result.response.text();

  return {
    answer: answerText,
    sourceChunks: chunks.map((c, i) => ({
      label: `Chunk ${i + 1}`,
      chunkIndex: c.chunkIndex,
      text: c.text,
      score: c.score,
    })),
  };
}

/**
 * Generates a concise summary of a full document's text.
 * Used for the "auto-summary" feature shown on the document page.
 */
export async function summarizeDocument(fullText) {
  // Gemini 2.0 Flash has a large context window, but cap input defensively
  const truncated = fullText.slice(0, 100000);

  const prompt = `Summarize the following document in 4-6 concise sentences, capturing its main points and purpose:\n\n${truncated}`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
