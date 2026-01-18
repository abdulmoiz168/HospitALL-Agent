import { z } from "zod";

export const UrgencyLevelEnum = z.enum([
  "emergency",
  "urgent_care",
  "primary_care",
  "self_care",
]);

export const CitationSchema = z.object({
  source_id: z.string(),
  chunk_id: z.string(),
  support: z.string(),
});

export const RecommendedActionSchema = z.object({
  primary: z.string(),
  secondary: z.string().optional(),
});

export const SexAtBirthEnum = z.enum([
  "female",
  "male",
  "intersex",
  "unknown",
]);
