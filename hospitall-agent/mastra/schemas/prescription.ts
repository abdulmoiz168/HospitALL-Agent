import { z } from "zod";
import { SexAtBirthEnum } from "./common";

export const PrescriptionInputSchema = z.object({
  currentMeds: z.array(z.string()).min(1),
  newPrescription: z.string().optional(),
  ageYears: z.number().int().min(0).max(120).optional(),
  sexAtBirth: SexAtBirthEnum.optional(),
  pregnant: z.boolean().optional(),
  allergies: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

export const NormalizedDrugSchema = z.object({
  name: z.string(),
  rxcui: z.string(),
});

export const RxIssueSchema = z.object({
  type: z.enum([
    "interaction",
    "contraindication",
    "duplication",
    "dose_error",
    "missing_info",
  ]),
  severity: z.enum(["info", "caution", "serious", "critical"]),
  normalized_drugs: z.array(NormalizedDrugSchema),
  mechanism: z.string(),
  management: z.string(),
  evidence_source: z.string(),
});

export const PrescriptionOutputSchema = z.object({
  issues: z.array(RxIssueSchema),
});

export const PrescriptionContextSchema = PrescriptionInputSchema.extend({
  normalized: z.array(NormalizedDrugSchema).optional(),
  unknownMeds: z.array(z.string()).optional(),
  issues: z.array(RxIssueSchema).optional(),
});

export type PrescriptionInput = z.infer<typeof PrescriptionInputSchema>;
export type PrescriptionOutput = z.infer<typeof PrescriptionOutputSchema>;
export type PrescriptionContext = z.infer<typeof PrescriptionContextSchema>;
export type RxIssue = z.infer<typeof RxIssueSchema>;
export type NormalizedDrug = z.infer<typeof NormalizedDrugSchema>;
