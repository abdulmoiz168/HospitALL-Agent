"use client";

import { useSettingsContext } from "@/lib/context/app-context";
import { Settings, FeatureFlags } from "@/mastra/data/default-settings";

/**
 * Hook for managing application settings including system prompt and feature flags.
 *
 * @returns {Object} Settings management functions and state
 * @returns {Settings} settings - The current settings object
 * @returns {function} updateSystemPrompt - Function to update the system prompt
 * @returns {function} updateFeatureFlags - Function to update feature flags
 * @returns {function} resetToDefaults - Function to reset all settings to defaults
 * @returns {function} isFeatureEnabled - Function to check if a feature flag is enabled
 *
 * @example
 * ```tsx
 * const {
 *   settings,
 *   updateSystemPrompt,
 *   updateFeatureFlags,
 *   resetToDefaults,
 *   isFeatureEnabled,
 * } = useSettings();
 *
 * // Update the system prompt
 * updateSystemPrompt("You are a helpful healthcare assistant...");
 *
 * // Enable a feature
 * updateFeatureFlags({ enableTelemedicine: true });
 *
 * // Check if a feature is enabled
 * if (isFeatureEnabled("enableDocumentUpload")) {
 *   return <DocumentUploader />;
 * }
 *
 * // Reset to defaults
 * resetToDefaults();
 * ```
 */
export function useSettings(): {
  settings: Settings;
  updateSystemPrompt: (prompt: string) => void;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => void;
  resetToDefaults: () => void;
  isFeatureEnabled: (flagName: keyof FeatureFlags) => boolean;
} {
  const {
    settings,
    updateSystemPrompt,
    updateFeatureFlags,
    resetToDefaults,
    isFeatureEnabled,
  } = useSettingsContext();

  return {
    settings,
    updateSystemPrompt,
    updateFeatureFlags,
    resetToDefaults,
    isFeatureEnabled,
  };
}

// Re-export types for convenience
export type { Settings, FeatureFlags };
