import fs from "fs";
import pdfParse from "pdf-parse";

/**
 * Extracts text from a PDF, both as one combined string and as an array of
 * per-page text. Per-page text is what lets us tag each chunk with its
 * source page number later, which powers the "jump to page" citation feature.
 */
export async function extractTextFromPdf(filePath) {
  const dataBuffer = fs.readFileSync(filePath);
  const pages = [];

  // pdf-parse calls this once per page during parsing; we capture each
  // page's text instead of letting it just concatenate everything.
  const options = {
    pagerender: async (pageData) => {
      const textContent = await pageData.getTextContent();
      const pageText = textContent.items.map((item) => item.str).join(" ");
      pages.push(pageText);
      return pageText;
    },
  };

  const result = await pdfParse(dataBuffer, options);

  return {
    text: result.text,
    pageCount: result.numpages,
    pages, // array of strings, index 0 = page 1
  };
}
