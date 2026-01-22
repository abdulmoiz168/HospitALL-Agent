import { Mastra } from "@mastra/core/mastra";
import { storage } from "./config/storage";
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
import { knowledgeTool } from "./tools/knowledge-tool";

// Import custom gateway for Vercel AI Gateway
import { VercelAIGateway } from "./gateways/vercel-ai-gateway";

// Re-export storage for external access
export { storage } from "./config/storage";

// Create gateway instances conditionally based on environment
const createGateways = () => {
  const gateways: Record<string, InstanceType<typeof VercelAIGateway>> = {};

  // Only register Vercel AI Gateway if API key is configured
  if (process.env.AI_GATEWAY_API_KEY) {
    gateways["vercel-ai"] = new VercelAIGateway();
  }

  return Object.keys(gateways).length > 0 ? gateways : undefined;
};

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
  gateways: createGateways(),
});

// Export tools for direct access if needed
export const tools = {
  triageTool,
  rxTool,
  reportTool,
  patientContextTool,
  doctorTool,
  knowledgeTool,
};
