import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Supabase client for knowledge base queries
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  return createClient(url, key);
};

// Knowledge base document categories (must match kb_documents table)
type KBDocumentCategory =
  | "clinical_guidelines"
  | "protocols"
  | "drug_information"
  | "patient_education"
  | "research"
  | "policies"
  | "other";

// Input schema for knowledge search
const KnowledgeToolInputSchema = z.object({
  query: z.string().describe("Search query to find relevant knowledge base documents"),
  category: z
    .enum([
      "clinical_guidelines",
      "protocols",
      "drug_information",
      "patient_education",
      "research",
      "policies",
      "other",
      "all",
    ])
    .optional()
    .default("all")
    .describe("Optional category filter"),
  maxResults: z
    .number()
    .min(1)
    .max(10)
    .optional()
    .default(5)
    .describe("Maximum number of results to return"),
});

// Document excerpt schema
const DocumentExcerptSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  excerpt: z.string(),
  relevanceScore: z.number().min(0).max(100),
});

// Output schema
const KnowledgeToolOutputSchema = z.object({
  success: z.boolean(),
  results: z.array(DocumentExcerptSchema),
  totalFound: z.number(),
  query: z.string(),
  message: z.string().optional(),
});

// Helper function to calculate relevance score
function calculateRelevance(
  query: string,
  doc: { title: string; content: string; keywords: string[] }
): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  let score = 0;

  // Check title matches (high weight)
  const titleLower = doc.title.toLowerCase();
  for (const term of queryTerms) {
    if (titleLower.includes(term)) {
      score += 30;
    }
  }

  // Check keyword matches (medium weight)
  for (const term of queryTerms) {
    for (const keyword of doc.keywords || []) {
      if (keyword.toLowerCase().includes(term) || term.includes(keyword.toLowerCase())) {
        score += 20;
      }
    }
  }

  // Check content matches (lower weight)
  const contentLower = doc.content.toLowerCase();
  for (const term of queryTerms) {
    if (contentLower.includes(term)) {
      score += 10;
    }
  }

  // Normalize to 0-100
  return Math.min(score, 100);
}

// Helper function to extract relevant excerpt
function extractExcerpt(query: string, content: string, maxLength: number = 500): string {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const lines = content.split("\n").filter((line) => line.trim());

  // Find lines that contain query terms
  const relevantLines: string[] = [];
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (queryTerms.some((term) => lineLower.includes(term))) {
      relevantLines.push(line.trim());
    }
  }

  // If we found relevant lines, join them
  if (relevantLines.length > 0) {
    let excerpt = relevantLines.join("\n");
    if (excerpt.length > maxLength) {
      excerpt = excerpt.substring(0, maxLength) + "...";
    }
    return excerpt;
  }

  // Otherwise return the beginning of the content
  return content.substring(0, maxLength) + (content.length > maxLength ? "..." : "");
}

export const knowledgeTool = createTool({
  id: "knowledge-tool",
  description:
    "Search the HospitALL knowledge base for clinical guidelines, treatment protocols, drug information, and medical reference documents. Use this to provide evidence-based guidance.",
  inputSchema: KnowledgeToolInputSchema,
  outputSchema: KnowledgeToolOutputSchema,
  execute: async (inputData) => {
    const { query, category, maxResults } = inputData;

    const supabase = getSupabaseClient();

    if (!supabase) {
      return {
        success: false,
        results: [],
        totalFound: 0,
        query,
        message: "Knowledge base not available - database connection not configured.",
      };
    }

    try {
      // Build query for kb_documents table
      let dbQuery = supabase
        .from("kb_documents")
        .select("id, title, category, content, keywords")
        .eq("status", "active"); // Only active documents

      // Filter by category if specified
      if (category && category !== "all") {
        dbQuery = dbQuery.eq("category", category);
      }

      const { data: documents, error } = await dbQuery;

      if (error) {
        console.error("Knowledge base query error:", error);
        return {
          success: false,
          results: [],
          totalFound: 0,
          query,
          message: `Failed to search knowledge base: ${error.message}`,
        };
      }

      if (!documents || documents.length === 0) {
        return {
          success: true,
          results: [],
          totalFound: 0,
          query,
          message: `No knowledge base documents found${category !== "all" ? ` in category "${category}"` : ""}. The knowledge base may be empty.`,
        };
      }

      // Score and rank documents by relevance
      const scoredDocs = documents
        .map((doc) => ({
          ...doc,
          relevanceScore: calculateRelevance(query, doc),
        }))
        .filter((doc) => doc.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, maxResults);

      // Format results
      const results = scoredDocs.map((doc) => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        excerpt: extractExcerpt(query, doc.content),
        relevanceScore: doc.relevanceScore,
      }));

      // Generate message
      let message: string;
      if (results.length === 0) {
        message = `No knowledge base documents found matching "${query}". Try different search terms.`;
      } else {
        message = `Found ${results.length} relevant document(s) for "${query}".`;
      }

      return {
        success: true,
        results,
        totalFound: results.length,
        query,
        message,
      };
    } catch (error) {
      console.error("Knowledge tool error:", error);
      return {
        success: false,
        results: [],
        totalFound: 0,
        query,
        message: "An error occurred while searching the knowledge base.",
      };
    }
  },
});
