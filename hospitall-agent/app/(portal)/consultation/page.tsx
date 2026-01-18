'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePatient } from '@/lib/hooks';
import {
  MessageBubble,
  ChatInput,
  DocumentUpload,
  DoctorCard,
} from '@/app/components/chat';
import { MOCK_DOCTORS } from '@/mastra/data/doctors';
import type { Doctor } from '@/mastra/schemas/doctor';
import styles from './page.module.css';

/**
 * Session ID generator for chat sessions
 */
const generateSessionId = () => `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

/**
 * Enhanced Chat Page for the HospitALL Portal
 *
 * Features:
 * - Patient context indicator at the top
 * - Chat messages with user/assistant bubbles and timestamps
 * - Real-time streaming from /api/chat endpoint
 * - Document upload functionality with analysis
 * - Quick action chips
 * - Doctor recommendation cards (inline)
 * - Auto-scroll to latest messages
 */
export default function ChatPage() {
  // Patient context from global state
  const {
    activePatient,
    chatHistory,
    addChatMessage,
    clearChatHistory,
    sessionDocuments,
    addSessionDocument,
  } = usePatient();

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [showDoctorRecommendations, setShowDoctorRecommendations] = useState(false);
  const [recommendedDoctors, setRecommendedDoctors] = useState<Doctor[]>([]);
  const [sessionId] = useState(() => generateSessionId());

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const welcomeMessageSentRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Constants
  const FETCH_TIMEOUT_MS = 60000; // 60 second timeout

  // Get full name from patient demographics
  const patientFullName = useMemo(() => {
    if (!activePatient) return '';
    return `${activePatient.demographics.firstName} ${activePatient.demographics.lastName}`;
  }, [activePatient]);

  // Cleanup abort controller on unmount or patient change
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, [activePatient?.demographics.id]);

  // Initialize with welcome message if no chat history (only once per patient)
  useEffect(() => {
    if (chatHistory.length === 0 && activePatient && !welcomeMessageSentRef.current) {
      welcomeMessageSentRef.current = true;
      addChatMessage({
        role: 'assistant',
        content: `Hello ${activePatient.demographics.firstName}! I'm your HospitALL health assistant. How can I help you today? You can describe your symptoms, ask about medications, or upload medical documents for analysis.`,
      });
    }
    // Reset the ref when patient changes
    if (!activePatient) {
      welcomeMessageSentRef.current = false;
    }
  }, [activePatient, chatHistory.length, addChatMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Track scroll position for "scroll to bottom" button
  useEffect(() => {
    const messagesArea = messagesAreaRef.current;
    if (!messagesArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = messagesArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollButton(!isNearBottom && chatHistory.length > 3);
    };

    messagesArea.addEventListener('scroll', handleScroll);
    return () => messagesArea.removeEventListener('scroll', handleScroll);
  }, [chatHistory.length]);

  // Scroll to bottom handler
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Handle sending a message with streaming API integration
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || isLoading || isStreaming) return;

      // Add user message
      addChatMessage({
        role: 'user',
        content: message,
      });

      setInputValue('');
      setIsLoading(true);
      setIsStreaming(true);
      setStreamingContent('');

      // Check if user is asking about finding a doctor (for showing recommendation cards)
      const lowerMessage = message.toLowerCase();
      const isDoctorRequest =
        lowerMessage.includes('find doctor') ||
        lowerMessage.includes('find a doctor') ||
        lowerMessage.includes('recommend doctor') ||
        lowerMessage.includes('need a doctor') ||
        lowerMessage.includes('specialist');

      try {
        // Cancel any previous request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        // Create timeout
        const timeoutId = setTimeout(() => {
          abortControllerRef.current?.abort();
        }, FETCH_TIMEOUT_MS);

        // Call the actual /api/chat endpoint
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            sessionId,
            patientId: activePatient?.demographics.id,
          }),
          signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Handle streaming response (NDJSON format)
        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('No response stream available');
        }

        const decoder = new TextDecoder();
        let accumulatedContent = '';
        let meta: Record<string, unknown> = {};

        // Read the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(Boolean);

          for (const line of lines) {
            try {
              const parsed = JSON.parse(line);

              if (parsed.type === 'chunk' && parsed.content) {
                accumulatedContent += parsed.content;
                setStreamingContent(accumulatedContent);
              } else if (parsed.type === 'done') {
                meta = parsed.meta || {};
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }

        // Add the complete assistant message
        addChatMessage({
          role: 'assistant',
          content: accumulatedContent || 'I apologize, but I was unable to generate a response.',
        });

        // Show doctor recommendations if this was a doctor-related request
        if (isDoctorRequest) {
          const doctors = MOCK_DOCTORS.slice(0, 3);
          setRecommendedDoctors(doctors);
          setShowDoctorRecommendations(true);
        } else {
          setShowDoctorRecommendations(false);
        }
      } catch (error) {
        // Don't show error message if request was aborted (e.g., patient switched)
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('Chat request aborted');
          return;
        }

        console.error('Chat API error:', error);

        // Check if it's a timeout
        const isTimeout = error instanceof Error && error.message.includes('aborted');
        addChatMessage({
          role: 'assistant',
          content: isTimeout
            ? 'The request timed out. Please try again.'
            : 'I apologize, but I encountered an error processing your request. Please try again.',
        });
      } finally {
        abortControllerRef.current = null;
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingContent('');
      }
    },
    [isLoading, isStreaming, addChatMessage, sessionId, activePatient]
  );

  // Handle document upload - uploads to /api/documents/upload
  const handleUpload = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', activePatient?.demographics.id || '');
      formData.append('autoAnalyze', 'false'); // Just upload, don't auto-analyze

      try {
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.status}`);
        }

        // Add to session documents
        addSessionDocument({
          name: file.name,
          type: file.type,
        });
      } catch (error) {
        console.error('Document upload error:', error);
        throw error; // Re-throw to let DocumentUpload handle the error state
      }
    },
    [addSessionDocument, activePatient]
  );

  // Handle document analysis - uploads and analyzes via /api/documents/upload
  const handleAnalyze = useCallback(
    async (file: File) => {
      setIsUploadOpen(false);
      setIsLoading(true);

      // Add message about the upload
      addChatMessage({
        role: 'user',
        content: `I've uploaded a document for analysis: ${file.name}`,
      });

      // Add to session documents
      addSessionDocument({
        name: file.name,
        type: file.type,
      });

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('patientId', activePatient?.demographics.id || '');
        formData.append('autoAnalyze', 'true');

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.status}`);
        }

        const result = await response.json();

        // Build analysis response
        let analysisContent = `I've analyzed your document "${file.name}".\n\n`;

        if (result.summary) {
          analysisContent += `**Summary:**\n${result.summary}\n\n`;
        }

        if (result.analysis) {
          if (result.analysis.findings && result.analysis.findings.length > 0) {
            analysisContent += `**Key Findings:**\n`;
            result.analysis.findings.forEach((finding: { name: string; value: string; interpretation?: string }, i: number) => {
              analysisContent += `${i + 1}. ${finding.name}: ${finding.value}`;
              if (finding.interpretation) {
                analysisContent += ` - ${finding.interpretation}`;
              }
              analysisContent += '\n';
            });
            analysisContent += '\n';
          }

          if (result.analysis.recommendations && result.analysis.recommendations.length > 0) {
            analysisContent += `**Recommendations:**\n`;
            result.analysis.recommendations.forEach((rec: string, i: number) => {
              analysisContent += `${i + 1}. ${rec}\n`;
            });
          }
        }

        if (result.warnings && result.warnings.length > 0) {
          analysisContent += `\n**Notes:** ${result.warnings.join(', ')}`;
        }

        analysisContent += '\n\nIs there anything specific about this document you would like me to explain further?';

        addChatMessage({
          role: 'assistant',
          content: analysisContent,
        });
      } catch (error) {
        console.error('Document analysis error:', error);
        addChatMessage({
          role: 'assistant',
          content: `I've received your document "${file.name}" but encountered an issue during analysis. Please try again or describe the document contents in your message.`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [addChatMessage, addSessionDocument, activePatient]
  );

  // Handle clear history
  const handleClearHistory = useCallback(() => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      clearChatHistory();
      setShowDoctorRecommendations(false);
    }
  }, [clearChatHistory]);

  // Handle doctor booking
  const handleBookDoctor = useCallback(
    (doctor: Doctor) => {
      addChatMessage({
        role: 'user',
        content: `I'd like to book an appointment with Dr. ${doctor.firstName} ${doctor.lastName}.`,
      });

      setTimeout(() => {
        addChatMessage({
          role: 'assistant',
          content: `I'll help you schedule an appointment with Dr. ${doctor.firstName} ${doctor.lastName}.\n\nTheir next available slot is displayed on their card. To confirm the booking, I'll need:\n\n1. Your preferred date and time\n2. Reason for visit\n3. Insurance information (if applicable)\n\nWould you like to proceed with scheduling?`,
        });
      }, 800);
    },
    [addChatMessage]
  );

  // Get patient initials
  const patientInitials = useMemo(() => {
    if (!activePatient) return '';
    const firstName = activePatient.demographics.firstName;
    const lastName = activePatient.demographics.lastName;
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }, [activePatient]);

  // Calculate patient age
  const patientAge = useMemo(() => {
    if (!activePatient) return 0;
    const birthDate = new Date(activePatient.demographics.dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }, [activePatient]);

  return (
    <div className={styles.chatPage}>
      {/* Patient Context Header */}
      {activePatient ? (
        <div className={styles.patientContext}>
          <div className={styles.patientInfo}>
            <div className={styles.patientAvatar}>{patientInitials}</div>
            <div className={styles.patientDetails}>
              <h2 className={styles.patientName}>{patientFullName}</h2>
              <div className={styles.patientMeta}>
                <span>{patientAge} years old</span>
                <span>|</span>
                <span>{activePatient.demographics.sex}</span>
                <span className={styles.contextBadge}>
                  <span className={styles.contextDot} />
                  Patient Context Active
                </span>
              </div>
            </div>
          </div>
          <div className={styles.contextActions}>
            <button
              type="button"
              className={styles.clearHistoryButton}
              onClick={handleClearHistory}
            >
              Clear Chat
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.noPatient}>
          <svg
            className={styles.noPatientIcon}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle
              cx="12"
              cy="7"
              r="4"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <h3 className={styles.noPatientTitle}>No Patient Selected</h3>
          <p className={styles.noPatientText}>
            Please select a patient from the profile selector in the header to start a
            consultation session.
          </p>
          <Link href="/dashboard" className={styles.selectPatientButton}>
            Go to Dashboard
          </Link>
        </div>
      )}

      {/* Main Chat Container */}
      {activePatient && (
        <div className={styles.chatContainer}>
          {/* Session Documents Indicator */}
          {sessionDocuments.length > 0 && (
            <div className={styles.sessionDocuments}>
              {sessionDocuments.map((doc) => (
                <span key={doc.id} className={styles.documentChip}>
                  <svg
                    className={styles.documentIcon}
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M14 2V8H20"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {doc.name}
                </span>
              ))}
            </div>
          )}

          {/* Messages Area */}
          <div ref={messagesAreaRef} className={styles.messagesArea} role="log">
            {chatHistory.length === 0 ? (
              <div className={styles.messagesEmpty}>
                <svg
                  className={styles.messagesEmptyIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className={styles.messagesEmptyText}>
                  Start a conversation by typing a message or using one of the quick
                  actions below.
                </p>
              </div>
            ) : (
              <>
                {chatHistory.map((message) => (
                  <MessageBubble
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}

                {/* Doctor Recommendations (shown inline after relevant messages) */}
                {showDoctorRecommendations && recommendedDoctors.length > 0 && (
                  <div className={styles.doctorRecommendations}>
                    <h4 className={styles.doctorRecommendationsTitle}>
                      Recommended Doctors
                    </h4>
                    <div className={styles.doctorCards}>
                      {recommendedDoctors.map((doctor) => (
                        <DoctorCard
                          key={doctor.id}
                          doctor={doctor}
                          recommendationReason="Matches your specialty requirements and has excellent patient reviews."
                          onBook={handleBookDoctor}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Streaming/Loading indicator */}
                {(isStreaming || isLoading) && (
                  <MessageBubble
                    role="assistant"
                    content={streamingContent}
                    isLoading={isLoading && !streamingContent}
                    isStreaming={isStreaming && !!streamingContent}
                  />
                )}
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          <button
            type="button"
            className={`${styles.scrollToBottom} ${showScrollButton ? styles.visible : ''}`}
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <svg
              className={styles.scrollIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5V19M12 19L5 12M12 19L19 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            New messages
          </button>

          {/* Chat Input */}
          <ChatInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSendMessage}
            onUploadClick={() => setIsUploadOpen(true)}
            isLoading={isLoading}
            disabled={!activePatient}
          />
        </div>
      )}

      {/* Document Upload Modal */}
      <DocumentUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUpload}
        onAnalyze={handleAnalyze}
      />
    </div>
  );
}
