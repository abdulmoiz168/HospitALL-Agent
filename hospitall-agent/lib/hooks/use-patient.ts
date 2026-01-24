"use client";

import {
  usePatientContext,
  SessionDocument,
  ChatMessage,
  ChatPatientContext,
} from "@/lib/context/app-context";
import { Patient } from "@/mastra/schemas/patient";

/**
 * Hook for managing patient state, session documents, and chat history.
 */
export function usePatient(): {
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
} {
  const {
    activePatient,
    setActivePatient,
    patients,
    chatPatientContext,
    setChatPatientContext,
    customPatient,
    setCustomPatient,
    samplePatients,
    showPatientSelector,
    setShowPatientSelector,
    sessionDocuments,
    addSessionDocument,
    clearSessionDocuments,
    chatHistory,
    addChatMessage,
    clearChatHistory,
  } = usePatientContext();

  return {
    activePatient,
    setActivePatient,
    patients,
    chatPatientContext,
    setChatPatientContext,
    customPatient,
    setCustomPatient,
    samplePatients,
    showPatientSelector,
    setShowPatientSelector,
    sessionDocuments,
    addSessionDocument,
    clearSessionDocuments,
    chatHistory,
    addChatMessage,
    clearChatHistory,
  };
}

// Re-export types for convenience
export type { SessionDocument, ChatMessage, ChatPatientContext };
