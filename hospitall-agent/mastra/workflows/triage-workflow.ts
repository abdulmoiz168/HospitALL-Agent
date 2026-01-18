import { createStep, createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { phiGuard } from "../guards/phi-guard";
import { detectRedFlags } from "../engines/red-flag-engine";
import { triageDecision } from "../engines/triage-engine";
import {
  TriageContextSchema,
  TriageDecisionCoreSchema,
  TriageInputSchema,
  TriageOutputSchema,
} from "../schemas/triage";
import { selectCitations } from "../utils/citations";
import { verifyCitations } from "../utils/verifier";
import { hasLlmKey } from "../utils/llm";

const guardStep = createStep({
  id: "phi-guard",
  inputSchema: TriageInputSchema,
  outputSchema: TriageContextSchema,
  execute: async ({ inputData }) => {
    const guard = phiGuard(inputData);
    return {
      ...inputData,
      sanitizedText: guard.sanitizedText,
      directIdentifiersDetected: guard.directIdentifiersDetected,
      blockedExternal: guard.blockedExternal,
      structured: guard.structured,
    };
  },
});

const redFlagStep = createStep({
  id: "red-flags",
  inputSchema: TriageContextSchema,
  outputSchema: TriageContextSchema,
  execute: async ({ inputData }) => {
    const structured = inputData.structured ?? {
      symptomKeywords: [],
    };
    const { redFlags, emergency } = detectRedFlags(structured);
    return {
      ...inputData,
      redFlags,
      emergency,
    };
  },
});

const decisionStep = createStep({
  id: "triage-decision",
  inputSchema: TriageContextSchema,
  outputSchema: TriageContextSchema,
  execute: async ({ inputData }) => {
    const structured = inputData.structured ?? {
      symptomKeywords: [],
    };
    const redFlags = inputData.redFlags ?? [];
    const decision = triageDecision(structured, redFlags);
    const citations = selectCitations([
      "triage",
      decision.urgency_level,
      ...redFlags,
    ]);

    return {
      ...inputData,
      decision,
      citations,
    };
  },
});

const finalizeStep = createStep({
  id: "triage-finalize",
  inputSchema: TriageContextSchema,
  outputSchema: TriageOutputSchema,
  execute: async ({ inputData, mastra }) => {
    const decision = inputData.decision ??
      TriageDecisionCoreSchema.parse({
        urgency_level: "primary_care",
        red_flags_detected: [],
        risk_rationale:
          "Unable to verify clinical guidance from approved sources.",
        recommended_action: {
          primary: "Contact a clinician for guidance.",
        },
        system_action: "none",
      });

    const verified = verifyCitations(inputData.citations ?? [], 1);

    if (!verified.ok) {
      return {
        urgency_level: decision.urgency_level,
        red_flags_detected: decision.red_flags_detected,
        risk_rationale:
          "Unable to verify guidance against approved sources. Please seek clinician advice.",
        recommended_action: decision.recommended_action,
        system_action: decision.system_action,
        clinical_citations: [],
      };
    }

    let riskRationale = decision.risk_rationale;
    let possibleCauses = decision.possible_causes ?? [];

    const allowLlm =
      process.env.HOSPITALL_USE_LLM === "1" &&
      !inputData.blockedExternal &&
      hasLlmKey();

    if (allowLlm) {
      try {
        const agent = mastra.getAgent("triageNarrator");
        const response = await agent.generate(
          [
            {
              role: "system",
              content:
                "Rewrite the risk_rationale in plain language without changing its meaning. If non-emergency, you may include up to 3 possible causes (general, non-diagnostic). Return JSON with { risk_rationale, possible_causes }.",
            },
            {
              role: "user",
              content: JSON.stringify({
                decision,
                structured: inputData.structured,
              }),
            },
          ],
          {
            structuredOutput: {
              schema: z.object({
                risk_rationale: z.string(),
                possible_causes: z.array(z.string()).optional(),
              }),
              jsonPromptInjection: true,
            },
          },
        );
        if (response.object?.risk_rationale) {
          riskRationale = response.object.risk_rationale;
        }
        if (response.object?.possible_causes) {
          possibleCauses = response.object.possible_causes;
        }
      } catch {
        // Fall back to deterministic rationale on any LLM error.
      }
    }

    return {
      urgency_level: decision.urgency_level,
      red_flags_detected: decision.red_flags_detected,
      risk_rationale: riskRationale,
      possible_causes:
        decision.urgency_level === "emergency" ? [] : possibleCauses,
      recommended_action: decision.recommended_action,
      system_action: decision.system_action,
      clinical_citations: verified.citations,
    };
  },
});

export const triageWorkflow = createWorkflow({
  id: "triage-workflow",
  inputSchema: TriageInputSchema,
  outputSchema: TriageOutputSchema,
})
  .then(guardStep)
  .then(redFlagStep)
  .then(decisionStep)
  .then(finalizeStep)
  .commit();
