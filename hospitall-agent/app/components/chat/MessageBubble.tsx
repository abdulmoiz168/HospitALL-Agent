'use client';

import React from 'react';
import styles from './MessageBubble.module.css';

export interface MessageBubbleProps {
  /** Message role - determines styling and alignment */
  role: 'user' | 'assistant';
  /** Message content text */
  content: string;
  /** Timestamp of the message */
  timestamp?: Date;
  /** Optional intent detected by the agent */
  intent?: string;
  /** Whether the message is still loading (streaming) */
  isLoading?: boolean;
  /** Whether the message is currently streaming content */
  isStreaming?: boolean;
  /** Whether there was an error with this message */
  isError?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats a Date object to a readable time string
 */
function formatTimestamp(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * MessageBubble component for displaying chat messages.
 * Supports user and assistant roles with distinct styling.
 * Features timestamps, loading states, and intent display.
 */
export const MessageBubble = React.forwardRef<HTMLDivElement, MessageBubbleProps>(
  (
    {
      role,
      content,
      timestamp,
      intent,
      isLoading = false,
      isStreaming = false,
      isError = false,
      className = '',
    },
    ref
  ) => {
    const bubbleClasses = [
      styles.messageBubble,
      styles[role],
      isError ? styles.error : '',
      isStreaming && content ? styles.streaming : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const roleLabel = role === 'user' ? 'You' : 'HospitALL';

    return (
      <div ref={ref} className={bubbleClasses} role="listitem">
        {/* Message header with role and timestamp */}
        <div className={styles.messageHeader}>
          <span className={styles.roleBadge}>{roleLabel}</span>
          {timestamp && (
            <span className={styles.timestamp}>{formatTimestamp(timestamp)}</span>
          )}
          {intent && role === 'assistant' && (
            <span className={styles.intentTag}>Intent: {intent}</span>
          )}
        </div>

        {/* Message content */}
        <div className={styles.content}>
          {isLoading && !content ? (
            <div className={styles.loading} aria-label="Loading response">
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          ) : (
            content
          )}
        </div>
      </div>
    );
  }
);

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
