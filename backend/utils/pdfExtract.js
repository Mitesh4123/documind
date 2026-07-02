import fs from "fs";
import pdfParse from "pdf-parse";

export async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const result = await pdfParse(dataBuffer);

  const { text, numpages } = result;

  const words = text.split(/\s+/).filter(Boolean);
  const wordsPerPage = Math.max(1, Math.ceil(words.length / numpages));

  const pages = Array.from({ length: numpages }, (_, i) =>
    words.slice(i * wordsPerPage, (i + 1) * wordsPerPage).join(" ")
  );

  return { text, pageCount: numpages, pages };
}