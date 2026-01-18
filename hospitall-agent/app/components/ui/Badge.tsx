'use client';

import React from 'react';
import styles from './Badge.module.css';

export type BadgeVariant =
  | 'default'
  | 'emergency'
  | 'urgent'
  | 'routine'
  | 'success'
  | 'warning'
  | 'info';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Size of the badge */
  size?: BadgeSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Badge component for status indicators and urgency levels.
 * Uses design tokens for consistent styling across the application.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { children, variant = 'default', size = 'md', className = '' },
    ref
  ) => {
    const badgeClasses = [styles.badge, styles[variant], styles[size], className]
      .filter(Boolean)
      .join(' ');

    // Map variants to ARIA labels for screen readers
    const ariaLabels: Record<BadgeVariant, string> = {
      default: '',
      emergency: 'Emergency priority',
      urgent: 'Urgent priority',
      routine: 'Routine priority',
      success: 'Success status',
      warning: 'Warning status',
      info: 'Information',
    };

    const ariaLabel = ariaLabels[variant];

    return (
      <span
        ref={ref}
        className={badgeClasses}
        role="status"
        aria-label={ariaLabel ? `${ariaLabel}: ${children}` : undefined}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
