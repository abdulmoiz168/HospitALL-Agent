'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import styles from './ChatInput.module.css';

export interface QuickAction {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Message to send when clicked */
  message: string;
}

export interface ChatInputProps {
  /** Current input value (controlled) */
  value?: string;
  /** Called when input value changes */
  onChange?: (value: string) => void;
  /** Called when user submits a message */
  onSend: (message: string) => void;
  /** Called when upload button is clicked */
  onUploadClick?: () => void;
  /** Whether the chat is currently loading/sending */
  isLoading?: boolean;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Quick action chips to display */
  quickActions?: QuickAction[];
  /** Additional CSS classes */
  className?: string;
}

/** Default quick actions for the chat */
const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'symptoms', label: 'Check symptoms', message: 'I would like to check my symptoms' },
  { id: 'doctor', label: 'Find a doctor', message: 'I need to find a doctor for my condition' },
];

/**
 * ChatInput component with textarea, send button, quick actions, and upload trigger.
 * Supports controlled input and auto-resizing textarea.
 */
export const ChatInput = React.forwardRef<HTMLDivElement, ChatInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      onSend,
      onUploadClick,
      isLoading = false,
      disabled = false,
      placeholder = 'Describe your symptoms, ask about medications, or upload documents...',
      quickActions = DEFAULT_QUICK_ACTIONS,
      className = '',
    },
    ref
  ) => {
    // Internal state for uncontrolled mode
    const [internalValue, setInternalValue] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Determine if controlled
    const isControlled = controlledValue !== undefined;
    const inputValue = isControlled ? controlledValue : internalValue;

    // Auto-resize textarea
    const autoResize = useCallback(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
      }
    }, []);

    useEffect(() => {
      autoResize();
    }, [inputValue, autoResize]);

    // Handle input change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        if (isControlled) {
          onChange?.(newValue);
        } else {
          setInternalValue(newValue);
        }
      },
      [isControlled, onChange]
    );

    // Handle form submit
    const handleSubmit = useCallback(
      (e?: React.FormEvent) => {
        e?.preventDefault();
        const trimmedValue = inputValue.trim();
        if (trimmedValue && !isLoading && !disabled) {
          onSend(trimmedValue);
          if (!isControlled) {
            setInternalValue('');
          }
          // Reset textarea height
          if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
          }
        }
      },
      [inputValue, isLoading, disabled, onSend, isControlled]
    );

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      },
      [handleSubmit]
    );

    // Handle quick action click
    const handleQuickAction = useCallback(
      (action: QuickAction) => {
        if (!isLoading && !disabled) {
          onSend(action.message);
        }
      },
      [isLoading, disabled, onSend]
    );

    const canSend = inputValue.trim().length > 0 && !isLoading && !disabled;

    const wrapperClasses = [styles.chatInputWrapper, className]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={wrapperClasses}>
        {/* Quick action chips */}
        {quickActions.length > 0 && (
          <div className={styles.quickActions} role="group" aria-label="Quick actions">
            {quickActions.map((action) => (
              <button
                key={action.id}
                type="button"
                className={styles.quickActionChip}
                onClick={() => handleQuickAction(action)}
                disabled={isLoading || disabled}
                aria-label={action.label}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input row */}
        <form onSubmit={handleSubmit} className={styles.inputRow}>
          <div className={styles.textareaWrapper}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              value={inputValue}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              aria-label="Chat message input"
            />
            {onUploadClick && (
              <button
                type="button"
                className={styles.uploadTrigger}
                onClick={onUploadClick}
                disabled={disabled || isLoading}
                aria-label="Upload document"
                title="Upload document"
              >
                <svg
                  className={styles.uploadIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          <button
            type="submit"
            className={styles.sendButton}
            disabled={!canSend}
            aria-label={isLoading ? 'Sending message' : 'Send message'}
          >
            {isLoading ? (
              <svg
                className={styles.loadingSpinner}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeOpacity="0.3"
                />
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            ) : (
              <svg
                className={styles.sendIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
        </form>

        {/* Branding */}
        <div className={styles.branding}>
          Powered by <span className={styles.brandingName}>Genaima AI</span>
        </div>
      </div>
    );
  }
);

ChatInput.displayName = 'ChatInput';

export default ChatInput;
