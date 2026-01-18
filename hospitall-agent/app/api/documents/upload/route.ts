import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import { mastra } from "@/mastra";
import type { ReportOutput } from "@/mastra/schemas/report";

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

const toBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const extractFromPdf = async (buffer: Buffer): Promise<string> => {
  // pdf-parse v2.x uses PDFParse class with LoadParameters
  // data can be passed as Uint8Array or ArrayBuffer
  const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
  const result = await pdfParser.getText();
  return (result.text ?? "").trim();
};

const extractFromImage = async (buffer: Buffer): Promise<string> => {
  // tesseract.js v7 takes language as parameter to createWorker
  const worker = await createWorker("eng");
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

const extractFromWord = async (buffer: Buffer): Promise<string> => {
  // For Word documents, we attempt to extract basic text content
  // This is a simplified approach - in production you might use mammoth.js or similar
  // For .docx files, we try to extract from the XML structure
  // For .doc files, we extract visible text
  try {
    const content = buffer.toString("utf-8");

    // Check if this looks like a docx file (starts with PK for ZIP format)
    if (buffer[0] === 0x50 && buffer[1] === 0x4b) {
      // This is a docx/zip file - extract what text we can see
      // In production, use a proper library like mammoth.js
      const xmlMatch = content.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
      if (xmlMatch) {
        return xmlMatch
          .map((match) => match.replace(/<\/?w:t[^>]*>/g, ""))
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    // Fallback: extract readable text from the buffer
    const textContent = buffer
      .toString("utf-8")
      .replace(/[\x00-\x1F\x7F-\xFF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return textContent;
  } catch {
    return "";
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
    const run = await workflow.createRunAsync();
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
      extractionMethod = "pdf";
      rawText = await extractFromPdf(buffer);
      if (!rawText) {
        warnings.push(
          "No text extracted from the PDF. If this is a scanned document, try uploading as an image."
        );
      }
    } else if (SUPPORTED_TYPES.word.includes(mimeType)) {
      extractionMethod = "word";
      rawText = await extractFromWord(buffer);
      if (!rawText) {
        warnings.push(
          "Limited text extraction from Word document. Some formatting may be lost."
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
      rawText = await extractFromImage(buffer);
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
