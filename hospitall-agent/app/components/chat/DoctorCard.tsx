'use client';

import React, { useState } from 'react';
import styles from './DoctorCard.module.css';
import type { Doctor } from '@/mastra/schemas/doctor';

export interface DoctorCardProps {
  /** Doctor data object */
  doctor: Doctor;
  /** Display variant */
  variant?: 'default' | 'compact';
  /** Recommendation reason from the AI */
  recommendationReason?: string;
  /** Called when book appointment is clicked */
  onBook?: (doctor: Doctor) => void;
  /** Called when view profile is clicked */
  onViewProfile?: (doctor: Doctor) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Formats specialty string to human-readable form
 */
function formatSpecialty(specialty: string): string {
  return specialty
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Gets initials from a name
 */
function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/**
 * Gets next available day from doctor availability
 */
function getNextAvailableDay(doctor: Doctor): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const today = new Date().getDay();

  // Find the next available day
  for (let i = 0; i < 7; i++) {
    const checkDay = days[(today + i) % 7];
    const slot = doctor.availability.find((s) => s.dayOfWeek === checkDay);
    if (slot) {
      if (i === 0) return `Today, ${slot.startTime}`;
      if (i === 1) return `Tomorrow, ${slot.startTime}`;
      return `${checkDay.charAt(0).toUpperCase() + checkDay.slice(1)}, ${slot.startTime}`;
    }
  }

  return 'Schedule unavailable';
}

/**
 * Renders star rating
 */
function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {/* Full stars */}
      {Array.from({ length: fullStars }).map((_, i) => (
        <svg
          key={`full-${i}`}
          className={styles.star}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ))}
      {/* Half star */}
      {hasHalfStar && (
        <svg
          className={styles.star}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="halfGradient">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="var(--secondary-300)" />
            </linearGradient>
          </defs>
          <path
            d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
            fill="url(#halfGradient)"
          />
        </svg>
      )}
      {/* Empty stars */}
      {Array.from({ length: emptyStars }).map((_, i) => (
        <svg
          key={`empty-${i}`}
          className={`${styles.star} ${styles.starEmpty}`}
          viewBox="0 0 24 24"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
      ))}
    </div>
  );
}

/**
 * DoctorCard component for displaying doctor recommendations in chat.
 * Shows avatar, name, specialty, rating, availability, and booking action.
 */
export const DoctorCard = React.forwardRef<HTMLDivElement, DoctorCardProps>(
  (
    {
      doctor,
      variant = 'default',
      recommendationReason,
      onBook,
      onViewProfile,
      className = '',
    },
    ref
  ) => {
    const [imageError, setImageError] = useState(false);

    const fullName = `Dr. ${doctor.firstName} ${doctor.lastName}`;
    const initials = getInitials(doctor.firstName, doctor.lastName);
    const nextAvailable = getNextAvailableDay(doctor);

    const cardClasses = [
      styles.doctorCard,
      variant === 'compact' ? styles.compact : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={cardClasses} role="article" aria-label={`Doctor: ${fullName}`}>
        {/* Header with avatar and main info */}
        <div className={styles.header}>
          {/* Avatar */}
          <div className={styles.avatar}>
            {doctor.imageUrl && !imageError ? (
              <img
                src={doctor.imageUrl}
                alt={fullName}
                className={styles.avatarImage}
                onError={() => setImageError(true)}
              />
            ) : (
              <div className={styles.avatarFallback}>{initials}</div>
            )}
          </div>

          {/* Info */}
          <div className={styles.info}>
            <h3 className={styles.name}>{fullName}</h3>

            {/* Credentials */}
            {doctor.credentials && doctor.credentials.length > 0 && (
              <div className={styles.credentials}>
                {doctor.credentials.map((cred) => (
                  <span key={cred} className={styles.credential}>
                    {cred}
                  </span>
                ))}
              </div>
            )}

            {/* Specialty */}
            <span className={styles.specialty}>
              {formatSpecialty(doctor.specialty)}
              {doctor.subSpecialties && doctor.subSpecialties.length > 0 && (
                <> - {doctor.subSpecialties[0]}</>
              )}
            </span>

            {/* Rating */}
            <div className={styles.rating}>
              <StarRating rating={doctor.rating} />
              <span className={styles.ratingValue}>{doctor.rating.toFixed(1)}</span>
              {doctor.reviewCount && (
                <span className={styles.reviewCount}>
                  ({doctor.reviewCount} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details section (not shown in compact mode) */}
        {variant !== 'compact' && (
          <div className={styles.details}>
            {/* Next available */}
            <div className={styles.detailRow}>
              <svg
                className={styles.detailIcon}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Next available: {nextAvailable}</span>
            </div>

            {/* Experience */}
            {doctor.yearsOfExperience && (
              <div className={styles.detailRow}>
                <svg
                  className={styles.detailIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M22 11.08V12C21.9988 14.1564 21.3005 16.2547 20.0093 17.9818C18.7182 19.709 16.9033 20.9725 14.8354 21.5839C12.7674 22.1953 10.5573 22.1219 8.53447 21.3746C6.51168 20.6273 4.78465 19.2461 3.61096 17.4371C2.43727 15.628 1.87979 13.4881 2.02168 11.3363C2.16356 9.18455 2.99721 7.13631 4.39828 5.49706C5.79935 3.85781 7.69279 2.71537 9.79619 2.24013C11.8996 1.7649 14.1003 1.98232 16.07 2.85999"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M22 4L12 14.01L9 11.01"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>{doctor.yearsOfExperience} years of experience</span>
              </div>
            )}

            {/* Languages */}
            {doctor.languages && doctor.languages.length > 0 && (
              <div className={styles.detailRow}>
                <svg
                  className={styles.detailIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  <path d="M2 12H22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  <path
                    d="M12 2C14.5 4.5 16 8 16 12C16 16 14.5 19.5 12 22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M12 2C9.5 4.5 8 8 8 12C8 16 9.5 19.5 12 22"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Speaks: {doctor.languages.join(', ')}</span>
              </div>
            )}

            {/* Accepting status */}
            <div
              className={`${styles.availability} ${
                doctor.acceptingNewPatients
                  ? styles.availabilityAccepting
                  : styles.availabilityNotAccepting
              }`}
            >
              <span className={styles.availabilityDot} />
              {doctor.acceptingNewPatients
                ? 'Accepting new patients'
                : 'Not accepting new patients'}
            </div>
          </div>
        )}

        {/* Recommendation reason */}
        {recommendationReason && (
          <div className={styles.recommendation}>
            <svg
              className={styles.recommendationIcon}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>{recommendationReason}</span>
          </div>
        )}

        {/* Actions */}
        {variant !== 'compact' && (onBook || onViewProfile) && (
          <div className={styles.actions}>
            {onBook && (
              <button
                type="button"
                className={styles.bookButton}
                onClick={() => onBook(doctor)}
                disabled={!doctor.acceptingNewPatients}
              >
                {doctor.acceptingNewPatients ? 'Book Appointment' : 'Not Available'}
              </button>
            )}
            {onViewProfile && (
              <button
                type="button"
                className={styles.viewProfileButton}
                onClick={() => onViewProfile(doctor)}
              >
                View Profile
              </button>
            )}
          </div>
        )}
      </div>
    );
  }
);

DoctorCard.displayName = 'DoctorCard';

export default DoctorCard;
