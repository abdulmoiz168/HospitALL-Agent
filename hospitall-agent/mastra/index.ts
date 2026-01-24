import { Mastra } from "@mastra/core/mastra";
import { storage, vectorStore } from "./config/storage";
import { hospitallRouter } from "./agents/hospitall-router";
import { reportNarrator } from "./agents/report-narrator";
import { rxNarrator } from "./agents/rx-narrator";
import { triageNarrator } from "./agents/triage-narrator";
import { reportWorkflow } from "./workflows/report-workflow";
import { rxWorkflow } from "./workflows/rx-workflow";
import { triageWorkflow } from "./workflows/triage-workflow";

// Import tools for registration and export
import { triageTool } from "./tools/triage-tool";
import { rxTool } from "./tools/rx-tool";
import { reportTool } from "./tools/report-tool";
import { patientContextTool } from "./tools/patient-context-tool";
import { doctorTool } from "./tools/doctor-tool";
import { knowledgeRagTool } from "./tools/knowledge-rag-tool";

// Re-export storage and vectorStore for external access
export { storage, vectorStore } from "./config/storage";

export const mastra = new Mastra({
  agents: {
    hospitallRouter,
    triageNarrator,
    rxNarrator,
    reportNarrator,
  },
  workflows: {
    triageWorkflow,
    rxWorkflow,
    reportWorkflow,
  },
  storage,
  // Register PgVector for RAG tools
  vectors: vectorStore ? { pgVector: vectorStore } : undefined,
});

// Export tools for direct access if needed
export const tools = {
  triageTool,
  rxTool,
  reportTool,
  patientContextTool,
  doctorTool,
  knowledgeRagTool,
};
