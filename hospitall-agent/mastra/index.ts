import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
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
  storage: new LibSQLStore({
    url: process.env.MASTRA_DB_URL ?? "file:./mastra.db",
  }),
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
