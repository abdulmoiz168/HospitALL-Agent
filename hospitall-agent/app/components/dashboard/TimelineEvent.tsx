'use client';

import React from 'react';
import { Badge, BadgeVariant } from '@/app/components/ui/Badge';
import styles from './TimelineEvent.module.css';

export type TimelineEventType =
  | 'visit'
  | 'lab_result'
  | 'upload'
  | 'medication'
  | 'appointment'
  | 'message'
  | 'default';

export interface TimelineEventProps {
  /** Event title or heading */
  title: string;
  /** Event date */
  date: string | Date;
  /** Event type for icon and styling */
  type: TimelineEventType;
  /** Brief summary or description */
  summary: string;
  /** Optional badge text */
  badge?: string;
  /** Badge variant */
  badgeVariant?: BadgeVariant;
  /** Optional click handler to view details */
  onClick?: () => void;
  /** Whether this is the last item (hides connector line) */
  isLast?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats a date for display in the timeline
 */
function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Returns the appropriate icon for the event type
 */
function getEventIcon(type: TimelineEventType): React.ReactNode {
  switch (type) {
    case 'visit':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M16 2V6M8 2V6M3 10H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'lab_result':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M14.5 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7.5L14.5 2Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'upload':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 8L12 3L7 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'medication':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M10.5 20.5L3.5 13.5C2.83696 12.837 2.46447 11.9385 2.46447 11C2.46447 10.0616 2.83696 9.16304 3.5 8.50001L8.5 3.50001C9.16304 2.83696 10.0616 2.46448 11 2.46448C11.9385 2.46448 12.837 2.83696 13.5 3.50001L20.5 10.5C21.163 11.163 21.5355 12.0616 21.5355 13C21.5355 13.9385 21.163 14.837 20.5 15.5L15.5 20.5C14.837 21.163 13.9385 21.5355 13 21.5355C12.0616 21.5355 11.163 21.163 10.5 20.5Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M7 17L17 7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'appointment':
      return (
        <svg
          width="16"
          height="16"
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
            strokeWidth="2"
          />
          <path
            d="M12 6V12L16 14"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case 'message':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle
            cx="12"
            cy="12"
            r="4"
            stroke="currentColor"
            strokeWidth="2"
          />
        </svg>
      );
  }
}

/**
 * TimelineEvent component - Displays a single event in the timeline.
 * Shows date, type icon, title, summary, and optional badge.
 * Uses design tokens for consistent styling.
 */
export const TimelineEvent = React.forwardRef<HTMLDivElement, TimelineEventProps>(
  (
    {
      title,
      date,
      type,
      summary,
      badge,
      badgeVariant = 'default',
      onClick,
      isLast = false,
      className = '',
    },
    ref
  ) => {
    const eventClasses = [
      styles.timelineEvent,
      styles[`type-${type}`],
      onClick ? styles.clickable : '',
      isLast ? styles.isLast : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const formattedDate = formatDate(date);

    const handleClick = onClick ? () => onClick() : undefined;
    const handleKeyDown = onClick
      ? (e: React.KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }
      : undefined;

    return (
      <div
        ref={ref}
        className={eventClasses}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role={onClick ? 'button' : undefined}
        tabIndex={onClick ? 0 : undefined}
      >
        {/* Timeline Line */}
        <div className={styles.timeline}>
          <div className={styles.iconWrapper}>
            {getEventIcon(type)}
          </div>
          {!isLast && <div className={styles.connector} />}
        </div>

        {/* Event Content */}
        <div className={styles.content}>
          <div className={styles.header}>
            <span className={styles.date}>{formattedDate}</span>
            {badge && (
              <Badge variant={badgeVariant} size="sm">
                {badge}
              </Badge>
            )}
          </div>
          <h4 className={styles.title}>{title}</h4>
          <p className={styles.summary}>{summary}</p>
        </div>

        {/* Arrow indicator for clickable items */}
        {onClick && (
          <div className={styles.arrow}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9 18L15 12L9 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        )}
      </div>
    );
  }
);

TimelineEvent.displayName = 'TimelineEvent';

export default TimelineEvent;
