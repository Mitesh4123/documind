/**
 * Splits raw text into overlapping chunks suitable for embedding.
 * Chunking by words (not tokens) for simplicity — close enough for English text
 * where ~1 word ≈ 1.3 tokens.
 *
 * @param {string} text - Full extracted text from the document
 * @param {number} chunkSize - Target words per chunk (default ~350 words ≈ 450 tokens)
 * @param {number} overlap - Words of overlap between consecutive chunks, to preserve context across boundaries
 */
export function chunkText(text, chunkSize = 350, overlap = 50) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];

  if (words.length === 0) return chunks;

  let start = 0;
  let chunkIndex = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const chunkWords = words.slice(start, end);

    chunks.push({
      index: chunkIndex,
      text: chunkWords.join(" "),
    });

    chunkIndex += 1;

    if (end === words.length) break;
    start = end - overlap; // step back by overlap so context carries over
  }

  return chunks;
}
