import { NextResponse } from "next/server";
import { handleChatStream } from "@mastra/ai-sdk";
import { createUIMessageStreamResponse } from "ai";
import { mastra } from "@/mastra";
import { memory } from "@/mastra/config/memory";
import { getUser } from "@/lib/supabase/server";
import { logConversation, logError } from "@/lib/services/logging-service";

export const runtime = "nodejs";

// CORS and streaming headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Headers to prevent buffering and enable true streaming
const streamingHeaders = {
  ...corsHeaders,
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  "Connection": "keep-alive",
  "X-Accel-Buffering": "no", // Disable nginx buffering
};

// Handle GET requests with a helpful error
export async function GET(req: Request) {
  console.log("[api/chat] GET request received:", req.url);
  return NextResponse.json(
    { error: "Use POST to chat with the AI assistant", method: "GET", url: req.url },
    { status: 405 }
  );
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Handle PUT requests
export async function PUT() {
  return NextResponse.json(
    { error: "Use POST to chat with the AI assistant", method: "PUT" },
    { status: 405 }
  );
}

// Handle DELETE requests
export async function DELETE() {
  return NextResponse.json(
    { error: "Use POST to chat with the AI assistant", method: "DELETE" },
    { status: 405 }
  );
}

// Handle PATCH requests
export async function PATCH() {
  return NextResponse.json(
    { error: "Use POST to chat with the AI assistant", method: "PATCH" },
    { status: 405 }
  );
}

// Patient context from frontend
interface PatientContext {
  id: string;
  type: 'sample' | 'custom';
  name: string;
  age: number;
  sex: 'male' | 'female';
  conditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  allergies: Array<{
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction?: string;
  }>;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholUse: 'none' | 'occasional' | 'moderate' | 'heavy';
  familyHistory?: string[];
  notes?: string;
}

type ChatRequest = {
  messages?: unknown[];
  // Legacy format support
  message?: string;
  sessionId?: string;
  // System prompt from admin settings
  systemPrompt?: string;
  // Patient context
  patientContext?: PatientContext;
  // Memory configuration
  memory?: {
    thread?: string;
    resource?: string;
  };
};

// Format patient context into a clinical summary
function formatPatientContext(patient: PatientContext): string {
  const lines: string[] = [
    "=== PATIENT CONTEXT (for this consultation) ===",
    `Patient: ${patient.name || 'Anonymous'} | ${patient.age}${patient.sex === 'male' ? 'M' : 'F'}`,
    "",
  ];

  if (patient.conditions.length > 0) {
    lines.push("**Medical History:**");
    patient.conditions.forEach((c) => lines.push(`- ${c}`));
    lines.push("");
  }

  if (patient.medications.length > 0) {
    lines.push("**Current Medications:**");
    patient.medications.forEach((m) => lines.push(`- ${m.name} ${m.dosage} (${m.frequency})`));
    lines.push("");
  }

  if (patient.allergies.length > 0) {
    lines.push("**Allergies:**");
    patient.allergies.forEach((a) => {
      const reaction = a.reaction ? ` - ${a.reaction}` : '';
      lines.push(`- ${a.allergen} (${a.severity})${reaction}`);
    });
    lines.push("");
  }

  lines.push("**Social History:**");
  lines.push(`- Smoking: ${patient.smokingStatus}`);
  lines.push(`- Alcohol: ${patient.alcoholUse}`);

  if (patient.familyHistory && patient.familyHistory.length > 0) {
    lines.push("");
    lines.push("**Family History:**");
    patient.familyHistory.forEach((h) => lines.push(`- ${h}`));
  }

  if (patient.notes) {
    lines.push("");
    lines.push("**Additional Notes:**");
    lines.push(patient.notes);
  }

  lines.push("");
  lines.push("Use this patient context to provide personalized guidance. Consider their conditions, medications, and allergies when making recommendations.");
  lines.push("=== END PATIENT CONTEXT ===");

  return lines.join("\n");
}

export async function POST(req: Request) {
  console.log("[api/chat] POST request received");

  // Get authenticated user (may be null if not logged in)
  const user = await getUser();
  const userId = user?.id || "anonymous";
  console.log("[api/chat] User authenticated:", !!user, userId);

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Support both new AI SDK format (messages array) and legacy format (single message)
  let messages = body.messages;

  // Convert legacy single message format to messages array
  if (!messages && body.message) {
    messages = [
      {
        id: `msg-${Date.now()}`,
        role: "user",
        content: body.message,
        parts: [{ type: "text", text: body.message }],
      },
    ];
  }

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json(
      { error: "Messages array is required" },
      { status: 400 }
    );
  }

  // Extract thread/resource IDs for memory
  const threadId = body.memory?.thread || body.sessionId || `chat-${userId}-${Date.now()}`;
  const resourceId = body.memory?.resource || userId;

  // Log the conversation (PHI-stripped)
  const lastMessage = messages[messages.length - 1];
  const lastMessageContent =
    typeof lastMessage === "object" && lastMessage !== null
      ? (lastMessage as { content?: string }).content || ""
      : "";

  await logConversation({
    userId: user?.id,
    sessionId: threadId,
    threadId,
    intent: "agent",
    rawMessage: lastMessageContent,
  });

  try {
    console.log("[api/chat] Creating agent stream...");
    console.log("[api/chat] Memory configured:", !!memory);
    console.log("[api/chat] Thread ID:", threadId);
    console.log("[api/chat] Patient context:", body.patientContext ? body.patientContext.name : "none");
    console.log("[api/chat] Custom system prompt:", body.systemPrompt ? "yes" : "no");

    // Build instructions: system prompt from admin settings + patient context
    const instructionParts: string[] = [];

    // Add custom system prompt from admin settings (this overrides agent defaults)
    if (body.systemPrompt) {
      instructionParts.push(body.systemPrompt);
    }

    // Add patient context if available
    if (body.patientContext) {
      instructionParts.push(formatPatientContext(body.patientContext));
    }

    const additionalInstructions = instructionParts.length > 0
      ? instructionParts.join("\n\n")
      : undefined;

    // Use handleChatStream for full agent mode with AI SDK streaming
    const stream = await handleChatStream({
      mastra,
      agentId: "hospitallRouter",
      params: {
        messages: messages as Parameters<typeof handleChatStream>[0]["params"]["messages"],
        // Only pass memory configuration if memory is actually configured
        ...(memory && {
          memory: {
            thread: threadId,
            resource: resourceId,
          },
        }),
      },
      // Pass patient context as additional instructions
      defaultOptions: additionalInstructions
        ? { instructions: additionalInstructions }
        : undefined,
    });

    console.log("[api/chat] Stream created successfully");

    // Return AI SDK-compatible streaming response with anti-buffering headers
    return createUIMessageStreamResponse({
      stream,
      headers: streamingHeaders,
    });
  } catch (error) {
    console.error("[api/chat] Error:", error);

    const errorMessage = error instanceof Error ? error.message : String(error);
    const isRateLimit =
      errorMessage.includes("429") ||
      errorMessage.includes("quota") ||
      errorMessage.includes("RESOURCE_EXHAUSTED") ||
      errorMessage.includes("rate");

    // Log the error
    await logError({
      userId: user?.id,
      sessionId: threadId,
      endpoint: "/api/chat",
      errorType: isRateLimit ? "RATE_LIMIT" : "AGENT_ERROR",
      errorMessage,
    });

    // Return error response
    const userFacingMessage = isRateLimit
      ? "I'm currently experiencing high demand. Please wait a moment and try again."
      : "Sorry, I couldn't process that right now. Please try again in a moment.";

    return NextResponse.json(
      { error: userFacingMessage },
      { status: isRateLimit ? 429 : 500, headers: corsHeaders }
    );
  }
}
