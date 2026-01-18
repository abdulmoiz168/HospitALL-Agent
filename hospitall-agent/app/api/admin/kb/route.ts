import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB for KB documents

// Knowledge base document types
type KBDocumentCategory =
  | "clinical_guidelines"
  | "protocols"
  | "drug_information"
  | "patient_education"
  | "research"
  | "policies"
  | "other";

interface KBDocument {
  id: string;
  title: string;
  category: KBDocumentCategory;
  content: string;
  keywords: string[];
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: string;
  status: "active" | "inactive" | "pending_review";
  version: number;
  metadata?: Record<string, unknown>;
}

// In-memory knowledge base store (in production, use vector DB or search index)
const knowledgeBase: Map<string, KBDocument> = new Map();

// Initialize with some default documents
const initializeDefaultDocs = () => {
  if (knowledgeBase.size === 0) {
    // These mirror the mock data from the knowledge-tool
    const defaultDocs: KBDocument[] = [
      {
        id: "kb_001",
        title: "Type 2 Diabetes Management Guidelines",
        category: "clinical_guidelines",
        content: `Type 2 Diabetes Management Overview:
1. Glycemic Targets: HbA1c goal: <7.0% for most adults
2. First-line Treatment: Metformin is the preferred initial medication
3. Monitoring: HbA1c every 3-6 months, annual kidney function tests`,
        keywords: ["diabetes", "glucose", "hba1c", "metformin", "insulin"],
        fileName: "diabetes-guidelines.md",
        fileType: "text/markdown",
        fileSize: 1024,
        uploadedAt: "2024-01-01T00:00:00Z",
        uploadedBy: "system",
        status: "active",
        version: 1,
      },
      {
        id: "kb_002",
        title: "Hypertension Treatment Protocol",
        category: "clinical_guidelines",
        content: `Hypertension Management:
Blood Pressure Targets: General <130/80 mmHg
First-line: ACE inhibitors, ARBs, CCBs, or thiazide diuretics`,
        keywords: ["hypertension", "blood pressure", "ace inhibitor", "arb"],
        fileName: "hypertension-protocol.md",
        fileType: "text/markdown",
        fileSize: 856,
        uploadedAt: "2024-01-01T00:00:00Z",
        uploadedBy: "system",
        status: "active",
        version: 1,
      },
      {
        id: "kb_003",
        title: "Drug Allergy Cross-Reactivity Guide",
        category: "drug_information",
        content: `Penicillin Allergies: Cross-reactivity with cephalosporins ~1-2%
Sulfa Allergies: Limited cross-reactivity with non-antibiotic sulfonamides`,
        keywords: ["allergy", "drug allergy", "penicillin", "cross-reactivity"],
        fileName: "drug-allergies.md",
        fileType: "text/markdown",
        fileSize: 512,
        uploadedAt: "2024-01-01T00:00:00Z",
        uploadedBy: "system",
        status: "active",
        version: 1,
      },
    ];

    defaultDocs.forEach((doc) => knowledgeBase.set(doc.id, doc));
  }
};

// Initialize on module load
initializeDefaultDocs();

