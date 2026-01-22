import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import { parseReportValues } from "@/mastra/engines/report-engine";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

// Supported OCR languages: English, Urdu, Arabic
const SUPPORTED_LANGUAGES = ["eng", "urd", "ara"] as const;
type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

// Maximum pages to OCR for scanned PDFs
const MAX_OCR_PAGES = 10;

const toBuffer = async (file: File) => {
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
    return { text, method: "pdf", warnings };
  }

  // Step 3: Scanned PDF detected - use OCR fallback
  warnings.push("Scanned PDF detected. Using OCR extraction.");

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

    return { text: pages.join("\n\n").trim(), method: "pdf_ocr", warnings };
  } catch {
    warnings.push("OCR fallback failed. Try uploading as an image.");
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

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    // Language parameter for OCR (default: English)
    const languageParam = formData.get("language")?.toString() ?? "eng";
    const language: SupportedLanguage = SUPPORTED_LANGUAGES.includes(
      languageParam as SupportedLanguage
    )
      ? (languageParam as SupportedLanguage)
      : "eng";

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a PDF or image file." },
        { status: 400 }
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Limit is 10MB." },
        { status: 413 }
      );
    }

    const buffer = await toBuffer(file);
    let rawText = "";
    const warnings: string[] = [];
    let extractionMethod = "";

    if (file.type === "application/pdf") {
      const pdfResult = await extractFromPdf(buffer, language);
      rawText = pdfResult.text;
      extractionMethod = pdfResult.method;
      warnings.push(...pdfResult.warnings);
      if (!rawText) {
        warnings.push(
          "No text extracted from the PDF. Try uploading as an image."
        );
      }
    } else if (file.type.startsWith("image/")) {
      extractionMethod = "ocr";
      rawText = await extractFromImage(buffer, language);
      if (!rawText) {
        warnings.push("No text extracted from the image.");
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or image." },
        { status: 415 }
      );
    }

    const parsedValues = rawText ? parseReportValues({ rawText }) : [];

    return NextResponse.json({
      rawText,
      parsedValues,
      extractionMethod,
      language,
      warnings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process the report upload." },
      { status: 500 }
    );
  }
}
