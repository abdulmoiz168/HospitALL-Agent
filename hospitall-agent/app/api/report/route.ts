import { NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { ReportInputSchema } from "@/mastra/schemas/report";

export const runtime = "nodejs";

export async function POST(req: Request) {
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
    const run = await workflow.createRunAsync();
    const result = await run.start({ inputData: parsed.data });

    if (result.status === "success" && "result" in result) {
      return NextResponse.json(result.result);
    }
    return NextResponse.json(
      { error: "Report workflow did not complete successfully" },
      { status: 500 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to run report workflow" },
      { status: 500 },
    );
  }
}
