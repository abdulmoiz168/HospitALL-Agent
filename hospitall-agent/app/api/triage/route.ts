import { NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { TriageInputSchema } from "@/mastra/schemas/triage";
import { getUser } from "@/lib/supabase/server";
import { logUsage, logError } from "@/lib/services/logging-service";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const startTime = Date.now();
  const user = await getUser();
  const userId = user?.id;
  const sessionId = userId || "anonymous";

  try {
    const body = await req.json();
    const parsed = TriageInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid triage input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const workflow = mastra.getWorkflow("triageWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({ inputData: parsed.data });

    if (result.status === "success" && "result" in result) {
      // Log usage
      const latencyMs = Date.now() - startTime;
      await logUsage({
        userId,
        sessionId,
        inputTokens: Math.ceil(JSON.stringify(parsed.data).length / 4),
        outputTokens: Math.ceil(JSON.stringify(result.result).length / 4),
        latencyMs,
        endpoint: "/api/triage",
        intent: "triage",
        externalLlmUsed: false,
      });

      return NextResponse.json(result.result);
    }

    await logError({
      userId,
      sessionId,
      endpoint: "/api/triage",
      errorType: "WORKFLOW_ERROR",
      errorMessage: "Triage workflow did not complete successfully",
    });

    return NextResponse.json(
      { error: "Triage workflow did not complete successfully" },
      { status: 500 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError({
      userId,
      sessionId,
      endpoint: "/api/triage",
      errorType: "EXCEPTION",
      errorMessage,
    });

    return NextResponse.json(
      { error: "Failed to run triage workflow" },
      { status: 500 },
    );
  }
}
