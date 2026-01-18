"use client";

import {
  usePatientContext,
  SessionDocument,
  ChatMessage,
} from "@/lib/context/app-context";
import { Patient } from "@/mastra/schemas/patient";

/**
 * Hook for managing patient state, session documents, and chat history.
 *
 * @returns {Object} Patient management functions and state
 * @returns {Patient | null} activePatient - The currently selected patient
 * @returns {function} setActivePatient - Function to set the active patient
 * @returns {Patient[]} patients - Array of all available mock patients
 * @returns {SessionDocument[]} sessionDocuments - Documents uploaded in current session
 * @returns {function} addSessionDocument - Add a new document to the session
 * @returns {function} clearSessionDocuments - Clear all session documents
 * @returns {ChatMessage[]} chatHistory - Current chat messages
 * @returns {function} addChatMessage - Add a new message to chat history
 * @returns {function} clearChatHistory - Clear all chat messages
 *
 * @example
 * ```tsx
 * const {
 *   activePatient,
 *   setActivePatient,
 *   patients,
 *   sessionDocuments,
 *   addSessionDocument,
 *   chatHistory,
 *   addChatMessage,
 * } = usePatient();
 *
 * // Select a patient
 * setActivePatient(patients[0]);
 *
 * // Add a document
 * addSessionDocument({ name: "report.pdf", type: "application/pdf" });
 *
 * // Add a chat message
 * addChatMessage({ role: "user", content: "What are my medications?" });
 * ```
 */
export function usePatient(): {
  activePatient: Patient | null;
  setActivePatient: (patient: Patient | null) => void;
  patients: Patient[];
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
    sessionDocuments,
    addSessionDocument,
    clearSessionDocuments,
    chatHistory,
    addChatMessage,
    clearChatHistory,
  };
}

// Re-export types for convenience
export type { SessionDocument, ChatMessage };
