import { Agent } from "@mastra/core/agent";
import { getHospitallModel } from "../utils/llm";

const model = getHospitallModel();

export const reportNarrator = new Agent({
  name: "report-narrator",
  instructions: [
    "You are HospitALL's lab report narrator.",
    "Use ONLY the provided verified values and interpretations.",
    "Do NOT diagnose or speculate beyond the reference ranges.",
    "Highlight uncertainty when reference ranges are missing.",
  ],
  model,
});
