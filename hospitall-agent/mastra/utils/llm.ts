const GEMINI_PREFIX = "models/";

/**
 * Check if Vercel AI Gateway is configured
 */
const hasAiGateway = () => Boolean(process.env.AI_GATEWAY_API_KEY);

const normalizeModel = (rawModel: string) => {
  const trimmed = rawModel.trim();
  if (!trimmed) return "";

  if (trimmed.startsWith(GEMINI_PREFIX)) {
    return `google/${trimmed.slice(GEMINI_PREFIX.length)}`;
  }

  if (!trimmed.includes("/")) {
    if (
      trimmed.startsWith("gemini-") ||
      trimmed.startsWith("gemma-")
    ) {
      return `google/${trimmed}`;
    }
  }

  return trimmed;
};

export const ensureLlmEnv = () => {
  // Skip provider-specific key setup if using AI Gateway
  // AI Gateway handles all authentication with a single key
  if (hasAiGateway()) {
    return;
  }

  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      process.env.GOOGLE_GENERATIVE_AI_API_KEY = geminiKey;
    }
    if (!process.env.GOOGLE_API_KEY) {
      process.env.GOOGLE_API_KEY = geminiKey;
    }
  }
};

export const getHospitallModel = () => {
  ensureLlmEnv();
  const rawModel = process.env.HOSPITALL_LLM_MODEL ?? "";
  const normalized = normalizeModel(rawModel);

  // With AI Gateway, use the model directly without provider key checks
  // AI Gateway provides unified access to all models with one key
  if (normalized && hasAiGateway()) {
    return normalized;
  }

  if (normalized) {
    const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);
    const hasGoogleKey = Boolean(
      process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_API_KEY,
    );
    if (
      normalized === "openai/gpt-4o-mini" &&
      !hasOpenAiKey &&
      hasGoogleKey
    ) {
      return "google/gemini-3-flash-preview";
    }
    return normalized;
  }

  // Default model selection based on available keys
  // AI Gateway users should set HOSPITALL_LLM_MODEL explicitly
  if (hasAiGateway()) {
    return "google/gemini-3-flash";
  }

  const hasGoogleKey = Boolean(
    process.env.GEMINI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY,
  );

  return hasGoogleKey
    ? "google/gemini-3-flash-preview"
    : "openai/gpt-4o-mini";
};

export const hasLlmKey = () => {
  // AI Gateway provides access to all models with one key
  if (hasAiGateway()) {
    return true;
  }

  ensureLlmEnv();
  const model = getHospitallModel();
  const provider = model.split("/")[0];

  if (provider === "google") {
    return Boolean(
      process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GOOGLE_API_KEY,
    );
  }

  if (provider === "openai") {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  if (provider === "anthropic") {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  return Boolean(
    process.env.OPENAI_API_KEY ||
      process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
      process.env.GOOGLE_API_KEY ||
      process.env.GEMINI_API_KEY ||
      process.env.ANTHROPIC_API_KEY,
  );
};
