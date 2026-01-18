'use client';

import React, { useState } from 'react';
import styles from './Avatar.module.css';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  /** Image source URL */
  src?: string;
  /** Alt text for the image */
  alt?: string;
  /** Name for generating initials fallback */
  name?: string;
  /** Size of the avatar */
  size?: AvatarSize;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Generates initials from a name string.
 * Takes the first letter of the first two words.
 */
function getInitials(name: string): string {
  if (!name) return '';

  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].charAt(0).toUpperCase();
  }

  return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
}

/**
 * Generates a consistent background color based on name.
 * Returns a CSS variable name for the color.
 */
function getColorFromName(name: string): string {
  if (!name) return 'var(--secondary-400)';

  const colors = [
    'var(--primary-500)',
    'var(--primary-600)',
    'var(--primary-700)',
    'var(--info)',
    'var(--success)',
    'var(--urgency-urgent)',
    'var(--urgency-routine)',
  ];

  // Simple hash function
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Avatar component for patient/doctor profile images with initials fallback.
 * Uses design tokens for consistent styling across the application.
 */
export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = '',
      name = '',
      size = 'md',
      className = '',
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const showImage = src && !imageError;
    const initials = getInitials(name);
    const backgroundColor = getColorFromName(name);

    const avatarClasses = [styles.avatar, styles[size], className]
      .filter(Boolean)
      .join(' ');

    const handleImageError = () => {
      setImageError(true);
    };

    // Use initials for aria-label to avoid exposing full names in accessibility logs
    // In healthcare apps, full names could be logged by assistive technology
    const accessibleLabel = alt || (initials ? `Patient ${initials}` : 'User avatar');

    return (
      <div
        ref={ref}
        className={avatarClasses}
        style={!showImage ? { backgroundColor } : undefined}
        role="img"
        aria-label={accessibleLabel}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name}
            className={styles.image}
            onError={handleImageError}
          />
        ) : (
          <span className={styles.initials} aria-hidden="true">
            {initials || '?'}
          </span>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export default Avatar;
