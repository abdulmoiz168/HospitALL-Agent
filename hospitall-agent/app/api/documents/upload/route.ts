import { NextResponse } from "next/server";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { mastra } from "@/mastra";
import { sanitizeText } from "@/mastra/guards/phi-guard";
import type { ReportOutput } from "@/mastra/schemas/report";

// Dynamic imports for native modules that may not work in serverless environments
// Using 'any' type for modules that may fail to load
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let PDFParse: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mammoth: any = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let createWorker: any = null;

// Flag to track if modules loaded successfully
let modulesLoaded = false;
let moduleLoadError: string | null = null;

// Lazy load native modules
const loadNativeModules = async () => {
  if (modulesLoaded) return;
  try {
    const [pdfParseModule, mammothModule, tesseractModule] = await Promise.all([
      import("pdf-parse"),
      import("mammoth"),
      import("tesseract.js"),
    ]);
    PDFParse = pdfParseModule.PDFParse;
    mammoth = mammothModule;
    createWorker = tesseractModule.createWorker;
    modulesLoaded = true;
  } catch (error) {
    moduleLoadError = error instanceof Error ? error.message : "Failed to load document processing modules";
    console.error("[documents/upload] Module load error:", error);
  }
};

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
  if (!createWorker) {
    warnings.push("OCR module not available. Try Vision AI mode instead.");
    return { text: "", warnings };
  }
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

  if (!PDFParse) {
    warnings.push("PDF processing module not available.");
    return { text: "", method: "pdf", warnings };
  }

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
  if (!createWorker) {
    warnings.push("Scanned PDF detected but OCR module not available. Text extraction may be limited.");
    return { text, method: "pdf", warnings };
  }

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

  if (!mammoth) {
    // Fallback for when mammoth isn't available
    const text = buffer
      .toString("utf-8")
      .replace(/[\x00-\x1F\x7F-\xFF]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    warnings.push("Word processing module not available. Basic text extraction used.");
    return { text, warnings };
  }

  try {
    const result = await mammoth.extractRawText({ buffer });
    const mammothWarnings = result.messages
      .filter((m: { type: string }) => m.type === "warning")
      .map((m: { message: string }) => m.message);
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

/**
 * Analyze image with Vision AI (Gemini) - sends image to cloud
 * WARNING: This sends PHI to cloud services - not HIPAA compliant without BAA
 */
const analyzeWithVision = async (
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<{ text: string; analysis: string; warnings: string[] }> => {
  const warnings: string[] = [];

  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY not configured");
  }

  const openai = createOpenAI({
    apiKey,
    baseURL: "https://ai-gateway.vercel.sh/v1",
  });

  // Strip vercel/ prefix if present (AI Gateway expects provider/model format)
  const rawModel = process.env.HOSPITALL_LLM_MODEL ?? "google/gemini-3-flash";
  const model = rawModel.startsWith("vercel/") ? rawModel.slice(7) : rawModel;

  // Convert buffer to base64
  const base64Image = buffer.toString("base64");
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  try {
    const result = await generateText({
      model: openai(model),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              image: dataUrl,
            },
            {
              type: "text",
              text: `You are a medical document analyst. Analyze this medical document image and provide:

1. **EXTRACTED TEXT**: Extract ALL text from the document exactly as written, preserving the structure (tables, values, reference ranges, etc.)

2. **ANALYSIS**: After the extracted text, provide a comprehensive analysis including:
   - Document type (lab report, prescription, X-ray, etc.)
   - Key findings (list each test/measurement with its value and whether it's normal/abnormal)
   - Any values outside reference ranges (flagged as High/Low)
   - Summary of what the results indicate
   - Recommendations for follow-up if applicable

IMPORTANT:
- Extract the EXACT numeric values from the document - do not estimate or approximate
- Preserve all patient information, dates, and reference ranges exactly as shown
- Format your response clearly with sections for "EXTRACTED TEXT" and "ANALYSIS"`,
            },
          ],
        },
      ],
    });

    const responseText = result.text || "";

    // Split response into extracted text and analysis
    const extractedTextMatch = responseText.match(/EXTRACTED TEXT[:\s]*([\s\S]*?)(?=ANALYSIS|$)/i);
    const analysisMatch = responseText.match(/ANALYSIS[:\s]*([\s\S]*?)$/i);

    const extractedText = extractedTextMatch?.[1]?.trim() || responseText;
    const analysis = analysisMatch?.[1]?.trim() || "Analysis included in response.";

    warnings.push("Document analyzed using Vision AI (cloud service - PHI was sent externally)");

    return {
      text: extractedText,
      analysis,
      warnings,
    };
  } catch (error) {
    console.error("Vision AI analysis error:", error);
    throw new Error("Failed to analyze document with Vision AI");
  }
};

