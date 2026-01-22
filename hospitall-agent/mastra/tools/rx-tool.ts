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
  execute: async (inputData, { mastra }) => {
    if (!mastra) throw new Error("Mastra instance not available");
    const workflow = mastra.getWorkflow("rxWorkflow");
    const run = await workflow.createRun();
    const result = await run.start({ inputData });
    if (result.status === "success" && "result" in result) {
      return result.result;
    }
    throw new Error("Rx workflow failed");
  },
});
