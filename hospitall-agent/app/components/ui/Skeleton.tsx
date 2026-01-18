'use client';

import React from 'react';
import styles from './Skeleton.module.css';

export interface SkeletonProps {
  /** Width of the skeleton (CSS value) */
  width?: string | number;
  /** Height of the skeleton (CSS value) */
  height?: string | number;
  /** Border radius (CSS value or 'full' for circle) */
  borderRadius?: string | 'full';
  /** Additional CSS classes */
  className?: string;
}

/**
 * Base Skeleton component for loading states
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  borderRadius,
  className = '',
}) => {
  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;
  if (borderRadius === 'full') {
    style.borderRadius = '9999px';
  } else if (borderRadius) {
    style.borderRadius = borderRadius;
  }

  return (
    <div
      className={`${styles.skeleton} ${className}`}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  );
};

/**
 * Skeleton variant for text lines
 */
export const SkeletonText: React.FC<{ width?: string | number; className?: string }> = ({
  width = '100%',
  className = '',
}) => (
  <Skeleton
    width={width}
    className={`${styles.skeletonText} ${className}`}
  />
);

/**
 * Skeleton variant for title text
 */
export const SkeletonTitle: React.FC<{ width?: string | number; className?: string }> = ({
  width = '60%',
  className = '',
}) => (
  <Skeleton
    width={width}
    className={`${styles.skeletonTitle} ${className}`}
  />
);

/**
 * Skeleton variant for avatar/profile images
 */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 48,
  className = '',
}) => (
  <Skeleton
    width={size}
    height={size}
    borderRadius="full"
    className={`${styles.skeletonAvatar} ${className}`}
  />
);

/**
 * Skeleton variant for buttons
 */
export const SkeletonButton: React.FC<{ width?: string | number; className?: string }> = ({
  width = '100%',
  className = '',
}) => (
  <Skeleton
    width={width}
    className={`${styles.skeletonButton} ${className}`}
  />
);

/**
 * Skeleton for a summary card (dashboard)
 */
export const SkeletonSummaryCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${styles.skeletonSummaryCard} ${className}`}>
    <div className={styles.skeletonCardHeader}>
      <Skeleton width={40} height={40} borderRadius="8px" />
      <div style={{ flex: 1 }}>
        <SkeletonText width="40%" />
      </div>
    </div>
    <SkeletonTitle width="30%" />
    <SkeletonText width="80%" />
    <SkeletonText width="60%" />
  </div>
);

/**
 * Skeleton for a doctor card
 */
export const SkeletonDoctorCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`${styles.skeletonDoctorCard} ${className}`}>
    <div className={styles.skeletonDoctorHeader}>
      <SkeletonAvatar size={56} />
      <div className={styles.skeletonDoctorInfo}>
        <SkeletonTitle width="70%" />
        <SkeletonText width="50%" />
        <SkeletonText width="30%" />
      </div>
    </div>
    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
      <SkeletonButton width="60%" />
      <SkeletonButton width="40%" />
    </div>
  </div>
);

/**
 * Skeleton for chat message bubbles
 */
export const SkeletonMessage: React.FC<{
  role?: 'user' | 'assistant';
  className?: string;
}> = ({ role = 'assistant', className = '' }) => {
  const roleClass =
    role === 'user' ? styles.skeletonMessageUser : styles.skeletonMessageAssistant;

  return (
    <div className={`${styles.skeletonMessage} ${roleClass} ${className}`}>
      <SkeletonText width="90%" />
      <SkeletonText width="70%" />
      <SkeletonText width="50%" />
    </div>
  );
};

export default Skeleton;