// Helper functions
const generateId = (): string => {
  return `kb_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

const extractKeywords = (content: string, title: string): string[] => {
  // Simple keyword extraction based on common medical terms
  const text = `${title} ${content}`.toLowerCase();
  const medicalTerms = [
    "diabetes",
    "hypertension",
    "cardiac",
    "renal",
    "hepatic",
    "pulmonary",
    "neurological",
    "oncology",
    "pediatric",
    "geriatric",
    "pregnancy",
    "allergy",
    "medication",
    "dosage",
    "interaction",
    "contraindication",
    "protocol",
    "guideline",
    "treatment",
    "diagnosis",
    "symptom",
    "monitoring",
    "screening",
  ];

  const found = medicalTerms.filter((term) => text.includes(term));

  // Add custom keywords from content (words that appear frequently)
  const words = text.split(/\W+/).filter((w) => w.length > 4);
  const wordFreq: Record<string, number> = {};
  words.forEach((w) => {
    wordFreq[w] = (wordFreq[w] || 0) + 1;
  });

  const frequentWords = Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);

  return Array.from(new Set([...found, ...frequentWords]));
};

const toBuffer = async (file: File): Promise<Buffer> => {
  const arrayBuffer = await file.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const extractFromPdf = async (buffer: Buffer): Promise<string> => {
  const pdfParser = new PDFParse({ data: buffer });
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

// GET - List all KB documents or search
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category") as KBDocumentCategory | null;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    let documents = Array.from(knowledgeBase.values());

    // Filter by status
    if (status) {
      documents = documents.filter((doc) => doc.status === status);
    }

    // Filter by category
    if (category) {
      documents = documents.filter((doc) => doc.category === category);
    }

    // Search by query
    if (query) {
      const queryLower = query.toLowerCase();
      documents = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(queryLower) ||
          doc.content.toLowerCase().includes(queryLower) ||
          doc.keywords.some((kw) => kw.includes(queryLower))
      );
    }

    // Sort by upload date (newest first)
    documents.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    // Paginate
    const total = documents.length;
    const paginatedDocs = documents.slice(offset, offset + limit);

    // Return without full content for list view (to reduce payload size)
    const summaryDocs = paginatedDocs.map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      keywords: doc.keywords,
      fileName: doc.fileName,
      fileType: doc.fileType,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt,
      uploadedBy: doc.uploadedBy,
      status: doc.status,
      version: doc.version,
      contentPreview: doc.content.substring(0, 200) + (doc.content.length > 200 ? "..." : ""),
    }));

    return NextResponse.json({
      success: true,
      documents: summaryDocs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("Error listing KB documents:", error);
    return NextResponse.json(
      { error: "Failed to retrieve knowledge base documents." },
      { status: 500 }
    );
  }
}

// POST - Upload a new KB document
export async function POST(req: Request) {
  try {
    const contentType = req.headers.get("content-type") || "";

    // Handle file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const title = formData.get("title")?.toString();
      const category =
        (formData.get("category")?.toString() as KBDocumentCategory) ||
        "other";
      const uploadedBy = formData.get("uploadedBy")?.toString() || "admin";
      const customKeywords = formData.get("keywords")?.toString();

      if (!file || !(file instanceof File)) {
        return NextResponse.json(
          { error: "File is required." },
          { status: 400 }
        );
      }

      if (file.size > MAX_UPLOAD_BYTES) {
        return NextResponse.json(
          { error: "File is too large. Limit is 20MB." },
          { status: 413 }
        );
      }

      const buffer = await toBuffer(file);
      let content = "";

      // Extract text based on file type
      if (file.type === "application/pdf") {
        content = await extractFromPdf(buffer);
      } else if (file.type.startsWith("image/")) {
        content = await extractFromImage(buffer);
      } else if (
        file.type.startsWith("text/") ||
        file.name.endsWith(".md") ||
        file.name.endsWith(".txt")
      ) {
        content = buffer.toString("utf-8").trim();
      } else {
        return NextResponse.json(
          { error: "Unsupported file type. Upload PDF, text, markdown, or image." },
          { status: 415 }
        );
      }

      if (!content) {
        return NextResponse.json(
          { error: "Could not extract text from the document." },
          { status: 400 }
        );
      }

      const docTitle = title || file.name.replace(/\.[^/.]+$/, "");
      const keywords = customKeywords
        ? customKeywords.split(",").map((k) => k.trim().toLowerCase())
        : extractKeywords(content, docTitle);

      const doc: KBDocument = {
        id: generateId(),
        title: docTitle,
        category,
        content,
        keywords,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        status: "active",
        version: 1,
      };

      knowledgeBase.set(doc.id, doc);

      return NextResponse.json({
        success: true,
        message: "Document uploaded successfully.",
        document: {
          id: doc.id,
          title: doc.title,
          category: doc.category,
          keywords: doc.keywords,
          status: doc.status,
        },
      });
    }

    // Handle JSON upload (for programmatic content creation)
    const body = await req.json();
    const { title, category, content, keywords, uploadedBy } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const doc: KBDocument = {
      id: generateId(),
      title,
      category: category || "other",
      content,
      keywords: keywords || extractKeywords(content, title),
      fileName: `${title.toLowerCase().replace(/\s+/g, "-")}.json`,
      fileType: "application/json",
      fileSize: content.length,
      uploadedAt: new Date().toISOString(),
      uploadedBy: uploadedBy || "admin",
      status: "active",
      version: 1,
    };

    knowledgeBase.set(doc.id, doc);

    return NextResponse.json({
      success: true,
      message: "Document created successfully.",
      document: {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        keywords: doc.keywords,
        status: doc.status,
      },
    });
  } catch (error) {
    console.error("Error uploading KB document:", error);
    return NextResponse.json(
      { error: "Failed to upload document." },
      { status: 500 }
    );
  }
}

// PUT - Update a KB document
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    const existingDoc = knowledgeBase.get(id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    // Apply updates
    const updatedDoc: KBDocument = {
      ...existingDoc,
      ...updates,
      id: existingDoc.id, // Prevent ID change
      uploadedAt: existingDoc.uploadedAt, // Preserve original upload time
      version: existingDoc.version + 1,
    };

    // Re-extract keywords if content changed
    if (updates.content && updates.content !== existingDoc.content) {
      updatedDoc.keywords = extractKeywords(
        updatedDoc.content,
        updatedDoc.title
      );
    }

    knowledgeBase.set(id, updatedDoc);

    return NextResponse.json({
      success: true,
      message: "Document updated successfully.",
      document: {
        id: updatedDoc.id,
        title: updatedDoc.title,
        version: updatedDoc.version,
        status: updatedDoc.status,
      },
    });
  } catch (error) {
    console.error("Error updating KB document:", error);
    return NextResponse.json(
      { error: "Failed to update document." },
      { status: 500 }
    );
  }
}

// DELETE - Remove a KB document
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    const existingDoc = knowledgeBase.get(id);
    if (!existingDoc) {
      return NextResponse.json(
        { error: "Document not found." },
        { status: 404 }
      );
    }

    // Soft delete by setting status to inactive
    const softDelete = searchParams.get("soft") !== "false";

    if (softDelete) {
      existingDoc.status = "inactive";
      knowledgeBase.set(id, existingDoc);
      return NextResponse.json({
        success: true,
        message: "Document deactivated successfully.",
        documentId: id,
      });
    }

    // Hard delete
    knowledgeBase.delete(id);
    return NextResponse.json({
      success: true,
      message: "Document permanently deleted.",
      documentId: id,
    });
  } catch (error) {
    console.error("Error deleting KB document:", error);
    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