export async function POST(req: Request) {
  console.log("[documents/upload] POST request received");

  // Load native modules (lazy initialization for serverless)
  // This is non-blocking - we'll handle missing modules per file type
  await loadNativeModules();

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const patientId = formData.get("patientId")?.toString();
    const autoAnalyze = formData.get("autoAnalyze")?.toString() !== "false";
    const useVision = formData.get("useVision")?.toString() === "true";

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
    let visionAnalysis: string | null = null;

    // VISION MODE: Send document to Gemini for analysis (NOT PHI-safe)
    if (useVision) {
      try {
        // For PDFs, convert all pages to images for Vision AI (parallel processing)
        if (mimeType === SUPPORTED_TYPES.pdf) {
          const { pdf: pdfToImages } = await import("pdf-to-img");
          const doc = await pdfToImages(buffer, { scale: 1.5 }); // Reduced scale for faster processing

          // Collect page buffers first (up to MAX_OCR_PAGES)
          const pageBuffers: Buffer[] = [];
          for await (const pageImage of doc) {
            if (pageBuffers.length >= MAX_OCR_PAGES) {
              warnings.push(`Vision AI limited to first ${MAX_OCR_PAGES} pages.`);
              break;
            }
            pageBuffers.push(Buffer.from(pageImage));
          }

          if (pageBuffers.length > 0) {
            // Process all pages in parallel for speed
            const visionPromises = pageBuffers.map((pageBuffer, idx) =>
              analyzeWithVision(pageBuffer, "image/png", `${file.name} (page ${idx + 1})`)
                .then((result) => ({ success: true as const, result, idx }))
                .catch((err) => ({ success: false as const, error: err, idx }))
            );

            const results = await Promise.all(visionPromises);

            // Gather successful results in order
            const pageResults: { text: string; analysis: string }[] = [];
            for (const res of results.sort((a, b) => a.idx - b.idx)) {
              if (res.success) {
                pageResults.push({
                  text: res.result.text,
                  analysis: res.result.analysis,
                });
                if (res.idx === 0) {
                  warnings.push(...res.result.warnings);
                }
              } else {
                warnings.push(`Page ${res.idx + 1} analysis failed`);
              }
            }

            if (pageResults.length > 0) {
              // Combine all pages
              rawText = pageResults
                .map((r, i) => `--- Page ${i + 1} ---\n${r.text}`)
                .join("\n\n");
              visionAnalysis = pageResults
                .map((r, i) => `## Page ${i + 1}\n${r.analysis}`)
                .join("\n\n");
              extractionMethod = "vision_ai_pdf";
              warnings.push(`PDF analyzed via Vision AI (${pageResults.length} page${pageResults.length > 1 ? 's' : ''} processed in parallel)`);

              return NextResponse.json({
                success: true,
                fileName: file.name,
                fileType: mimeType,
                fileSize: file.size,
                extractionMethod,
                language,
                rawText,
                rawTextContainedPhi: false,
                summary: visionAnalysis,
                analysis: null,
                visionAnalysis,
                patientId: patientId || null,
                pageCount: pageResults.length,
                warnings: warnings.length > 0 ? warnings : undefined,
                usedVisionAI: true,
              });
            }
          }
        } else if (mimeType.startsWith("image/")) {
          // Direct image Vision AI analysis
          const visionResult = await analyzeWithVision(buffer, mimeType, file.name);
          rawText = visionResult.text;
          visionAnalysis = visionResult.analysis;
          extractionMethod = "vision_ai";
          warnings.push(...visionResult.warnings);

          // Return vision analysis result (no PHI sanitization - user acknowledged the risk)
          return NextResponse.json({
            success: true,
            fileName: file.name,
            fileType: mimeType,
            fileSize: file.size,
            extractionMethod,
            language,
            rawText, // Not sanitized - vision mode user accepted PHI risk
            rawTextContainedPhi: false, // Not checked in vision mode
            summary: visionAnalysis,
            analysis: null, // Vision provides its own analysis
            visionAnalysis, // Full vision AI analysis
            patientId: patientId || null,
            warnings: warnings.length > 0 ? warnings : undefined,
            usedVisionAI: true,
          });
        }
      } catch (error) {
        console.error("Vision AI error:", error);
        warnings.push("Vision AI failed. Falling back to local extraction.");
        // Fall through to local extraction
      }
    }

    // LOCAL OCR MODE: PHI-safe text extraction
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
      // Check if OCR is available, otherwise auto-fallback to Vision AI
      if (!createWorker) {
        // OCR not available in serverless - auto-use Vision AI
        warnings.push("Local OCR not available in this environment. Using Vision AI instead.");
        try {
          const visionResult = await analyzeWithVision(buffer, mimeType, file.name);
          rawText = visionResult.text;
          visionAnalysis = visionResult.analysis;
          extractionMethod = "vision_ai_fallback";
          warnings.push(...visionResult.warnings);

          // Return vision analysis result
          return NextResponse.json({
            success: true,
            fileName: file.name,
            fileType: mimeType,
            fileSize: file.size,
            extractionMethod,
            language,
            rawText,
            rawTextContainedPhi: false,
            summary: visionAnalysis,
            analysis: null,
            visionAnalysis,
            patientId: patientId || null,
            warnings: warnings.length > 0 ? warnings : undefined,
            usedVisionAI: true,
          });
        } catch (visionError) {
          console.error("Vision AI fallback error:", visionError);
          warnings.push("Vision AI fallback also failed. Please try again later.");
          rawText = "";
          extractionMethod = "failed";
        }
      } else {
        extractionMethod = "local_ocr";
        const imageResult = await extractFromImageLocal(buffer, language);
        rawText = imageResult.text;
        warnings.push(...imageResult.warnings);
      }
    }

    if (!rawText && extractionMethod !== "failed") {
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
      usedVisionAI: false,
    });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Failed to process the document upload." },
      { status: 500 }
    );
  }
}
