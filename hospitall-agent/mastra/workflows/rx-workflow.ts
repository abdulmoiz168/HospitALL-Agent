import { createStep, createWorkflow } from "@mastra/core/workflows";
import { normalizeDrugs, checkInteractions } from "../engines/drug-engine";
import {
  PrescriptionContextSchema,
  PrescriptionInputSchema,
  PrescriptionOutputSchema,
} from "../schemas/prescription";

const normalizeStep = createStep({
  id: "rx-normalize",
  inputSchema: PrescriptionInputSchema,
  outputSchema: PrescriptionContextSchema,
  execute: async ({ inputData }) => {
    const meds = [...inputData.currentMeds];
    if (inputData.newPrescription) {
      meds.push(inputData.newPrescription);
    }
    const { normalized, unknown } = normalizeDrugs(meds);

    return {
      ...inputData,
      normalized,
      unknownMeds: unknown,
    };
  },
});

const interactionStep = createStep({
  id: "rx-interactions",
  inputSchema: PrescriptionContextSchema,
  outputSchema: PrescriptionContextSchema,
  execute: async ({ inputData }) => {
    const normalized = inputData.normalized ?? [];
    const issues = checkInteractions(inputData, normalized);
    return {
      ...inputData,
      issues,
    };
  },
});

const finalizeStep = createStep({
  id: "rx-finalize",
  inputSchema: PrescriptionContextSchema,
  outputSchema: PrescriptionOutputSchema,
  execute: async ({ inputData }) => {
    const issues = [...(inputData.issues ?? [])];
    const unknown = inputData.unknownMeds ?? [];
    if (unknown.length > 0) {
      issues.push({
        type: "missing_info",
        severity: "info",
        normalized_drugs: [],
        mechanism: "NormalizationFailure",
        management: `Unable to normalize: ${unknown.join(", ")}. Confirm generic name, strength, and route.`,
        evidence_source: "DrugEngine:v1",
      });
    }

    return {
      issues,
    };
  },
});

export const rxWorkflow = createWorkflow({
  id: "rx-workflow",
  inputSchema: PrescriptionInputSchema,
  outputSchema: PrescriptionOutputSchema,
})
  .then(normalizeStep)
  .then(interactionStep)
  .then(finalizeStep)
  .commit();
