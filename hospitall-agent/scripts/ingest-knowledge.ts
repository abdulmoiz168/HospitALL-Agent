/**
 * Knowledge Base Ingestion Script
 *
 * This script reads documents from the Supabase knowledge_base table,
 * chunks them using MDocument, embeds using OpenAI text-embedding-3-small,
 * and stores the embeddings in PgVector for RAG retrieval.
 *
 * Usage:
 *   npx tsx scripts/ingest-knowledge.ts
 *
 * Prerequisites:
 *   - SUPABASE_DB_URL environment variable set (direct Postgres connection)
 *   - OPENAI_API_KEY environment variable set (for embeddings)
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set (for reading documents)
 *   - pgvector extension enabled in Supabase: CREATE EXTENSION IF NOT EXISTS vector;
 */

import { createClient } from "@supabase/supabase-js";
import { MDocument } from "@mastra/rag";
import { PgVector } from "@mastra/pg";
import { embedMany } from "ai";
import { ModelRouterEmbeddingModel } from "@mastra/core/llm";

// Configuration
const VECTOR_INDEX_NAME = "knowledge_embeddings";
const EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-3-small

// Initialize Supabase client for reading documents
const getSupabaseClient = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required");
  }

  return createClient(url, key);
};

// Initialize PgVector for storing embeddings
const getVectorStore = () => {
  const connectionString = process.env.SUPABASE_DB_URL;

  if (!connectionString) {
    throw new Error("SUPABASE_DB_URL is required for vector storage");
  }

  return new PgVector({ connectionString });
};

// Get embedding model using Mastra's ModelRouter
const getEmbedder = () => {
  // ModelRouterEmbeddingModel automatically handles API keys from environment
  return new ModelRouterEmbeddingModel("openai/text-embedding-3-small");
};

interface KnowledgeDocument {
  id: string;
  title: string;
  category: string;
  content: string;
  keywords: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

async function main() {
  console.log("Starting knowledge base ingestion...\n");

  // Initialize clients
  const supabase = getSupabaseClient();
  const vectorStore = getVectorStore();
  const embedder = getEmbedder();

  // Create vector index if it doesn't exist
  console.log(`Creating vector index "${VECTOR_INDEX_NAME}" (dimension: ${EMBEDDING_DIMENSION})...`);
  try {
    await vectorStore.createIndex({
      indexName: VECTOR_INDEX_NAME,
      dimension: EMBEDDING_DIMENSION,
    });
    console.log("Vector index created or already exists.\n");
  } catch (error) {
    // Index might already exist
    console.log("Vector index already exists or error:", error);
  }

  // Fetch all active documents from knowledge_base
  console.log("Fetching documents from knowledge_base table...");
  const { data: documents, error } = await supabase
    .from("knowledge_base")
    .select("*")
    .eq("status", "active");

  if (error) {
    console.error("Error fetching documents:", error);
    process.exit(1);
  }

  if (!documents || documents.length === 0) {
    console.log("No active documents found in knowledge_base table.");
    process.exit(0);
  }

  console.log(`Found ${documents.length} documents to process.\n`);

  // Process each document
  let totalChunks = 0;
  let processedDocs = 0;

  for (const doc of documents as KnowledgeDocument[]) {
    console.log(`Processing: ${doc.title} (${doc.category})`);

    try {
      // Create MDocument from content
      const mdoc = MDocument.fromText(doc.content, {
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        keywords: doc.keywords,
        source: "knowledge_base",
      });

      // Chunk the document
      const chunks = await mdoc.chunk({
        strategy: "recursive",
        maxSize: 1000,
        overlap: 100,
      });

      if (chunks.length === 0) {
        console.log(`  No chunks generated for "${doc.title}"`);
        continue;
      }

      console.log(`  Generated ${chunks.length} chunks`);

      // Create embeddings for all chunks at once using embedMany
      const { embeddings } = await embedMany({
        model: embedder,
        values: chunks.map((chunk) => chunk.text),
      });

      console.log(`  Created ${embeddings.length} embeddings`);

      // Prepare metadata for each chunk
      const metadata = chunks.map((chunk, idx) => ({
        text: chunk.text,
        documentId: doc.id,
        title: doc.title,
        category: doc.category,
        keywords: doc.keywords?.join(", ") || "",
        chunkIndex: idx,
        source: "knowledge_base",
      }));

      // Upsert to vector store
      await vectorStore.upsert({
        indexName: VECTOR_INDEX_NAME,
        vectors: embeddings,
        metadata,
      });

      totalChunks += chunks.length;
      processedDocs++;
      console.log(`  Stored ${embeddings.length} vectors\n`);
    } catch (error) {
      console.error(`  Error processing "${doc.title}":`, error);
    }
  }

  console.log("=".repeat(50));
  console.log(`Ingestion complete!`);
  console.log(`  Documents processed: ${processedDocs}/${documents.length}`);
  console.log(`  Total chunks created: ${totalChunks}`);
  console.log(`  Vector index: ${VECTOR_INDEX_NAME}`);
  console.log("=".repeat(50));
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
