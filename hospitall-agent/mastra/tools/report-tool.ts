import { createTool } from "@mastra/core/tools";
import { ReportInputSchema, ReportOutputSchema } from "../schemas/report";

export const reportTool = createTool({
  id: "report-tool",
  description:
    "Run the HospitALL report interpretation workflow and return structured findings.",
  inputSchema: ReportInputSchema,
  outputSchema: ReportOutputSchema,
  execute: async ({ context, mastra }) => {
    if (!mastra) throw new Error("Mastra instance not available");
    const workflow = mastra.getWorkflow("reportWorkflow");
    const run = await workflow.createRunAsync();
    const result = await run.start({ inputData: context });
    if (result.status === "success" && "result" in result) {
      return result.result;
    }
    throw new Error("Report workflow failed");
  },
});
