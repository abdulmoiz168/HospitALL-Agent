'use client';

import React from 'react';
import styles from './Card.module.css';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardShadow = 'none' | 'sm' | 'md' | 'lg';
export type CardRounded = 'sm' | 'md' | 'lg';

export interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Internal padding */
  padding?: CardPadding;
  /** Shadow depth */
  shadow?: CardShadow;
  /** Border radius */
  rounded?: CardRounded;
}

export interface CardHeaderProps {
  /** Header content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardBodyProps {
  /** Body content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

export interface CardFooterProps {
  /** Footer content */
  children: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Card component - A surface container with optional header, body, and footer.
 * Uses design tokens for shadows, radius, and spacing.
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      className = '',
      padding = 'md',
      shadow = 'sm',
      rounded = 'lg',
    },
    ref
  ) => {
    const cardClasses = [
      styles.card,
      styles[`padding-${padding}`],
      styles[`shadow-${shadow}`],
      styles[`rounded-${rounded}`],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={cardClasses}>
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader - Header section of the card
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '' }, ref) => {
    const headerClasses = [styles.header, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={headerClasses}>
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

/**
 * CardBody - Main content section of the card
 */
export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ children, className = '' }, ref) => {
    const bodyClasses = [styles.body, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={bodyClasses}>
        {children}
      </div>
    );
  }
);

CardBody.displayName = 'CardBody';

/**
 * CardFooter - Footer section of the card
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '' }, ref) => {
    const footerClasses = [styles.footer, className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={footerClasses}>
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
