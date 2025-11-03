import mammoth from "mammoth";
import { getDocumentProxy, extractText } from "unpdf";

export async function parseFile(
  file: File
): Promise<{ text: string; fileName: string; fileType: string }> {
  const fileName = file.name;
  const fileType = file.name.split(".").pop()?.toLowerCase() || "";

  let text = "";

  if (fileType === "pdf") {
    text = await parsePDF(file);
  } else if (fileType === "docx" || fileType === "doc") {
    text = await parseDOCX(file);
  } else if (fileType === "txt") {
    text = await parseTXT(file);
  } else {
    throw new Error(`Unsupported file type: ${fileType}`);
  }

  // Sanitize text to remove null bytes and invalid UTF-8 characters
  text = sanitizeText(text);

  return { text, fileName, fileType };
}

async function parsePDF(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(arrayBuffer));
    const { text } = await extractText(pdf, { mergePages: true });
    return text.trim();
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error}`);
  }
}

async function parseDOCX(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ buffer: Buffer.from(arrayBuffer) });
    return result.value.trim();
  } catch (error) {
    throw new Error(`Failed to parse DOCX: ${error}`);
  }
}

async function parseTXT(file: File): Promise<string> {
  try {
    const text = await file.text();
    return text.trim();
  } catch (error) {
    throw new Error(`Failed to parse TXT: ${error}`);
  }
}

function sanitizeText(text: string): string {
  // Remove null bytes and other invalid UTF-8 characters
  return text
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters except tab and newline
    .trim();
}
