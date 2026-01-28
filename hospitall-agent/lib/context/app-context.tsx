"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { Patient } from "@/mastra/schemas/patient";
import { Settings, FeatureFlags, DEFAULT_SETTINGS, SETTINGS_VERSION } from "@/mastra/data/default-settings";
import { MOCK_PATIENTS } from "@/mastra/data/patients";

// ============================================================================
// Types
// ============================================================================

export type Role = "patient" | "admin";

// Simplified patient context for AI chat (de-identified, chat-friendly)
export interface ChatPatientContext {
  id: string;
  type: 'sample' | 'custom';
  name: string;
  age: number;
  sex: 'male' | 'female';
  conditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  allergies: Array<{
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction?: string;
  }>;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholUse: 'none' | 'occasional' | 'moderate' | 'heavy';
  familyHistory?: string[];
  notes?: string;
}

// Sample patients for quick selection (derived from MOCK_PATIENTS)
export const SAMPLE_CHAT_PATIENTS: ChatPatientContext[] = [
  {
    id: 'sample_rukhsana',
    type: 'sample',
    name: 'Rukhsana B.',
    age: 68,
    sex: 'female',
    conditions: [
      'Type 2 Diabetes Mellitus (insulin-dependent)',
      'Essential Hypertension',
      'Chronic Kidney Disease Stage 3a',
      'Diabetic Retinopathy (mild)',
    ],
    medications: [
      { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily' },
      { name: 'Insulin Glargine', dosage: '24 units', frequency: 'Once daily at bedtime' },
      { name: 'Lisinopril', dosage: '20mg', frequency: 'Once daily' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
      { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily at bedtime' },
    ],
    allergies: [
      { allergen: 'Sulfa Drugs', severity: 'severe', reaction: 'Anaphylaxis' },
      { allergen: 'Shellfish', severity: 'moderate', reaction: 'Hives' },
    ],
    smokingStatus: 'never',
    alcoholUse: 'none',
    familyHistory: ['Diabetes (mother)', 'Heart disease (father)'],
  },
  {
    id: 'sample_farhan',
    type: 'sample',
    name: 'Farhan A.',
    age: 45,
    sex: 'male',
    conditions: [
      'Coronary Artery Disease (stent in LAD)',
      'Hyperlipidemia',
      'History of Myocardial Infarction (2022)',
      'Anxiety Disorder',
    ],
    medications: [
      { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
      { name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily' },
      { name: 'Rosuvastatin', dosage: '40mg', frequency: 'Once daily at bedtime' },
      { name: 'Metoprolol', dosage: '50mg', frequency: 'Once daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' },
    ],
    allergies: [
      { allergen: 'Penicillin', severity: 'moderate', reaction: 'Skin rash' },
    ],
    smokingStatus: 'former',
    alcoholUse: 'occasional',
    familyHistory: ['Heart disease (father, died at 55)', 'High cholesterol (mother)'],
  },
];

export interface SessionDocument {
  id: string;
  name: string;
  type: string;
  uploadedAt: Date;
  content?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// ============================================================================
// Role Context
// ============================================================================

interface RoleContextValue {
  role: Role;
  setRole: (role: Role) => void;
  isAdmin: boolean;
  isPatient: boolean;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

const ROLE_STORAGE_KEY = "hospitall-role";

function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("patient");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(ROLE_STORAGE_KEY);
      if (stored === "admin" || stored === "patient") {
        setRoleState(stored);
      }
      setIsHydrated(true);
    }
  }, []);

  const setRole = useCallback((newRole: Role) => {
    setRoleState(newRole);
    if (typeof window !== "undefined") {
      localStorage.setItem(ROLE_STORAGE_KEY, newRole);
    }
  }, []);

  const value: RoleContextValue = {
    role,
    setRole,
    isAdmin: role === "admin",
    isPatient: role === "patient",
  };

  // Prevent hydration mismatch by rendering nothing until hydrated
  if (!isHydrated) {
    return null;
  }

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

// ============================================================================
// Patient Context
// ============================================================================

interface PatientContextValue {
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  patients: Patient[];
  // Chat-friendly patient context (for AI)
  chatPatientContext: ChatPatientContext | null;
  setChatPatientContext: (patient: ChatPatientContext | null) => void;
  customPatient: ChatPatientContext | null;
  setCustomPatient: (patient: ChatPatientContext | null) => void;
  samplePatients: ChatPatientContext[];
  // Patient selection modal
  showPatientSelector: boolean;
  setShowPatientSelector: (show: boolean) => void;
  // Session documents
  sessionDocuments: SessionDocument[];
  addSessionDocument: (document: Omit<SessionDocument, "id" | "uploadedAt">) => void;
  clearSessionDocuments: () => void;
  chatHistory: ChatMessage[];
  addChatMessage: (message: Omit<ChatMessage, "id" | "timestamp">) => void;
  clearChatHistory: () => void;
}

const PatientContext = createContext<PatientContextValue | undefined>(undefined);

const ACTIVE_PATIENT_STORAGE_KEY = "hospitall-active-patient";
const SESSION_DOCUMENTS_STORAGE_KEY = "hospitall-session-documents";
const CHAT_HISTORY_STORAGE_KEY = "hospitall-chat-history";
const CHAT_PATIENT_CONTEXT_KEY = "hospitall-chat-patient-context";
const CUSTOM_PATIENT_KEY = "hospitall-custom-patient";

function PatientProvider({ children }: { children: ReactNode }) {
  // Auto-select first mock patient for demo (logged-in user IS the patient)
  const [activePatient] = useState<Patient | null>(MOCK_PATIENTS[0] || null);
  const [sessionDocuments, setSessionDocuments] = useState<SessionDocument[]>([]);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatPatientContext, setChatPatientContextState] = useState<ChatPatientContext | null>(null);
  const [customPatient, setCustomPatientState] = useState<ChatPatientContext | null>(null);
  const [showPatientSelector, setShowPatientSelector] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Clean up old localStorage keys (no longer used)
      localStorage.removeItem(ACTIVE_PATIENT_STORAGE_KEY);
      localStorage.removeItem(SESSION_DOCUMENTS_STORAGE_KEY);

      // Load chat patient context
      const storedPatientContext = localStorage.getItem(CHAT_PATIENT_CONTEXT_KEY);
      if (storedPatientContext) {
        try {
          setChatPatientContextState(JSON.parse(storedPatientContext));
        } catch (e) {
          console.error("Failed to parse chat patient context from localStorage:", e);
        }
      }

      // Load custom patient
      const storedCustomPatient = localStorage.getItem(CUSTOM_PATIENT_KEY);
      if (storedCustomPatient) {
        try {
          setCustomPatientState(JSON.parse(storedCustomPatient));
        } catch (e) {
          console.error("Failed to parse custom patient from localStorage:", e);
        }
      }

      // Load chat history
      const storedChat = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
      if (storedChat) {
        try {
          const parsed = JSON.parse(storedChat);
          // Convert date strings back to Date objects
          const messages = parsed.map((msg: ChatMessage) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          }));
          setChatHistory(messages);
        } catch (e) {
          console.error("Failed to parse chat history from localStorage:", e);
        }
      }

      setIsHydrated(true);
    }
  }, []);

  // No-op: patient switching is disabled (logged-in user is the patient)
  const setActivePatient = useCallback((_patient: Patient | null) => {
    // Intentionally disabled - activePatient is fixed to demo user
  }, []);

  // Set chat patient context (persisted)
  const setChatPatientContext = useCallback((patient: ChatPatientContext | null) => {
    setChatPatientContextState(patient);
    if (typeof window !== "undefined") {
      if (patient) {
        localStorage.setItem(CHAT_PATIENT_CONTEXT_KEY, JSON.stringify(patient));
      } else {
        localStorage.removeItem(CHAT_PATIENT_CONTEXT_KEY);
      }
    }
  }, []);

  // Set custom patient (persisted)
  const setCustomPatient = useCallback((patient: ChatPatientContext | null) => {
    setCustomPatientState(patient);
    if (typeof window !== "undefined") {
      if (patient) {
        localStorage.setItem(CUSTOM_PATIENT_KEY, JSON.stringify(patient));
      } else {
        localStorage.removeItem(CUSTOM_PATIENT_KEY);
      }
    }
  }, []);

  // Add a session document (memory-only, prevents duplicates by name)
  const addSessionDocument = useCallback(
    (document: Omit<SessionDocument, "id" | "uploadedAt">) => {
      setSessionDocuments((prev) => {
        // Check if document with same name already exists
        const exists = prev.some((doc) => doc.name === document.name);
        if (exists) {
          return prev; // Don't add duplicate
        }

        const newDoc: SessionDocument = {
          ...document,
          id: crypto.randomUUID(),
          uploadedAt: new Date(),
        };
        return [...prev, newDoc];
      });
    },
    []
  );

  // Clear all session documents (memory-only)
  const clearSessionDocuments = useCallback(() => {
    setSessionDocuments([]);
  }, []);

  // Add a chat message
  const addChatMessage = useCallback(
    (message: Omit<ChatMessage, "id" | "timestamp">) => {
      const newMessage: ChatMessage = {
        ...message,
        id: crypto.randomUUID(),
        timestamp: new Date(),
      };
      setChatHistory((prev) => {
        const updated = [...prev, newMessage];
        if (typeof window !== "undefined") {
          localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(updated));
        }
        return updated;
      });
    },
    []
  );

  // Clear chat history
  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    }
  }, []);

  const value: PatientContextValue = {
    activePatient,
    setActivePatient,
    patients: MOCK_PATIENTS,
    chatPatientContext,
    setChatPatientContext,
    customPatient,
    setCustomPatient,
    samplePatients: SAMPLE_CHAT_PATIENTS,
    showPatientSelector,
    setShowPatientSelector,
    sessionDocuments,
    addSessionDocument,
    clearSessionDocuments,
    chatHistory,
    addChatMessage,
    clearChatHistory,
  };

  // Prevent hydration mismatch by rendering nothing until hydrated
  if (!isHydrated) {
    return null;
  }

  return (
    <PatientContext.Provider value={value}>{children}</PatientContext.Provider>
  );
}

