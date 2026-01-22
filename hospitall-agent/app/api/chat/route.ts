import { NextResponse } from "next/server";
import { mastra } from "@/mastra";
import {
  buildStructuredFeatures,
  sanitizeText,
} from "@/mastra/guards/phi-guard";
import { detectIntent } from "@/mastra/utils/intent-router";
import type { StructuredFeatures, TriageInput } from "@/mastra/schemas/triage";
import type { PrescriptionOutput } from "@/mastra/schemas/prescription";
import type { ReportOutput } from "@/mastra/schemas/report";
import type { TriageOutput } from "@/mastra/schemas/triage";
import { hasLlmKey } from "@/mastra/utils/llm";
import { MOCK_PATIENTS } from "@/mastra/data/patients";
import type { Patient } from "@/mastra/schemas/patient";
import { getUser } from "@/lib/supabase/server";
import {
  getTriageState,
  setTriageState,
  clearTriageState,
  type TriageIntakeState,
} from "@/lib/services/triage-session-service";
import {
  logConversation,
  logUsage,
  logError,
  updateConversationResponse,
} from "@/lib/services/logging-service";

export const runtime = "nodejs";

type ChatRequest = {
  message?: string;
  sessionId?: string;
  patientId?: string;
  systemPrompt?: string;
};

const allowLlm = () =>
  process.env.HOSPITALL_USE_LLM === "1" && hasLlmKey();

const MAX_MESSAGE_LENGTH = 10000;

