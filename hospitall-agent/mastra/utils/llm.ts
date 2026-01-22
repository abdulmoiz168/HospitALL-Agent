import { createOpenAI } from "@ai-sdk/openai";

const AI_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1";

/**
 * Get the model instance for the agent.
 * Uses Vercel AI Gateway for unified access to all providers.
 */
export const getHospitallModel = () => {
  const apiKey = process.env.AI_GATEWAY_API_KEY;
  if (!apiKey) {
    throw new Error("AI_GATEWAY_API_KEY is required");
  }

  const model = process.env.HOSPITALL_LLM_MODEL ?? "google/gemini-3-flash";
  const openai = createOpenAI({
    apiKey,
    baseURL: AI_GATEWAY_BASE_URL,
  });

  return openai(model);
};

export const hasLlmKey = () => Boolean(process.env.AI_GATEWAY_API_KEY);
