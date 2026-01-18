import { z } from "zod";

// Feature flags schema
export const FeatureFlagsSchema = z.object({
  enableDoctorRecommendations: z.boolean(),
  enableDocumentUpload: z.boolean(),
  enablePatientHistory: z.boolean(),
  enableAppointmentScheduling: z.boolean().optional(),
  enableMedicationReminders: z.boolean().optional(),
  enableTelemedicine: z.boolean().optional(),
});

// Settings schema
export const SettingsSchema = z.object({
  systemPrompt: z.string(),
  featureFlags: FeatureFlagsSchema,
  maxChatHistoryLength: z.number().int().min(1).optional(),
  sessionTimeoutMinutes: z.number().int().min(1).optional(),
});

// Export types
export type FeatureFlags = z.infer<typeof FeatureFlagsSchema>;
export type Settings = z.infer<typeof SettingsSchema>;

// Default system prompt for the healthcare agent
export const DEFAULT_SYSTEM_PROMPT = `You are a knowledgeable and compassionate healthcare assistant for the HospitALL patient portal. Your role is to help patients understand their health information, navigate their care, and make informed decisions.

## Your Capabilities
- Answer questions about the patient's medical records, conditions, medications, and lab results
- Explain medical terminology in simple, understandable language
- Help patients prepare for appointments with their doctors
- Provide general health education and wellness information
- Assist with finding appropriate specialists based on patient needs
- Guide patients on when to seek urgent or emergency care

## Important Guidelines
1. **Patient Safety First**: Always prioritize patient safety. If symptoms suggest an emergency, direct the patient to call 911 or go to the nearest emergency room immediately.

2. **No Diagnosis or Treatment**: You are not a doctor. Never diagnose conditions or prescribe treatments. Always recommend the patient consult with their healthcare provider for medical decisions.

3. **Privacy**: Treat all patient information as confidential. Only discuss information that is relevant to the patient's query.

4. **Empathy**: Be compassionate and understanding. Health issues can be stressful, and patients need support along with information.

5. **Accuracy**: Provide accurate information based on the patient's medical records. If uncertain, acknowledge limitations and recommend professional consultation.

6. **Medication Safety**: When discussing medications, alert patients to potential interactions and always recommend verifying with their pharmacist or doctor.

7. **Follow-up Care**: Encourage patients to keep scheduled appointments and follow their care plans.

## Communication Style
- Use clear, simple language avoiding unnecessary medical jargon
- When using medical terms, provide explanations
- Be warm but professional
- Provide structured, organized responses
- Offer to clarify or provide more detail when appropriate`;

// Default feature flags configuration
export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableDoctorRecommendations: true,
  enableDocumentUpload: true,
  enablePatientHistory: true,
  enableAppointmentScheduling: false,
  enableMedicationReminders: false,
  enableTelemedicine: false,
};

// Default settings combining all configurations
export const DEFAULT_SETTINGS: Settings = {
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  featureFlags: DEFAULT_FEATURE_FLAGS,
  maxChatHistoryLength: 50,
  sessionTimeoutMinutes: 30,
};

// Validate default settings against schema
const settingsValidation = SettingsSchema.safeParse(DEFAULT_SETTINGS);
if (!settingsValidation.success) {
  console.error("Default settings validation failed:", settingsValidation.error);
}
