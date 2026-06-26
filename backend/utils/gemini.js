import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const CHAT_MODEL = "gpt-4o-mini";

export async function askWithContext(question, chunks) {
  const context = chunks
    .map((c, i) => `[Chunk ${i + 1}]\n${c.text}`)
    .join("\n\n---\n\n");

  const systemPrompt = `You are a helpful assistant answering questions about a document.
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
      text: c.text,
      score: c.score,
    })),
  };
}

export async function summarizeDocument(fullText) {
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