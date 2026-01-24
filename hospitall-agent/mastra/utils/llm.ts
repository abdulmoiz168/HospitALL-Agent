import { openai as openaiDirect } from "@ai-sdk/openai";

/**
 * Get the model ID for the HospitALL agent.
 * Uses Mastra's built-in model router with Vercel AI Gateway.
 *
 * Model format: "vercel/[provider]/[model-name]"
 * Examples:
 * - vercel/google/gemini-2.0-flash
 * - vercel/openai/gpt-4o
 * - vercel/anthropic/claude-3.5-sonnet
 *
 * Environment: VERCEL_API_KEY (or AI_GATEWAY_API_KEY as alias)
 */
export const getHospitallModel = (): string => {
  // Default to Gemini 3 Flash via Vercel AI Gateway
  const model = process.env.HOSPITALL_LLM_MODEL ?? "vercel/google/gemini-3-flash";

  // Ensure model has vercel/ prefix for gateway routing
  if (!model.startsWith("vercel/") && !model.includes("/")) {
    return `vercel/google/${model}`;
  }

  return model;
};

/**
 * Get the embedding model for RAG and memory.
 * Uses OpenAI text-embedding-3-small (1536 dimensions).
 *
 * Requires: OPENAI_API_KEY
 * Returns undefined if key is not available (graceful degradation)
 */
export const getEmbeddingModel = () => {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return openaiDirect.embedding("text-embedding-3-small");
  }

  console.warn("[mastra/llm] OPENAI_API_KEY not set - embeddings disabled");
  return undefined;
};

export const hasLlmKey = () =>
  Boolean(process.env.VERCEL_API_KEY) || Boolean(process.env.AI_GATEWAY_API_KEY);

export const hasEmbeddingKey = () => Boolean(process.env.OPENAI_API_KEY);
