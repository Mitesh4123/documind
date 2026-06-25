import { Pinecone } from "@pinecone-database/pinecone";

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
const index = pinecone.index(process.env.PINECONE_INDEX_NAME);

/**
 * Upserts a batch of chunk vectors for a document.
 * Each vector is namespaced by documentId so retrieval can be scoped per-document
 * and deletion is clean when a document is removed.
 */
export async function upsertChunks(documentId, chunks, embeddings) {
  const vectors = chunks.map((chunk, i) => ({
    id: `${documentId}-chunk-${chunk.index}`,
    values: embeddings[i],
    metadata: {
      documentId,
      chunkIndex: chunk.index,
      text: chunk.text,
    },
  }));

  // Pinecone recommends batches of ~100 vectors per upsert call
  const batchSize = 100;
  for (let i = 0; i < vectors.length; i += batchSize) {
    const batch = vectors.slice(i, i + batchSize);
    await index.namespace(documentId).upsert(batch);
  }
}

/**
 * Queries the index for the top-k most similar chunks to a given embedding,
 * scoped to a single document's namespace.
 */
export async function queryChunks(documentId, queryEmbedding, topK = 5) {
  const result = await index.namespace(documentId).query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
  });

  return result.matches.map((match) => ({
    text: match.metadata.text,
    chunkIndex: match.metadata.chunkIndex,
    score: match.score,
  }));
}

/**
 * Deletes all vectors belonging to a document (its entire namespace).
 * If the namespace never existed (e.g. embedding step failed before any
 * vectors were created), Pinecone returns a 404 — that's expected and fine,
 * so we swallow it instead of logging it as a real error.
 */
export async function deleteDocumentVectors(documentId) {
  try {
    await index.namespace(documentId).deleteAll();
  } catch (err) {
    const status = err?.status || err?.response?.status;
    if (status === 404) return; // namespace never existed, nothing to clean up
    throw err;
  }
}