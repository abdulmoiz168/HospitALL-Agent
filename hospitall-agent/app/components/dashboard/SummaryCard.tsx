'use client';

import React from 'react';
import { Card } from '@/app/components/ui/Card';
import { Badge, BadgeVariant } from '@/app/components/ui/Badge';
import styles from './SummaryCard.module.css';

export type SummaryCardVariant = 'default' | 'health' | 'medications' | 'labs' | 'upcoming';

export interface SummaryCardProps {
  /** Card title */
  title: string;
  /** Main value or metric to display */
  value: string | number;
  /** Optional subtitle or label for the value */
  valueLabel?: string;
  /** Optional description or additional info */
  description?: string;
  /** Optional badge text */
  badge?: string;
  /** Badge variant */
  badgeVariant?: BadgeVariant;
  /** Icon to display (as a React element) */
  icon?: React.ReactNode;
  /** Card variant for styling */
  variant?: SummaryCardVariant;
  /** Optional click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * SummaryCard component - Displays a summary metric card for the dashboard.
 * Features an icon, title, main value, optional description, and badge.
 * Uses design tokens for consistent styling.
 */
export const SummaryCard = React.forwardRef<HTMLDivElement, SummaryCardProps>(
  (
    {
      title,
      value,
      valueLabel,
      description,
      badge,
      badgeVariant = 'default',
      icon,
      variant = 'default',
      onClick,
      className = '',
    },
    ref
  ) => {
    const cardClasses = [
      styles.summaryCard,
      styles[`variant-${variant}`],
      onClick ? styles.clickable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

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
      <Card
        ref={ref}
        padding="none"
        shadow="sm"
        rounded="lg"
        className={cardClasses}
      >
        <div
          className={styles.cardInner}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role={onClick ? 'button' : undefined}
          tabIndex={onClick ? 0 : undefined}
        >
          {/* Icon Section */}
          {icon && (
            <div className={styles.iconContainer}>
              <div className={styles.icon}>{icon}</div>
            </div>
          )}

          {/* Content Section */}
          <div className={styles.content}>
            <div className={styles.header}>
              <h3 className={styles.title}>{title}</h3>
              {badge && (
                <Badge variant={badgeVariant} size="sm">
                  {badge}
                </Badge>
              )}
            </div>

            <div className={styles.valueSection}>
              <span className={styles.value}>{value}</span>
              {valueLabel && <span className={styles.valueLabel}>{valueLabel}</span>}
            </div>

            {description && (
              <p className={styles.description}>{description}</p>
            )}
          </div>
        </div>
      </Card>
    );
  }
);

SummaryCard.displayName = 'SummaryCard';

export default SummaryCard;
