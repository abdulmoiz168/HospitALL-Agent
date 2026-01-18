import { createTool } from "@mastra/core/tools";
import {
  PrescriptionInputSchema,
  PrescriptionOutputSchema,
} from "../schemas/prescription";

export const rxTool = createTool({
  id: "rx-tool",
  description:
    "Run the HospitALL prescription safety workflow and return structured issues.",
  inputSchema: PrescriptionInputSchema,
  outputSchema: PrescriptionOutputSchema,
  execute: async ({ context, mastra }) => {
    if (!mastra) throw new Error("Mastra instance not available");
    const workflow = mastra.getWorkflow("rxWorkflow");
    const run = await workflow.createRunAsync();
    const result = await run.start({ inputData: context });
    if (result.status === "success" && "result" in result) {
      return result.result;
    }
    throw new Error("Rx workflow failed");
  },
});