// ============================================================================
// Settings Context
// ============================================================================

interface SettingsContextValue {
  settings: Settings;
  updateSystemPrompt: (prompt: string) => void;
  updateFeatureFlags: (flags: Partial<FeatureFlags>) => void;
  resetToDefaults: () => void;
  isFeatureEnabled: (flagName: keyof FeatureFlags) => boolean;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

const SETTINGS_STORAGE_KEY = "hospitall-settings";

function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Check version - if outdated, reset to defaults
          if (!parsed.version || parsed.version < SETTINGS_VERSION) {
            console.log(`Settings version outdated (${parsed.version || 'none'} < ${SETTINGS_VERSION}), resetting to defaults`);
            localStorage.removeItem(SETTINGS_STORAGE_KEY);
            // Keep defaults (already set in useState)
          } else {
            // Merge with defaults to ensure all fields exist
            setSettings({
              ...DEFAULT_SETTINGS,
              ...parsed,
              featureFlags: {
                ...DEFAULT_SETTINGS.featureFlags,
                ...parsed.featureFlags,
              },
            });
          }
        } catch (e) {
          console.error("Failed to parse settings from localStorage:", e);
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Helper to persist settings
  const persistSettings = useCallback((newSettings: Settings) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(newSettings));
    }
  }, []);

  // Update system prompt
  const updateSystemPrompt = useCallback(
    (prompt: string) => {
      setSettings((prev) => {
        const updated = { ...prev, systemPrompt: prompt };
        persistSettings(updated);
        return updated;
      });
    },
    [persistSettings]
  );

  // Update feature flags
  const updateFeatureFlags = useCallback(
    (flags: Partial<FeatureFlags>) => {
      setSettings((prev) => {
        const updated = {
          ...prev,
          featureFlags: { ...prev.featureFlags, ...flags },
        };
        persistSettings(updated);
        return updated;
      });
    },
    [persistSettings]
  );

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== "undefined") {
      localStorage.removeItem(SETTINGS_STORAGE_KEY);
    }
  }, []);

  // Check if a feature is enabled
  const isFeatureEnabled = useCallback(
    (flagName: keyof FeatureFlags) => {
      return settings.featureFlags[flagName] ?? false;
    },
    [settings.featureFlags]
  );

  const value: SettingsContextValue = {
    settings,
    updateSystemPrompt,
    updateFeatureFlags,
    resetToDefaults,
    isFeatureEnabled,
  };

  // Prevent hydration mismatch by rendering nothing until hydrated
  if (!isHydrated) {
    return null;
  }

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  );
}

// ============================================================================
// Combined AppProvider
// ============================================================================

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <RoleProvider>
      <SettingsProvider>
        <PatientProvider>{children}</PatientProvider>
      </SettingsProvider>
    </RoleProvider>
  );
}

// ============================================================================
// Context Hooks (internal exports for custom hooks)
// ============================================================================

export function useRoleContext(): RoleContextValue {
  const context = useContext(RoleContext);
  if (context === undefined) {
    throw new Error("useRoleContext must be used within a RoleProvider");
  }
  return context;
}

export function usePatientContext(): PatientContextValue {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error("usePatientContext must be used within a PatientProvider");
  }
  return context;
}

export function useSettingsContext(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettingsContext must be used within a SettingsProvider");
  }
  return context;
}

// Export types for use in hooks
export type {
  RoleContextValue,
  PatientContextValue,
  SettingsContextValue,
};
