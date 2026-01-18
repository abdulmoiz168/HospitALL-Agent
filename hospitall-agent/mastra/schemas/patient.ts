import { z } from "zod";
import { SexAtBirthEnum } from "./common";

// Contact information schema
export const ContactInfoSchema = z.object({
  phone: z.string(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  emergencyContact: z
    .object({
      name: z.string(),
      relationship: z.string(),
      phone: z.string(),
    })
    .optional(),
});

// Patient demographics schema
export const PatientDemographicsSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: z.string(), // ISO date string format YYYY-MM-DD
  sex: SexAtBirthEnum,
  contact: ContactInfoSchema,
});

// Medical condition schema
export const ConditionSchema = z.object({
  name: z.string(),
  status: z.enum(["active", "resolved", "chronic", "in_remission"]),
  diagnosedDate: z.string(), // ISO date string format YYYY-MM-DD
  notes: z.string().optional(),
});

// Medication schema
export const MedicationSchema = z.object({
  name: z.string(),
  dosage: z.string(),
  frequency: z.string(),
  status: z.enum(["active", "discontinued", "as_needed"]),
  prescribedDate: z.string().optional(),
  prescribedBy: z.string().optional(),
});

// Allergy schema
export const AllergySchema = z.object({
  allergen: z.string(),
  severity: z.enum(["mild", "moderate", "severe", "life_threatening"]),
  reaction: z.string(),
  onsetDate: z.string().optional(),
});

// Lab result schema
export const LabResultSchema = z.object({
  test: z.string(),
  value: z.string(),
  unit: z.string(),
  referenceRange: z.string(),
  date: z.string(), // ISO date string format YYYY-MM-DD
  status: z.enum(["normal", "abnormal_low", "abnormal_high", "critical"]).optional(),
  notes: z.string().optional(),
});

// Visit schema
export const VisitSchema = z.object({
  type: z.enum([
    "routine_checkup",
    "follow_up",
    "urgent_care",
    "emergency",
    "specialist",
    "lab_work",
    "imaging",
    "procedure",
    "telemedicine",
  ]),
  date: z.string(), // ISO date string format YYYY-MM-DD
  doctor: z.string(),
  specialty: z.string().optional(),
  summary: z.string(),
  followUpRequired: z.boolean().optional(),
});

// Full patient schema combining all sub-schemas
export const PatientSchema = z.object({
  demographics: PatientDemographicsSchema,
  conditions: z.array(ConditionSchema),
  medications: z.array(MedicationSchema),
  allergies: z.array(AllergySchema),
  labResults: z.array(LabResultSchema),
  visits: z.array(VisitSchema),
  insuranceProvider: z.string().optional(),
  primaryCarePhysician: z.string().optional(),
});

// Export types using z.infer
export type ContactInfo = z.infer<typeof ContactInfoSchema>;
export type PatientDemographics = z.infer<typeof PatientDemographicsSchema>;
export type Condition = z.infer<typeof ConditionSchema>;
export type Medication = z.infer<typeof MedicationSchema>;
export type Allergy = z.infer<typeof AllergySchema>;
export type LabResult = z.infer<typeof LabResultSchema>;
export type Visit = z.infer<typeof VisitSchema>;
export type Patient = z.infer<typeof PatientSchema>;
