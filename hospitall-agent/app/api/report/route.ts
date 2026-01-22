import { NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { ReportInputSchema } from "@/mastra/schemas/report";
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
    const parsed = ReportInputSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid report input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const workflow = mastra.getWorkflow("reportWorkflow");
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
        endpoint: "/api/report",
        intent: "report",
        externalLlmUsed: false,
      });

      return NextResponse.json(result.result);
    }

    await logError({
      userId,
      sessionId,
      endpoint: "/api/report",
      errorType: "WORKFLOW_ERROR",
      errorMessage: "Report workflow did not complete successfully",
    });

    return NextResponse.json(
      { error: "Report workflow did not complete successfully" },
      { status: 500 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logError({
      userId,
      sessionId,
      endpoint: "/api/report",
      errorType: "EXCEPTION",
      errorMessage,
    });

    return NextResponse.json(
      { error: "Failed to run report workflow" },
      { status: 500 },
    );
  }
}
