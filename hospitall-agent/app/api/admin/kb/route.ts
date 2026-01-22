import { NextResponse } from "next/server";
import { requireAdmin, getUser } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { PDFParse } from "pdf-parse";
import { createWorker } from "tesseract.js";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024; // 20MB for KB documents

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
  status: string;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
}

// Helper functions
const extractKeywords = (content: string, title: string): string[] => {
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
  const worker = await createWorker("eng");
  try {
    const { data } = await worker.recognize(buffer);
    return (data.text ?? "").trim();
  } finally {
    await worker.terminate();
  }
};

// GET - List all KB documents or search (admin only for full access, public for active docs)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("query");
    const category = searchParams.get("category") as KBDocumentCategory | null;
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const supabase = createServiceClient();
    let queryBuilder = supabase.from("knowledge_base").select("*");

    // Filter by status (non-admins only see active)
    const user = await getUser();
    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      isAdmin = profile?.role === "admin";
    }

    if (!isAdmin) {
      queryBuilder = queryBuilder.eq("status", "active");
    } else if (status) {
      queryBuilder = queryBuilder.eq("status", status);
    }

    // Filter by category
    if (category) {
      queryBuilder = queryBuilder.eq("category", category);
    }

    // Search by query
    if (query) {
      queryBuilder = queryBuilder.or(
        `title.ilike.%${query}%,content.ilike.%${query}%`
      );
    }

    // Order and paginate
    queryBuilder = queryBuilder
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: documents, error, count } = await queryBuilder;

    if (error) {
      console.error("Error fetching KB documents:", error);
      return NextResponse.json(
        { error: "Failed to retrieve knowledge base documents." },
        { status: 500 }
      );
    }

    // Return without full content for list view
    const summaryDocs = (documents || []).map((doc) => ({
      id: doc.id,
      title: doc.title,
      category: doc.category,
      keywords: doc.keywords,
      status: doc.status,
      uploadedAt: doc.created_at,
      uploadedBy: doc.uploaded_by,
      contentPreview:
        doc.content.substring(0, 200) + (doc.content.length > 200 ? "..." : ""),
    }));

    return NextResponse.json({
      success: true,
      documents: summaryDocs,
      pagination: {
        total: count || summaryDocs.length,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
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

// POST - Upload a new KB document (admin only)
export async function POST(req: Request) {
  try {
    // Require admin access
    const { user } = await requireAdmin();

    const contentType = req.headers.get("content-type") || "";
    const supabase = createServiceClient();

    // Handle file upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const title = formData.get("title")?.toString();
      const category =
        (formData.get("category")?.toString() as KBDocumentCategory) || "other";
      const customKeywords = formData.get("keywords")?.toString();

      if (!file || !(file instanceof File)) {
        return NextResponse.json({ error: "File is required." }, { status: 400 });
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

      const { data, error } = await supabase
        .from("knowledge_base")
        .insert({
          title: docTitle,
          category,
          content,
          keywords,
          status: "active",
          uploaded_by: user.id,
        })
        .select("id, title, category, keywords, status")
        .single();

      if (error) {
        console.error("Error inserting KB document:", error);
        return NextResponse.json(
          { error: "Failed to upload document." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Document uploaded successfully.",
        document: data,
      });
    }

    // Handle JSON upload
    const body = await req.json();
    const { title, category, content, keywords } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Title and content are required." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("knowledge_base")
      .insert({
        title,
        category: category || "other",
        content,
        keywords: keywords || extractKeywords(content, title),
        status: "active",
        uploaded_by: user.id,
      })
      .select("id, title, category, keywords, status")
      .single();

    if (error) {
      console.error("Error inserting KB document:", error);
      return NextResponse.json(
        { error: "Failed to create document." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document created successfully.",
      document: data,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("Error uploading KB document:", error);
    return NextResponse.json(
      { error: "Failed to upload document." },
      { status: 500 }
    );
  }
}

// PUT - Update a KB document (admin only)
export async function PUT(req: Request) {
  try {
    // Require admin access
    await requireAdmin();

    const body = await req.json();
    const { id, updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if document exists
    const { data: existingDoc, error: fetchError } = await supabase
      .from("knowledge_base")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    // Prepare updates
    const safeUpdates: Record<string, unknown> = {};
    if (updates.title) safeUpdates.title = updates.title;
    if (updates.category) safeUpdates.category = updates.category;
    if (updates.content) safeUpdates.content = updates.content;
    if (updates.status) safeUpdates.status = updates.status;

    // Re-extract keywords if content changed
    if (updates.content && updates.content !== existingDoc.content) {
      safeUpdates.keywords = extractKeywords(
        updates.content,
        updates.title || existingDoc.title
      );
    } else if (updates.keywords) {
      safeUpdates.keywords = updates.keywords;
    }

    const { data, error } = await supabase
      .from("knowledge_base")
      .update(safeUpdates)
      .eq("id", id)
      .select("id, title, status")
      .single();

    if (error) {
      console.error("Error updating KB document:", error);
      return NextResponse.json(
        { error: "Failed to update document." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document updated successfully.",
      document: data,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("Error updating KB document:", error);
    return NextResponse.json(
      { error: "Failed to update document." },
      { status: 500 }
    );
  }
}

// DELETE - Remove a KB document (admin only)
export async function DELETE(req: Request) {
  try {
    // Require admin access
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const softDelete = searchParams.get("soft") !== "false";

    if (!id) {
      return NextResponse.json(
        { error: "Document ID is required." },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Check if document exists
    const { data: existingDoc, error: fetchError } = await supabase
      .from("knowledge_base")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existingDoc) {
      return NextResponse.json({ error: "Document not found." }, { status: 404 });
    }

    if (softDelete) {
      // Soft delete - set status to inactive
      const { error } = await supabase
        .from("knowledge_base")
        .update({ status: "inactive" })
        .eq("id", id);

      if (error) {
        console.error("Error deactivating KB document:", error);
        return NextResponse.json(
          { error: "Failed to deactivate document." },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Document deactivated successfully.",
        documentId: id,
      });
    }

    // Hard delete
    const { error } = await supabase.from("knowledge_base").delete().eq("id", id);

    if (error) {
      console.error("Error deleting KB document:", error);
      return NextResponse.json(
        { error: "Failed to delete document." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Document permanently deleted.",
      documentId: id,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Authentication required") {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        );
      }
      if (error.message === "Admin access required") {
        return NextResponse.json(
          { error: "Admin access required" },
          { status: 403 }
        );
      }
    }
    console.error("Error deleting KB document:", error);
    return NextResponse.json(
      { error: "Failed to delete document." },
      { status: 500 }
    );
  }
}
