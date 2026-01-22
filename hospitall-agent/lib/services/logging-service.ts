import { createServiceClient } from "@/lib/supabase/server";
import { sanitizeText } from "@/mastra/guards/phi-guard";

// Cost per 1M tokens for different models (in cents)
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "google/gemini-3-flash-preview": { input: 50, output: 300 }, // $0.50/1M input, $3.00/1M output
  "google/gemini-2.0-flash": { input: 10, output: 40 },
  "gpt-4": { input: 3000, output: 6000 },
  "gpt-4-turbo": { input: 1000, output: 3000 },
  "gpt-3.5-turbo": { input: 50, output: 150 },
  "claude-3-opus": { input: 1500, output: 7500 },
  "claude-3-sonnet": { input: 300, output: 1500 },
  default: { input: 100, output: 300 },
};

function estimateCost(
  inputTokens: number,
  outputTokens: number,
  model: string
): number {
  const costs = MODEL_COSTS[model] || MODEL_COSTS.default;
  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;
  return inputCost + outputCost;
}

export interface ConversationLogInput {
  userId?: string;
  sessionId: string;
  threadId?: string;
  intent?: string;
  rawMessage: string;
  responseSummary?: string;
}

export interface UsageMetricsInput {
  userId?: string;
  sessionId: string;
  inputTokens: number;
  outputTokens: number;
  latencyMs?: number;
  modelUsed?: string;
  endpoint: string;
  intent?: string;
  externalLlmUsed: boolean;
}

export interface ErrorLogInput {
  userId?: string;
  sessionId?: string;
  endpoint: string;
  errorType: string;
  errorMessage: string;
  requestMetadata?: Record<string, unknown>;
}

export interface FeedbackInput {
  userId?: string;
  conversationLogId: string;
  rating: -1 | 1;
  comment?: string;
}

/**
 * Log a conversation with PHI-stripped message
 * Returns the conversation log ID for feedback linking
 */
export async function logConversation(
  input: ConversationLogInput
): Promise<string | null> {
  try {
    const supabase = createServiceClient();
    const { sanitizedText } = sanitizeText(input.rawMessage);

    const { data, error } = await supabase
      .from("conversation_logs")
      .insert({
        user_id: input.userId || null,
        session_id: input.sessionId,
        thread_id: input.threadId || null,
        intent: input.intent || null,
        sanitized_message: sanitizedText,
        response_summary: input.responseSummary || null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Error logging conversation:", error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error("Error in logConversation:", error);
    return null;
  }
}

/**
 * Log usage metrics with cost estimation
 */
export async function logUsage(input: UsageMetricsInput): Promise<boolean> {
  try {
    const supabase = createServiceClient();
    const totalTokens = input.inputTokens + input.outputTokens;
    const estimatedCostCents = estimateCost(
      input.inputTokens,
      input.outputTokens,
      input.modelUsed || "default"
    );

    const { error } = await supabase.from("usage_metrics").insert({
      user_id: input.userId || null,
      session_id: input.sessionId,
      input_tokens: input.inputTokens,
      output_tokens: input.outputTokens,
      total_tokens: totalTokens,
      estimated_cost_cents: estimatedCostCents,
      latency_ms: input.latencyMs || null,
      model_used: input.modelUsed || null,
      endpoint: input.endpoint,
      intent: input.intent || null,
      external_llm_used: input.externalLlmUsed,
    });

    if (error) {
      console.error("Error logging usage:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logUsage:", error);
    return false;
  }
}

/**
 * Log an error with sanitized message
 */
export async function logError(input: ErrorLogInput): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    // Sanitize error message to remove any PHI
    const { sanitizedText: sanitizedError } = sanitizeText(input.errorMessage);

    // Sanitize any string values in metadata
    let sanitizedMetadata: Record<string, unknown> | null = null;
    if (input.requestMetadata) {
      sanitizedMetadata = {};
      for (const [key, value] of Object.entries(input.requestMetadata)) {
        if (typeof value === "string") {
          sanitizedMetadata[key] = sanitizeText(value).sanitizedText;
        } else {
          sanitizedMetadata[key] = value;
        }
      }
    }

    const { error } = await supabase.from("error_logs").insert({
      user_id: input.userId || null,
      session_id: input.sessionId || null,
      endpoint: input.endpoint,
      error_type: input.errorType,
      error_message: sanitizedError,
      request_metadata: sanitizedMetadata,
    });

    if (error) {
      console.error("Error logging error:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logError:", error);
    return false;
  }
}

/**
 * Log user feedback on a conversation
 */
export async function logFeedback(input: FeedbackInput): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    // Sanitize comment if provided
    let sanitizedComment: string | null = null;
    if (input.comment) {
      const { sanitizedText } = sanitizeText(input.comment);
      sanitizedComment = sanitizedText;
    }

    const { error } = await supabase.from("feedback").insert({
      user_id: input.userId || null,
      conversation_log_id: input.conversationLogId,
      rating: input.rating,
      comment: sanitizedComment,
    });

    if (error) {
      console.error("Error logging feedback:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in logFeedback:", error);
    return false;
  }
}

/**
 * Update conversation log with response summary
 */
export async function updateConversationResponse(
  conversationLogId: string,
  responseSummary: string
): Promise<boolean> {
  try {
    const supabase = createServiceClient();

    // Sanitize response summary
    const { sanitizedText } = sanitizeText(responseSummary);

    const { error } = await supabase
      .from("conversation_logs")
      .update({ response_summary: sanitizedText })
      .eq("id", conversationLogId);

    if (error) {
      console.error("Error updating conversation response:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in updateConversationResponse:", error);
    return false;
  }
}
