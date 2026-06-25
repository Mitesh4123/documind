import fs from "fs";
import pdfParse from "pdf-parse";

/**
 * Extracts raw text and page count from a PDF file on disk.
 * In Phase 2 this text will get chunked and embedded for the RAG pipeline.
 */
export async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(dataBuffer);

  return {
    text: result.text,
    pageCount: result.numpages,
  };
}
