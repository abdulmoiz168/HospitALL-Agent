'use client';

import React, { useId } from 'react';
import styles from './Input.module.css';

export type InputType = 'text' | 'email' | 'password' | 'number' | 'textarea';

export interface InputProps
  extends Omit<
    React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement>,
    'type'
  > {
  /** Label text for the input */
  label?: string;
  /** Error message to display */
  error?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Current value */
  value?: string | number;
  /** Change handler */
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  /** Input type */
  type?: InputType;
  /** Whether the input is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Number of rows for textarea */
  rows?: number;
}

/**
 * Input component with label and error state support.
 * Supports text, email, password, number, and textarea types.
 * Uses design tokens for consistent styling across the application.
 */
export const Input = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputProps
>(
  (
    {
      label,
      error,
      placeholder,
      value,
      onChange,
      type = 'text',
      disabled = false,
      className = '',
      rows = 4,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;

    const wrapperClasses = [styles.wrapper, className].filter(Boolean).join(' ');

    const inputClasses = [
      styles.input,
      error ? styles.inputError : '',
      disabled ? styles.inputDisabled : '',
    ]
      .filter(Boolean)
      .join(' ');

    const sharedProps = {
      id: inputId,
      className: inputClasses,
      placeholder,
      value,
      onChange,
      disabled,
      'aria-invalid': error ? true : undefined,
      'aria-describedby': error ? errorId : undefined,
      ...props,
    };

    return (
      <div className={wrapperClasses}>
        {label && (
          <label htmlFor={inputId} className={styles.label}>
            {label}
          </label>
        )}

        {type === 'textarea' ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            rows={rows}
            {...(sharedProps as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            type={type}
            {...(sharedProps as React.InputHTMLAttributes<HTMLInputElement>)}
          />
        )}

        {error && (
          <span id={errorId} className={styles.error} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
