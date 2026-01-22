import {
  MastraModelGateway,
  type GatewayLanguageModel,
} from "@mastra/core/llm";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createAnthropic } from "@ai-sdk/anthropic";

/**
 * Provider configuration for AI Gateway
 */
interface ProviderConfig {
  name: string;
  models: string[];
  apiKeyEnvVar: string | string[];
  gateway: string;
  url?: string;
  apiKeyHeader?: string;
  docUrl?: string;
}

/**
 * Vercel AI Gateway - routes requests through Vercel's AI Gateway
 * for unified access to multiple AI providers with a single API key.
 *
 * @see https://vercel.com/docs/ai-gateway
 */
export class VercelAIGateway extends MastraModelGateway {
  readonly id = "vercel-ai";
  readonly name = "Vercel AI Gateway";

  /**
   * Fetches available providers from the AI Gateway.
   * AI Gateway supports all major providers with unified authentication.
   */
  async fetchProviders(): Promise<Record<string, ProviderConfig>> {
    // AI Gateway supports these providers - return static config
    // since Vercel doesn't have a public API to list providers
    return {
      anthropic: {
        name: "Anthropic (via AI Gateway)",
        models: [
          "claude-sonnet-4-20250514",
          "claude-opus-4-20250514",
          "claude-3-5-sonnet-20241022",
          "claude-3-5-haiku-20241022",
          "claude-3-opus-20240229",
          "claude-3-haiku-20240307",
        ],
        apiKeyEnvVar: "AI_GATEWAY_API_KEY",
        gateway: this.id,
        docUrl: "https://vercel.com/docs/ai-gateway",
      },
      openai: {
        name: "OpenAI (via AI Gateway)",
        models: [
          "gpt-4o",
          "gpt-4o-mini",
          "gpt-4-turbo",
          "gpt-4",
          "gpt-3.5-turbo",
          "o1",
          "o1-mini",
          "o1-preview",
        ],
        apiKeyEnvVar: "AI_GATEWAY_API_KEY",
        gateway: this.id,
        docUrl: "https://vercel.com/docs/ai-gateway",
      },
      google: {
        name: "Google (via AI Gateway)",
        models: [
          "gemini-3-flash",
          "gemini-2.5-pro",
          "gemini-2.5-flash",
          "gemini-2.0-flash",
          "gemini-1.5-pro",
          "gemini-1.5-flash",
        ],
        apiKeyEnvVar: "AI_GATEWAY_API_KEY",
        gateway: this.id,
        docUrl: "https://vercel.com/docs/ai-gateway",
      },
    };
  }

  /**
   * Builds the base URL for the AI Gateway.
   */
  buildUrl(): string {
    return "https://ai-gateway.vercel.sh/v1";
  }

  /**
   * Gets the API key for AI Gateway authentication.
   */
  async getApiKey(): Promise<string> {
    const apiKey = process.env.AI_GATEWAY_API_KEY;
    if (!apiKey) {
      throw new Error(
        "AI_GATEWAY_API_KEY environment variable is required for Vercel AI Gateway"
      );
    }
    return apiKey;
  }

  /**
   * Resolves a language model instance for the given provider/model combination.
   * Uses provider-specific SDKs for optimal compatibility.
   */
  async resolveLanguageModel({
    modelId,
    providerId,
    apiKey,
  }: {
    modelId: string;
    providerId: string;
    apiKey: string;
  }): Promise<GatewayLanguageModel> {
    const baseURL = this.buildUrl();

    // Use provider-specific SDKs for better compatibility
    switch (providerId) {
      case "openai":
        return createOpenAI({
          apiKey,
          baseURL,
        })(modelId);

      case "google":
      case "gemini":
        return createGoogleGenerativeAI({
          apiKey,
          baseURL: `${baseURL}/`,
        })(modelId);

      case "anthropic":
        return createAnthropic({
          apiKey,
          baseURL: `${baseURL}/`,
        })(modelId);

      default:
        // Fallback to OpenAI-compatible for other providers
        return createOpenAICompatible({
          name: "vercel-ai-gateway",
          apiKey,
          baseURL,
        }).chatModel(`${providerId}/${modelId}`);
    }
  }
}
