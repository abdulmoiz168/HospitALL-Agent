import { z } from "zod";
import { CitationSchema, SexAtBirthEnum } from "./common";

export const ReferenceRangeSchema = z.object({
  low: z.number().optional(),
  high: z.number().optional(),
});

export const ReportValueSchema = z.object({
  name: z.string().min(1),
  value: z.number(),
  unit: z.string().optional(),
  referenceRange: ReferenceRangeSchema.optional(),
});

export const ReportInputSchema = z.object({
  values: z.array(ReportValueSchema).min(1).optional(),
  rawText: z.string().optional(),
  ageYears: z.number().int().min(0).max(120).optional(),
  sexAtBirth: SexAtBirthEnum.optional(),
  pregnant: z.boolean().optional(),
});

export const ReportFindingSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  interpretation: z.string(),
});

export const ReportOutputSchema = z.object({
  summary: z.string(),
  abnormal_values: z.array(ReportFindingSchema),
  uncertainty: z.array(z.string()),
  recommended_questions: z.array(z.string()),
  clinical_citations: z.array(CitationSchema),
});

export const ReportContextSchema = ReportInputSchema.extend({
  parsedValues: z.array(ReportValueSchema).optional(),
  abnormalValues: z.array(ReportFindingSchema).optional(),
  uncertainty: z.array(z.string()).optional(),
  citations: z.array(CitationSchema).optional(),
});

export type ReportInput = z.infer<typeof ReportInputSchema>;
export type ReportOutput = z.infer<typeof ReportOutputSchema>;
export type ReportContext = z.infer<typeof ReportContextSchema>;
export type ReportValue = z.infer<typeof ReportValueSchema>;
