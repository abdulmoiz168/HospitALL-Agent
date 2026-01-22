import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import { mastra } from "@/mastra";
import type { ReportOutput } from "@/mastra/schemas/report";

// Supported OCR languages: English, Urdu, Arabic
const SUPPORTED_LANGUAGES = ["eng", "urd", "ara"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Maximum pages to OCR for scanned PDFs (performance limit)
const MAX_OCR_PAGES = 10;

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10MB

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

const toBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const extractFromPdf = async (
  buffer: Buffer,
  language: SupportedLanguage = "eng"
): Promise<{ text: string; method: "pdf" | "pdf_ocr"; warnings: string[] }> => {
  const warnings: string[] = [];

  // Step 1: Try text extraction with pdf-parse
  const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdfParser.getText();
  const text = (result.text ?? "").trim();
  const pageCount = result.total ?? 1;

  // Step 2: Check if this is a scanned PDF (< 50 chars per page average)
  const charsPerPage = text.length / pageCount;
  if (charsPerPage >= 50) {
    // Text-based PDF - return extracted text
    return { text, method: "pdf", warnings };
  }

  // Step 3: Scanned PDF detected - use OCR fallback
  warnings.push(
    "Scanned PDF detected. Using OCR extraction (may take longer)."
  );

  try {
    const pages: string[] = [];
    let pageIndex = 0;

    // Dynamic import to avoid build-time issues with native modules
    const { pdf: pdfToImages } = await import("pdf-to-img");

    // Convert PDF pages to images and OCR each
    const doc = await pdfToImages(buffer, { scale: 2.0 });
    for await (const pageImage of doc) {
      if (pageIndex >= MAX_OCR_PAGES) {
        warnings.push(
          `OCR limited to first ${MAX_OCR_PAGES} pages for performance.`
        );
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
    return { text: ocrText, method: "pdf_ocr", warnings };
  } catch (ocrError) {
    warnings.push(
      "OCR fallback failed. Try uploading pages as individual images."
    );
    return { text, method: "pdf", warnings };
  }
};

const extractFromImage = async (
  buffer: Buffer,
  language: SupportedLanguage = "eng"
): Promise<string> => {
  // tesseract.js v7 takes language as parameter to createWorker
  // Supports eng (English), urd (Urdu), ara (Arabic)
  const worker = await createWorker(language);
  try {
    const { data } = await worker.recognize(buffer);
    return (data.text ?? "").trim();
  } finally {
    await worker.terminate();
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
    // mammoth.js handles .docx properly - preserves tables, lists, formatting
    const result = await mammoth.extractRawText({ buffer });

    // Collect any warnings from mammoth
    const mammothWarnings = result.messages
      .filter((m) => m.type === "warning")
      .map((m) => m.message);
    warnings.push(...mammothWarnings);

    return { text: result.value.trim(), warnings };
  } catch {
    // Fallback for .doc (older binary format) or corrupted files
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
  if (SUPPORTED_TYPES.image.some((t) => mimeType.startsWith(t.split("/")[0])))
    return true;
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

  // Fallback summary if analysis fails
  const words = rawText.split(/\s+/).length;
  const lines = rawText.split(/\n/).filter((l) => l.trim()).length;
  return `Document processed: ${words} words, ${lines} lines of content extracted.`;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const patientId = formData.get("patientId")?.toString();
    const autoAnalyze = formData.get("autoAnalyze")?.toString() !== "false";

    // Language parameter for OCR (default: English)
    const languageParam = formData.get("language")?.toString() ?? "eng";
    const language: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
      languageParam as SupportedLanguage
    )
      ? (languageParam as SupportedLanguage)
      : "eng";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a document file (PDF, Word, text, markdown, or image)." },
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
          error:
            "Unsupported file type. Upload a PDF, Word document, text file, markdown, or image.",
        },
        { status: 415 }
      );
    }

    const buffer = await toBuffer(file);
    let rawText = "";
    const warnings: string[] = [];
    let extractionMethod = "";

    // Extract text based on file type
    if (mimeType === SUPPORTED_TYPES.pdf) {
      const pdfResult = await extractFromPdf(buffer, language);
      rawText = pdfResult.text;
      extractionMethod = pdfResult.method;
      warnings.push(...pdfResult.warnings);
      if (!rawText) {
        warnings.push(
          "No text extracted from the PDF. Try uploading pages as individual images."
        );
      }
    } else if (SUPPORTED_TYPES.word.includes(mimeType)) {
      extractionMethod = "word";
      const wordResult = await extractFromWord(buffer);
      rawText = wordResult.text;
      warnings.push(...wordResult.warnings);
      if (!rawText) {
        warnings.push(
          "No text extracted from Word document. The file may be corrupted."
        );
      }
    } else if (
      SUPPORTED_TYPES.text.includes(mimeType) ||
      file.name.endsWith(".md") ||
      file.name.endsWith(".txt")
    ) {
      extractionMethod = "text";
      rawText = await extractFromText(buffer);
    } else if (mimeType.startsWith("image/")) {
      extractionMethod = "ocr";
      rawText = await extractFromImage(buffer, language);
      if (!rawText) {
        warnings.push("No text extracted from the image via OCR.");
      }
    }

    // Auto-analyze with report workflow if requested
    let analysis: ReportOutput | null = null;
    if (autoAnalyze && rawText) {
      analysis = await runReportAnalysis(rawText);
    }

    const summary = generateSummary(rawText, analysis);

    return NextResponse.json({
      success: true,
      fileName: file.name,
      fileType: mimeType,
      fileSize: file.size,
      extractionMethod,
      language,
      rawText,
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
