import { z } from "zod";
import {
  CitationSchema,
  RecommendedActionSchema,
  SexAtBirthEnum,
  UrgencyLevelEnum,
} from "./common";

export const TriageInputSchema = z.object({
  text: z.string().min(1),
  ageYears: z.number().int().min(0).max(120).optional(),
  severity: z.number().min(1).max(10).optional(),
  durationHours: z.number().min(0).max(8760).optional(),
  sexAtBirth: SexAtBirthEnum.optional(),
  pregnant: z.boolean().optional(),
  knownConditions: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
});

export const StructuredFeaturesSchema = z.object({
  ageBand: z.enum(["child", "adult", "older"]).optional(),
  symptomKeywords: z.array(z.string()),
  severity: z.number().min(1).max(10).optional(),
  durationHours: z.number().min(0).max(8760).optional(),
});

export const TriageDecisionCoreSchema = z.object({
  urgency_level: UrgencyLevelEnum,
  red_flags_detected: z.array(z.string()),
  risk_rationale: z.string(),
  possible_causes: z.array(z.string()).optional(),
  recommended_action: RecommendedActionSchema,
  system_action: z.enum(["emergency_circuit_breaker", "none"]).default("none"),
});

export const TriageOutputSchema = TriageDecisionCoreSchema.extend({
  clinical_citations: z.array(CitationSchema),
});

export const TriageContextSchema = TriageInputSchema.extend({
  sanitizedText: z.string().optional(),
  directIdentifiersDetected: z.array(z.string()).optional(),
  blockedExternal: z.boolean().optional(),
  structured: StructuredFeaturesSchema.optional(),
  redFlags: z.array(z.string()).optional(),
  emergency: z.boolean().optional(),
  citations: z.array(CitationSchema).optional(),
  decision: TriageDecisionCoreSchema.optional(),
});

export type TriageInput = z.infer<typeof TriageInputSchema>;
export type StructuredFeatures = z.infer<typeof StructuredFeaturesSchema>;
export type TriageDecisionCore = z.infer<typeof TriageDecisionCoreSchema>;
export type TriageOutput = z.infer<typeof TriageOutputSchema>;
export type TriageContext = z.infer<typeof TriageContextSchema>;
