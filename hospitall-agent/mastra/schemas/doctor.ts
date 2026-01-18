import { z } from "zod";

// Specialty enum for type safety
export const SpecialtyEnum = z.enum([
  "internal_medicine",
  "cardiology",
  "endocrinology",
  "nephrology",
  "ob_gyn",
  "family_medicine",
  "pulmonology",
  "neurology",
  "orthopedics",
  "dermatology",
  "psychiatry",
  "pediatrics",
  "oncology",
  "gastroenterology",
  "rheumatology",
]);

// Availability slot schema
export const AvailabilitySlotSchema = z.object({
  dayOfWeek: z.enum([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ]),
  startTime: z.string(), // Format: "HH:MM" in 24-hour
  endTime: z.string(), // Format: "HH:MM" in 24-hour
});

// Doctor schema
export const DoctorSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  credentials: z.array(z.string()), // e.g., ["MD", "FACC", "PhD"]
  specialty: SpecialtyEnum,
  subSpecialties: z.array(z.string()).optional(),
  availability: z.array(AvailabilitySlotSchema),
  rating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0).optional(),
  bio: z.string(),
  imageUrl: z.string().url().optional(),
  languages: z.array(z.string()).optional(),
  acceptingNewPatients: z.boolean().optional(),
  hospitalAffiliations: z.array(z.string()).optional(),
  yearsOfExperience: z.number().int().min(0).optional(),
});

// Export types using z.infer
export type Specialty = z.infer<typeof SpecialtyEnum>;
export type AvailabilitySlot = z.infer<typeof AvailabilitySlotSchema>;
export type Doctor = z.infer<typeof DoctorSchema>;