const parseAge = (text: string) => {
  const match =
    text.match(/\b(?:age|i am|i'm)\s*(\d{1,3})\b/i) ??
    text.match(/\b(\d{1,3})\s*(years?|yrs?)\b/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return undefined;
  if (value < 0 || value > 120) return undefined;
  return value;
};

const parseSeverity = (text: string) => {
  const numeric =
    text.match(/\b(\d{1,2})\s*\/\s*10\b/i) ??
    text.match(/\bseverity\s*(\d{1,2})\b/i) ??
    text.match(/\b(\d{1,2})\s*(?:out of|\/)\s*10\b/i);
  if (numeric) {
    const value = Number(numeric[1]);
    if (!Number.isNaN(value) && value >= 1 && value <= 10) {
      return value;
    }
  }

  const lowered = text.toLowerCase();
  if (lowered.includes("severe") || lowered.includes("intense")) return 8;
  if (lowered.includes("moderate")) return 5;
  if (lowered.includes("mild")) return 3;
  return undefined;
};

const parseDurationHours = (text: string) => {
  const match = text.match(/\b(\d+(?:\.\d+)?)\s*(hours?|hrs?|days?|weeks?)\b/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  if (Number.isNaN(value)) return undefined;
  const unit = match[2].toLowerCase();
  if (unit.startsWith("hour") || unit.startsWith("hr")) return value;
  if (unit.startsWith("day")) return value * 24;
  if (unit.startsWith("week")) return value * 24 * 7;
  return undefined;
};

const parseSexAtBirth = (text: string) => {
  if (/sex at birth.*female|female at birth/i.test(text)) return "female";
  if (/sex at birth.*male|male at birth/i.test(text)) return "male";
  if (/intersex/i.test(text)) return "intersex";
  return undefined;
};

const parsePregnant = (text: string) =>
  /\bpregnant\b/i.test(text) ? true : undefined;

const isSkipResponse = (text: string) =>
  /\b(skip|prefer not|rather not|unknown|unsure|not sure|dont know|don't know)\b/i.test(
    text,
  );

const looksLikeSymptomText = (text: string, structured?: StructuredFeatures) =>
  (structured?.symptomKeywords.length ?? 0) > 0 ||
  /[a-zA-Z]{3}/.test(text);

const nextTriageQuestion = (state: TriageIntakeState) => {
  if (!state.text) {
    state.awaiting = "symptoms";
    return "What symptoms are you experiencing right now?";
  }
  if (!state.severity && !state.skipSeverity) {
    state.awaiting = "severity";
    return "On a scale of 1-10, how severe is it right now? (You can say 'skip' if unsure.)";
  }
  if (!state.durationHours && !state.skipDuration) {
    state.awaiting = "duration";
    return "How long has this been going on? (hours or days is fine)";
  }
  if (!state.ageYears && !state.skipAge) {
    state.awaiting = "age";
    return "What age range are you in? (You can say 'skip' if you prefer not to share.)";
  }
  state.awaiting = undefined;
  return null;
};

const runTriage = async (input: TriageInput) => {
  const workflow = mastra.getWorkflow("triageWorkflow");
  const run = await workflow.createRun();
  const result = await run.start({ inputData: input });
  if (result.status === "success" && "result" in result) {
    return result.result as TriageOutput;
  }
  throw new Error("Triage workflow failed");
};

const runRx = async (meds: string[]) => {
  const workflow = mastra.getWorkflow("rxWorkflow");
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { currentMeds: meds } });
  if (result.status === "success" && "result" in result) {
    return result.result as PrescriptionOutput;
  }
  throw new Error("Rx workflow failed");
};

const runReport = async (rawText: string) => {
  const workflow = mastra.getWorkflow("reportWorkflow");
  const run = await workflow.createRun();
  const result = await run.start({ inputData: { rawText } });
  if (result.status === "success" && "result" in result) {
    return result.result as ReportOutput;
  }
  throw new Error("Report workflow failed");
};

const formatDeterministicResponse = (
  intent: string,
  structured: StructuredFeatures | undefined,
  payload: unknown,
) => {
  if (intent === "triage") {
    const triage = payload as TriageOutput;
    const possible =
      triage.possible_causes && triage.possible_causes.length > 0
        ? ` Possible causes to discuss with a clinician: ${triage.possible_causes.join(", ")}.`
        : "";
    return (
      `Triage result: ${triage.urgency_level}. ${triage.risk_rationale} ` +
      `Recommended: ${triage.recommended_action.primary}` +
      possible
    );
  }

  if (intent === "rx") {
    const rx = payload as PrescriptionOutput;
    if (!rx || rx.issues.length === 0) {
      return "No interactions detected in the local dataset. Confirm with a clinician.";
    }
    return (
      "Medication safety findings: " +
      rx.issues.map((issue) => `${issue.type} (${issue.severity})`).join(", ")
    );
  }

  if (intent === "report") {
    const report = payload as ReportOutput;
    if (!report) {
      return "Provide lab values or report text so I can interpret them.";
    }
    return `Report summary: ${report.summary}`;
  }

  if (structured?.symptomKeywords.length) {
    return "I can help with triage, medication safety, or report interpretation. Which would you like to focus on?";
  }

  return "Tell me if this is about symptoms, medications, or a lab report.";
};

const parseMedList = (text: string) => {
  return text
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const getPatientById = (patientId: string): Patient | undefined => {
  return MOCK_PATIENTS.find((p) => p.demographics.id === patientId);
};

const buildPatientContextMessage = (patient: Patient): string => {
  const { demographics, conditions, medications, allergies, labResults } = patient;

  const age = Math.floor(
    (Date.now() - new Date(demographics.dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );

  const getAgeBand = (years: number): string => {
    if (years < 18) return "pediatric (under 18)";
    if (years < 40) return "young adult (18-39)";
    if (years < 65) return "middle-aged adult (40-64)";
    return "older adult (65+)";
  };

  const activeConditions = conditions
    .filter((c) => c.status === "active" || c.status === "chronic")
    .map((c) => c.name)
    .join(", ");

  const activeMeds = medications
    .filter((m) => m.status === "active")
    .map((m) => `${m.name} ${m.dosage} (${m.frequency})`)
    .join("; ");

  const allergyList = allergies
    .map((a) => `${a.allergen} (${a.severity}: ${a.reaction})`)
    .join("; ");

  const recentLabs = labResults
    .slice(0, 5)
    .map((l) => `${l.test}: ${l.value} ${l.unit} [ref: ${l.referenceRange}]${l.status && l.status !== "normal" ? ` (${l.status})` : ""}`)
    .join("; ");

  return `Current patient context (de-identified):
- Patient ID: ${demographics.id}
- Age Band: ${getAgeBand(age)}
- Biological Sex: ${demographics.sex}
- Active Conditions: ${activeConditions || "None recorded"}
- Current Medications: ${activeMeds || "None recorded"}
- Known Allergies: ${allergyList || "No known allergies"}
- Recent Lab Results: ${recentLabs || "No recent labs"}

IMPORTANT: Use this de-identified patient context to provide personalized clinical guidance. Be aware of their conditions, medications, and allergies when providing recommendations. Do not ask for or reference patient names or other direct identifiers.`;
};

export async function POST(req: Request) {
  const startTime = Date.now();
  let conversationLogId: string | null = null;

  // Get authenticated user (may be null if not logged in)
  const user = await getUser();
  const userId = user?.id;

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message?.toString().trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json(
      { error: `Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters` },
      { status: 400 }
    );
  }

  const sessionId = body.sessionId?.toString() ?? (userId || "anonymous-session");
  const patientId = body.patientId?.toString();
  const customSystemPrompt = body.systemPrompt?.toString();
  const patient = patientId ? getPatientById(patientId) : undefined;
  const { sanitizedText, directIdentifiersDetected } = sanitizeText(message);
  const parsedSignals = {
    ageYears: parseAge(sanitizedText),
    severity: parseSeverity(sanitizedText),
    durationHours: parseDurationHours(sanitizedText),
    sexAtBirth: parseSexAtBirth(sanitizedText),
    pregnant: parsePregnant(sanitizedText),
  };
  const structured = buildStructuredFeatures(
    sanitizedText,
    parsedSignals.ageYears,
    parsedSignals.severity,
    parsedSignals.durationHours,
  );
  const intent = detectIntent(sanitizedText, structured);
  const externalAllowed = allowLlm() && directIdentifiersDetected.length === 0;

  // Log the conversation (PHI-stripped)
  conversationLogId = await logConversation({
    userId,
    sessionId,
    threadId: sessionId,
    intent,
    rawMessage: message,
  });

  if (!externalAllowed) {
    const existingState = await getTriageState(sessionId);
    const shouldHandleTriage = intent === "triage" || !!existingState;

    if (shouldHandleTriage) {
      if (intent !== "triage" && existingState?.awaiting === undefined) {
        await clearTriageState(sessionId);
      } else {
        const state: TriageIntakeState = existingState ?? {
          updatedAt: Date.now(),
        };

        if (
          state.awaiting &&
          isSkipResponse(sanitizedText)
        ) {
          if (state.awaiting === "severity") state.skipSeverity = true;
          if (state.awaiting === "duration") state.skipDuration = true;
          if (state.awaiting === "age") state.skipAge = true;
          state.awaiting = undefined;
        }

        const bareNumberMatch = sanitizedText.trim().match(/^\d{1,3}$/);
        if (state.awaiting === "severity" && bareNumberMatch) {
          const value = Number(bareNumberMatch[0]);
          if (!Number.isNaN(value) && value >= 1 && value <= 10) {
            state.severity = value;
            state.awaiting = undefined;
          }
        }

        if (state.awaiting === "age" && bareNumberMatch) {
          const value = Number(bareNumberMatch[0]);
          if (!Number.isNaN(value) && value >= 0 && value <= 120) {
            state.ageYears = value;
            state.awaiting = undefined;
          }
        }

        if (!state.text && looksLikeSymptomText(sanitizedText, structured)) {
          state.text = sanitizedText;
        }

        if (parsedSignals.ageYears) state.ageYears = parsedSignals.ageYears;
        if (parsedSignals.severity) state.severity = parsedSignals.severity;
        if (parsedSignals.durationHours)
          state.durationHours = parsedSignals.durationHours;
        if (parsedSignals.sexAtBirth) state.sexAtBirth = parsedSignals.sexAtBirth;
        if (parsedSignals.pregnant) state.pregnant = parsedSignals.pregnant;

        const question = nextTriageQuestion(state);
        if (question) {
          await setTriageState(sessionId, state, userId);

          // Log usage for triage question
          const latencyMs = Date.now() - startTime;
          await logUsage({
            userId,
            sessionId,
            inputTokens: Math.ceil(message.length / 4),
            outputTokens: Math.ceil(question.length / 4),
            latencyMs,
            endpoint: "/api/chat",
            intent: "triage",
            externalLlmUsed: false,
          });

          if (conversationLogId) {
            await updateConversationResponse(conversationLogId, question);
          }

          const stream = new ReadableStream({
            start(controller) {
              const encoder = new TextEncoder();
              const send = (data: Record<string, unknown>) => {
                controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
              };
              send({ type: "chunk", content: question });
              send({
                type: "done",
                meta: { intent: "triage", externalAllowed, triagePending: true, conversationLogId },
              });
              controller.close();
            },
          });

          return new Response(stream, {
            headers: {
              "Content-Type": "application/x-ndjson",
              "Cache-Control": "no-cache, no-transform",
            },
          });
        }

        const payload = await runTriage({
          text: state.text ?? sanitizedText,
          ageYears: state.ageYears,
          severity: state.severity,
          durationHours: state.durationHours,
          sexAtBirth: state.sexAtBirth as TriageInput["sexAtBirth"],
          pregnant: state.pregnant,
        });
        await clearTriageState(sessionId);

        const text = formatDeterministicResponse(
          "triage",
          structured,
          payload,
        );

        // Log usage for triage result
        const latencyMs = Date.now() - startTime;
        await logUsage({
          userId,
          sessionId,
          inputTokens: Math.ceil(message.length / 4),
          outputTokens: Math.ceil(text.length / 4),
          latencyMs,
          endpoint: "/api/chat",
          intent: "triage",
          externalLlmUsed: false,
        });

        if (conversationLogId) {
          await updateConversationResponse(conversationLogId, text);
        }

        const stream = new ReadableStream({
          start(controller) {
            const encoder = new TextEncoder();
            const send = (data: Record<string, unknown>) => {
              controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
            };
            send({ type: "chunk", content: text });
            send({
              type: "done",
              meta: { intent: "triage", externalAllowed, conversationLogId },
            });
            controller.close();
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache, no-transform",
          },
        });
      }
    }

    let payload: unknown = null;

    if (intent === "rx") {
      const meds = parseMedList(sanitizedText);
      if (meds.length > 0) {
        payload = await runRx(meds);
      }
    } else if (intent === "report") {
      payload = await runReport(sanitizedText);
    }

    const text = formatDeterministicResponse(intent, structured, payload);

    // Log usage for deterministic response
    const latencyMs = Date.now() - startTime;
    await logUsage({
      userId,
      sessionId,
      inputTokens: Math.ceil(message.length / 4),
      outputTokens: Math.ceil(text.length / 4),
      latencyMs,
      endpoint: "/api/chat",
      intent,
      externalLlmUsed: false,
    });

    if (conversationLogId) {
      await updateConversationResponse(conversationLogId, text);
    }

    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        const send = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
        };
        send({ type: "chunk", content: text });
        send({ type: "done", meta: { intent, externalAllowed, conversationLogId } });
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  const agent = mastra.getAgent("hospitallRouter");
  let finalMeta: Record<string, unknown> = { intent, externalAllowed, patientId, conversationLogId };

  const systemMessages: string[] = [];

  // Include custom system prompt if provided
  if (customSystemPrompt) {
    systemMessages.push(customSystemPrompt);
  }

  systemMessages.push(
    "Use the provided structured context. Do not request direct identifiers.",
    `Structured context: ${JSON.stringify({
      structured,
      directIdentifiersDetected,
      extractedSignals: parsedSignals,
    })}`
  );

  if (patient) {
    systemMessages.push(buildPatientContextMessage(patient));
  }

  const combinedSystemContext = systemMessages.join("\n\n");
  let responseText = "";

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`${JSON.stringify(data)}\n`));
      };
      try {
        const response = await agent.stream(
          [
            { role: "system" as const, content: combinedSystemContext },
            { role: "user" as const, content: sanitizedText },
          ],
          {
            memory: {
              resource: sessionId,
              thread: sessionId,
            },
            maxSteps: 6,
            onFinish: async ({ finishReason, usage }) => {
              finalMeta = { ...finalMeta, finishReason, usage };

              // Log usage with actual token counts
              const latencyMs = Date.now() - startTime;
              // Cast usage to access token properties (types may vary between Mastra versions)
              const usageAny = usage as { promptTokens?: number; completionTokens?: number } | undefined;
              const inputTokens = usageAny?.promptTokens || Math.ceil(message.length / 4);
              const outputTokens = usageAny?.completionTokens || Math.ceil(responseText.length / 4);

              await logUsage({
                userId,
                sessionId,
                inputTokens,
                outputTokens,
                latencyMs,
                modelUsed: process.env.HOSPITALL_LLM_MODEL || "google/gemini-3-flash-preview",
                endpoint: "/api/chat",
                intent,
                externalLlmUsed: true,
              });

              if (conversationLogId) {
                await updateConversationResponse(conversationLogId, responseText.substring(0, 500));
              }
            },
          },
        );

        for await (const chunk of response.textStream) {
          responseText += chunk;
          send({ type: "chunk", content: chunk });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const isRateLimit = errorMessage.includes('429') ||
                           errorMessage.includes('quota') ||
                           errorMessage.includes('RESOURCE_EXHAUSTED') ||
                           errorMessage.includes('rate');

        // Log the error
        await logError({
          userId,
          sessionId,
          endpoint: "/api/chat",
          errorType: isRateLimit ? "RATE_LIMIT" : "LLM_ERROR",
          errorMessage,
        });

        if (isRateLimit) {
          send({
            type: "chunk",
            content: "I'm currently experiencing high demand. Please wait a moment and try again. If this persists, the AI service may need to be upgraded from the free tier.",
          });
        } else {
          send({
            type: "chunk",
            content: "Sorry, I couldn't process that right now. Please try again in a moment.",
          });
        }
        console.error("Chat API error:", error);
      } finally {
        send({ type: "done", meta: finalMeta });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
