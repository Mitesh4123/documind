import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHAT_MODEL = "gpt-4o-mini";

/**
 * Builds a grounded prompt and asks the model to answer using only the provided chunks.
 * Instructs the model to cite chunk numbers so the frontend can map them back to
 * approximate source locations in the document.
 */
export async function askWithContext(question, chunks) {
  // Include document name in context header when chunks come from multiple docs
  const isMultiDoc = chunks.some((c) => c.documentName);

  const context = chunks
    .map((c, i) => {
      const header = isMultiDoc && c.documentName
        ? `[Chunk ${i + 1} — from "${c.documentName}"]`
        : `[Chunk ${i + 1}]`;
      return `${header}\n${c.text}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt = isMultiDoc
    ? `You are a helpful assistant answering questions across multiple documents.
Use ONLY the context provided. If the answer isn't in the context, say you don't know — do not make anything up.
When you use information from a chunk, cite it like [Chunk N] and mention the document name right after the relevant sentence.`
    : `You are a helpful assistant answering questions about a document.
Use ONLY the context provided. If the answer isn't in the context, say you don't know — do not make anything up.
When you use information from a chunk, cite it like [Chunk N] right after the relevant sentence.`;

  const userPrompt = `CONTEXT:
${context}

QUESTION:
${question}

ANSWER:`;

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
  });

  const answerText = response.choices[0].message.content;

  return {
    answer: answerText,
    sourceChunks: chunks.map((c, i) => ({
      label: `Chunk ${i + 1}`,
      chunkIndex: c.chunkIndex,
      pageNumber: c.pageNumber || 0,
      documentId: c.documentId || null,
      documentName: c.documentName || null,
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
  // Cap input defensively to stay within context window and keep cost low
  const truncated = fullText.slice(0, 50000);

  const response = await openai.chat.completions.create({
    model: CHAT_MODEL,
    messages: [
      {
        role: "user",
        content: `Summarize the following document in 4-6 concise sentences, capturing its main points and purpose:\n\n${truncated}`,
      },
    ],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}
