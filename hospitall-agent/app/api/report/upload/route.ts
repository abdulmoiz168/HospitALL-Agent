import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";
import { parseReportValues } from "@/mastra/engines/report-engine";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const toBuffer = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const extractFromPdf = async (buffer: Buffer) => {
  const pdfParser = new PDFParse({ data: buffer });
  const result = await pdfParser.getText();
  return (result.text ?? "").trim();
};

const extractFromImage = async (buffer: Buffer) => {
  // tesseract.js v7 takes language as parameter to createWorker
  const worker = await createWorker("eng");
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

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Upload a PDF or image file." },
        { status: 400 },
      );
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Limit is 10MB." },
        { status: 413 },
      );
    }

    const buffer = await toBuffer(file);
    let rawText = "";
    const warnings: string[] = [];

    if (file.type === "application/pdf") {
      rawText = await extractFromPdf(buffer);
      if (!rawText) {
        warnings.push(
          "No text extracted from the PDF. If this is a scanned document, upload an image or paste the values manually.",
        );
      }
    } else if (file.type.startsWith("image/")) {
      rawText = await extractFromImage(buffer);
      if (!rawText) {
        warnings.push("No text extracted from the image.");
      }
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Upload a PDF or image." },
        { status: 415 },
      );
    }

    const parsedValues = rawText ? parseReportValues({ rawText }) : [];

    return NextResponse.json({
      rawText,
      parsedValues,
      warnings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process the report upload." },
      { status: 500 },
    );
  }
}
