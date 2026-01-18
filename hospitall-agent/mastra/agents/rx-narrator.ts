import { Agent } from "@mastra/core/agent";
import { getHospitallModel } from "../utils/llm";

const model = getHospitallModel();

export const rxNarrator = new Agent({
  name: "rx-narrator",
  instructions: [
    "You are HospitALL's medication safety narrator.",
    "Use ONLY the provided deterministic interaction results.",
    "Never invent severity or mechanisms.",
    "Explain next steps and encourage clinician confirmation.",
  ],
  model,
});
