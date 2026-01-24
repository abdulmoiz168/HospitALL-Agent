import { PostgresStore, PgVector } from "@mastra/pg";

// Connection string for Supabase - requires direct Postgres connection (not REST API)
// Supports both DATABASE_URL (Vercel default) and SUPABASE_DB_URL
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

// TEMPORARY: Disable storage until Supabase connection is fixed
// The Supabase pooler/direct connection is returning "Tenant or user not found"
// TODO: Fix Supabase connection and re-enable
const STORAGE_ENABLED = false;

/**
 * PostgresStore for Mastra memory and workflow state
 */
export const storage = STORAGE_ENABLED && connectionString
  ? new PostgresStore({
      id: "hospitall-storage",
      connectionString,
    })
  : undefined;

/**
 * PgVector for vector embeddings (RAG and semantic memory)
 * Uses pgvector extension in Supabase
 */
export const vectorStore = STORAGE_ENABLED && connectionString
  ? new PgVector({
      id: "hospitall-vectors",
      connectionString,
    })
  : undefined;

// Log configuration status
if (!STORAGE_ENABLED) {
  console.log("[mastra/storage] Storage temporarily disabled - fix Supabase connection");
} else if (!connectionString) {
  console.log("[mastra/storage] DATABASE_URL/SUPABASE_DB_URL not configured - storage and vectors disabled");
} else {
  console.log("[mastra/storage] PostgresStore and PgVector configured for Supabase");
}
