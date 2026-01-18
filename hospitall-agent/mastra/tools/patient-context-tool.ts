import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { MOCK_PATIENTS } from "../data/patients";

// Input schema for patient context tool
const PatientContextInputSchema = z.object({
  patientId: z.string().describe("The unique identifier of the patient"),
});

// De-identified patient context schema - excludes PII/PHI direct identifiers
const DeIdentifiedPatientSchema = z.object({
  patientId: z.string(),
  ageBand: z.string(),
  biologicalSex: z.string(),
  conditions: z.array(z.object({
    name: z.string(),
    status: z.string(),
    diagnosedDate: z.string().optional(),
  })),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
    status: z.string(),
  })),
  allergies: z.array(z.object({
    allergen: z.string(),
    severity: z.string(),
    reaction: z.string(),
  })),
  recentLabResults: z.array(z.object({
    test: z.string(),
    value: z.string(),
    unit: z.string(),
    referenceRange: z.string(),
    status: z.string().optional(),
  })),
  visitCount: z.number(),
  hasFollowUpRequired: z.boolean(),
});

// Output schema includes de-identified patient data or error
const PatientContextOutputSchema = z.object({
  success: z.boolean(),
  patient: DeIdentifiedPatientSchema.optional(),
  message: z.string().optional(),
  error: z.string().optional(),
});

// Convert age to age band for de-identification
const getAgeBand = (dateOfBirth: string): string => {
  const age = Math.floor(
    (Date.now() - new Date(dateOfBirth).getTime()) /
      (365.25 * 24 * 60 * 60 * 1000)
  );
  if (age < 18) return "pediatric (under 18)";
  if (age < 40) return "young adult (18-39)";
  if (age < 65) return "middle-aged adult (40-64)";
  return "older adult (65+)";
};

export const patientContextTool = createTool({
  id: "patient-context-tool",
  description:
    "Get de-identified patient health context including conditions, medications, allergies, and recent lab results. Does NOT return patient names, contact info, or other direct identifiers to protect PHI.",
  inputSchema: PatientContextInputSchema,
  outputSchema: PatientContextOutputSchema,
  execute: async ({ context }) => {
    const { patientId } = context;

    // Find patient by ID in mock data
    const patient = MOCK_PATIENTS.find(
      (p) => p.demographics.id === patientId
    );

    if (!patient) {
      return {
        success: false,
        error: `Patient with ID '${patientId}' not found`,
      };
    }

    // Return de-identified patient data only
    // Excludes: name, phone, email, address, emergency contact, DOB (uses age band instead)
    const deIdentifiedPatient = {
      patientId: patient.demographics.id,
      ageBand: getAgeBand(patient.demographics.dateOfBirth),
      biologicalSex: patient.demographics.sex,
      conditions: patient.conditions.map((c) => ({
        name: c.name,
        status: c.status,
        diagnosedDate: c.diagnosedDate,
      })),
      medications: patient.medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        status: m.status,
      })),
      allergies: patient.allergies.map((a) => ({
        allergen: a.allergen,
        severity: a.severity,
        reaction: a.reaction,
      })),
      recentLabResults: patient.labResults.slice(0, 5).map((l) => ({
        test: l.test,
        value: l.value,
        unit: l.unit,
        referenceRange: l.referenceRange,
        status: l.status,
      })),
      visitCount: patient.visits.length,
      hasFollowUpRequired: patient.visits.some((v) => v.followUpRequired),
    };

    return {
      success: true,
      patient: deIdentifiedPatient,
      message: "Patient context retrieved. Note: Direct identifiers (name, contact info) are excluded to protect PHI.",
    };
  },
});
