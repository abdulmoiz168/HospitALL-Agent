import { Agent } from "@mastra/core/agent";
import type { ToolAction } from "@mastra/core/tools";
import { memory } from "../config/memory";
import { doctorTool } from "../tools/doctor-tool";
import { knowledgeRagTool } from "../tools/knowledge-rag-tool";
import { triageTool } from "../tools/triage-tool";
import { rxTool } from "../tools/rx-tool";
import { reportTool } from "../tools/report-tool";
import { patientContextTool } from "../tools/patient-context-tool";
import { getHospitallModel } from "../utils/llm";

const model = getHospitallModel();

export const hospitallRouter = new Agent({
  id: "hospitall-router",
  name: "HospitALL Router",
  // Instructions are provided via system prompt from admin settings
  // See: mastra/data/default-settings.ts for the default system prompt
  instructions: [],
  model,
  // Enable all tools for full agent mode
  tools: {
    doctorTool,
    // Cast RAG tool to ToolAction for type compatibility
    knowledgeRagTool: knowledgeRagTool as unknown as ToolAction<unknown, unknown>,
    triageTool,
    rxTool,
    reportTool,
    patientContextTool,
  },
  // Enable per-account memory for context persistence
  memory,
});
