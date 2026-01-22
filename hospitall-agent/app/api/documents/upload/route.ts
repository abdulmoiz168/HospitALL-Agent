import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import mammoth from "mammoth";
import { createWorker } from "tesseract.js";
import { mastra } from "@/mastra";
import { sanitizeText } from "@/mastra/guards/phi-guard";
import type { ReportOutput } from "@/mastra/schemas/report";

// Supported OCR languages: English, Urdu, Arabic
const SUPPORTED_LANGUAGES = ["eng", "urd", "ara"] as const;
type OcrLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Maximum pages to OCR for scanned PDFs
const MAX_OCR_PAGES = 10;

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

// Supported MIME types
const SUPPORTED_TYPES = {
  pdf: "application/pdf",
  word: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  text: ["text/plain", "text/markdown"],
  image: ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"],
};

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

// Explicitly reject GET requests with helpful error
export async function GET() {
  return NextResponse.json(
    { error: "Use POST to upload documents" },
    { status: 405 }
  );
}

// Handle PUT requests
export async function PUT() {
  return NextResponse.json(
    { error: "Use POST to upload documents" },
    { status: 405 }
  );
}

// Handle DELETE requests
export async function DELETE() {
  return NextResponse.json(
    { error: "Use POST to upload documents" },
    { status: 405 }
  );
}

const toBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

/**
 * Extract text from an image using local Tesseract OCR (no cloud/PHI exposure)
 */
const extractFromImageLocal = async (
  buffer: Buffer,
  language: OcrLanguage = "eng"
): Promise<{ text: string; warnings: string[] }> => {
  const warnings: string[] = [];
  try {
    const worker = await createWorker(language);
    try {
      const { data } = await worker.recognize(buffer);
      const text = (data.text ?? "").trim();
      if (!text || text.length < 10) {
        warnings.push(
          "Limited text extracted. Ensure the image is clear and well-lit."
        );
      }
      return { text, warnings };
    } finally {
      await worker.terminate();
    }
  } catch (error) {
    console.error("Tesseract OCR error:", error);
    warnings.push("Failed to extract text from image.");
    return { text: "", warnings };
  }
};

const extractFromPdf = async (
  buffer: Buffer,
  language: OcrLanguage = "eng"
): Promise<{ text: string; method: "pdf" | "pdf_ocr"; warnings: string[] }> => {
  const warnings: string[] = [];

  // Try text extraction with pdf-parse first
  const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdfParser.getText();
  const text = (result.text ?? "").trim();
  const pageCount = result.total ?? 1;

  // Check if this is a scanned PDF (< 50 chars per page average)
  const charsPerPage = text.length / pageCount;
  if (charsPerPage >= 50) {
    // Text-based PDF - return extracted text
    return { text, method: "pdf", warnings };
  }

  // Scanned PDF - use local OCR (no cloud/PHI exposure)
  warnings.push("Scanned PDF detected. Using local OCR extraction.");

  try {
    const pages: string[] = [];
    let pageIndex = 0;

    // Dynamic import to avoid build-time issues with native modules
    const { pdf: pdfToImages } = await import("pdf-to-img");
    const doc = await pdfToImages(buffer, { scale: 2.0 });

    for await (const pageImage of doc) {
      if (pageIndex >= MAX_OCR_PAGES) {
        warnings.push(`OCR limited to first ${MAX_OCR_PAGES} pages.`);
        break;
      }

      const worker = await createWorker(language);
      try {
        const { data } = await worker.recognize(pageImage);
        pages.push(data.text ?? "");
      } finally {
        await worker.terminate();
      }
      pageIndex++;
    }

    const ocrText = pages.join("\n\n").trim();
    if (!ocrText) {
      warnings.push("No text extracted via OCR. Try uploading as a clear image.");
      return { text, method: "pdf", warnings };
    }

    return { text: ocrText, method: "pdf_ocr", warnings };
  } catch (error) {
    console.error("PDF OCR fallback error:", error);
    warnings.push("OCR extraction failed. Try uploading as an image instead.");
    return { text, method: "pdf", warnings };
  }
};

const extractFromText = async (buffer: Buffer): Promise<string> => {
  return buffer.toString("utf-8").trim();
};

