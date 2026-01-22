import { createTool } from "@mastra/core/tools";
import { TriageInputSchema, TriageOutputSchema } from "../schemas/triage";

export const triageTool = createTool({
  id: "triage-tool",
  description: "Run the HospitALL triage workflow and return structured output.",
  inputSchema: TriageInputSchema,
  outputSchema: TriageOutputSchema,
  execute: async (inputData, { mastra }) => {
    if (!mastra) throw new Error("Mastra instance not available");
    const workflow = mastra.getWorkflow("triageWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({ inputData });
    if (result.status === "success" && "result" in result) {
      return result.result;
    }
    throw new Error("Triage workflow failed");
  },
});
