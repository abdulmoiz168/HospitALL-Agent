import { createVectorQueryTool } from "@mastra/rag";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { getEmbeddingModel, hasEmbeddingKey } from "../utils/llm";

/**
 * Vector-based RAG tool for searching the HospitALL knowledge base.
 * Uses OpenAI text-embedding-3-small for semantic search.
 *
 * This replaces the keyword-based knowledge-tool with proper vector embeddings.
 * Falls back to a no-op tool if embeddings are not configured.
 */
const createKnowledgeRagTool = () => {
  const embeddingModel = getEmbeddingModel();

  if (!embeddingModel) {
    // Return a fallback tool that explains RAG is not configured
    return createTool({
      id: "knowledge-rag-tool",
      description:
        "Search the HospitALL knowledge base (currently unavailable - OPENAI_API_KEY not configured)",
      inputSchema: z.object({
        queryText: z.string().describe("The search query"),
      }),
      outputSchema: z.object({
        message: z.string(),
      }),
      execute: async () => ({
        message:
          "Knowledge base search is not available. Please configure OPENAI_API_KEY for embeddings.",
      }),
    });
  }

  return createVectorQueryTool({
    id: "knowledge-rag-tool",
    vectorStoreName: "pgVector",
    indexName: "knowledge_embeddings",
    model: embeddingModel,
    description:
      "Search the HospitALL knowledge base for clinical guidelines, treatment protocols, drug information, and medical reference documents. Use this tool to provide evidence-based health guidance to patients. The knowledge base contains approved clinical guidelines and protocols.",
    includeSources: true,
  });
};

export const knowledgeRagTool = createKnowledgeRagTool();