const extractFromWord = async (
  buffer: Buffer
): Promise<{ text: string; warnings: string[] }> => {
  const warnings: string[] = [];

  try {
    const result = await mammoth.extractRawText({ buffer });
    const mammothWarnings = result.messages
      .filter((m) => m.type === "warning")
      .map((m) => m.message);
    warnings.push(...mammothWarnings);
    return { text: result.value.trim(), warnings };
  } catch {
    const text = buffer
      .toString("utf-8")
      .replace(/[\x00-\x1F\x7F-\xFF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    warnings.push("Legacy .doc format - limited extraction quality.");
    return { text, warnings };
  }
};

const isSupportedType = (mimeType: string): boolean => {
  if (mimeType === SUPPORTED_TYPES.pdf) return true;
  if (SUPPORTED_TYPES.word.includes(mimeType)) return true;
  if (SUPPORTED_TYPES.text.includes(mimeType)) return true;
  if (SUPPORTED_TYPES.image.includes(mimeType)) return true;
  // Also check for generic image types
  if (mimeType.startsWith("image/")) return true;
  return false;
};

const runReportAnalysis = async (
  rawText: string
): Promise<ReportOutput | null> => {
  if (!rawText || rawText.length < 10) return null;

  try {
    const workflow = mastra.getWorkflow("reportWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({ inputData: { rawText } });
    if (result.status === "success" && "result" in result) {
      return result.result as ReportOutput;
    }
    return null;
  } catch {
    return null;
  }
};

const generateSummary = (
  rawText: string,
  analysis: ReportOutput | null
): string => {
  if (analysis && analysis.summary) {
    return analysis.summary;
  }

  const words = rawText.split(/\s+/).length;
  const lines = rawText.split(/\n/).filter((l) => l.trim()).length;
  return `Document processed: ${words} words, ${lines} lines of content extracted.`;
};

export async function POST(req: Request) {
  console.log("[documents/upload] POST request received");

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const patientId = formData.get("patientId")?.toString();
    const autoAnalyze = formData.get("autoAnalyze")?.toString() !== "false";

    // Language parameter for OCR (default: English)
    const languageParam = formData.get("language")?.toString() ?? "eng";
    const language: OcrLanguage = SUPPORTED_LANGUAGES.includes(
      languageParam as OcrLanguage
    )
      ? (languageParam as OcrLanguage)
      : "eng";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a document file (PDF, Word, text, or image)." },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Limit is 10MB." },
        { status: 413 }
      );
    }

    const mimeType = file.type;
    if (!isSupportedType(mimeType)) {
      return NextResponse.json(
        {
          error: "Unsupported file type. Upload a PDF, Word document, text file, or image.",
        },
        { status: 415 }
      );
    }

    const buffer = await toBuffer(file);
    let rawText = "";
    const warnings: string[] = [];
    let extractionMethod = "";

    // Extract text based on file type (all OCR is local - no cloud/PHI exposure)
    if (mimeType === SUPPORTED_TYPES.pdf) {
      const pdfResult = await extractFromPdf(buffer, language);
      rawText = pdfResult.text;
      extractionMethod = pdfResult.method;
      warnings.push(...pdfResult.warnings);
    } else if (SUPPORTED_TYPES.word.includes(mimeType)) {
      extractionMethod = "word";
      const wordResult = await extractFromWord(buffer);
      rawText = wordResult.text;
      warnings.push(...wordResult.warnings);
    } else if (
      SUPPORTED_TYPES.text.includes(mimeType) ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt")
    ) {
      extractionMethod = "text";
      rawText = await extractFromText(buffer);
    } else if (mimeType.startsWith("image/")) {
      extractionMethod = "local_ocr";
      const imageResult = await extractFromImageLocal(buffer, language);
      rawText = imageResult.text;
      warnings.push(...imageResult.warnings);
    }

    if (!rawText) {
      warnings.push("No text could be extracted from the document.");
    }

    // Sanitize text to remove PHI before returning to client (redacts names, IDs - keeps medical values)
    const { sanitizedText: safeRawText, directIdentifiersDetected } =
      sanitizeText(rawText);
    const rawTextContainedPhi = directIdentifiersDetected.length > 0;

    if (rawTextContainedPhi) {
      warnings.push(
        `PHI detected and redacted: ${directIdentifiersDetected.join(", ")}`
      );
    }

    // Auto-analyze with report workflow if requested (uses original text internally)
    let analysis: ReportOutput | null = null;
    if (autoAnalyze && rawText) {
      analysis = await runReportAnalysis(rawText);
    }

    const summary = generateSummary(safeRawText, analysis);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: mimeType,
      fileSize: file.size,
      extractionMethod,
      language,
      rawText: safeRawText, // Sanitized - safe to display (PHI redacted)
      rawTextContainedPhi,
      summary,
      analysis,
      patientId: patientId || null,
      warnings: warnings.length > 0 ? warnings : undefined,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to process the document upload." },
      { status: 500 }
    );
  }
}
