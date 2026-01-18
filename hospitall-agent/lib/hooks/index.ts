// Export all hooks for easy importing
export { useRole } from "./use-role";
export { usePatient } from "./use-patient";
export { useSettings } from "./use-settings";

// Re-export types
export type { Role } from "./use-role";
export type { SessionDocument, ChatMessage } from "./use-patient";
export type { Settings, FeatureFlags } from "./use-settings";
