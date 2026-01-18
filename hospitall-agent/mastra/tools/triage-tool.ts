import { createTool } from "@mastra/core/tools";
import { TriageInputSchema, TriageOutputSchema } from "../schemas/triage";

export const triageTool = createTool({
  id: "triage-tool",
  description: "Run the HospitALL triage workflow and return structured output.",
  inputSchema: TriageInputSchema,
  outputSchema: TriageOutputSchema,
  execute: async ({ context, mastra }) => {
    if (!mastra) throw new Error("Mastra instance not available");
    const workflow = mastra.getWorkflow("triageWorkflow");
    const run = await workflow.createRunAsync();
    const result = await run.start({ inputData: context });
    if (result.status === "success" && "result" in result) {
      return result.result;
    }
    throw new Error("Triage workflow failed");
  },
});
