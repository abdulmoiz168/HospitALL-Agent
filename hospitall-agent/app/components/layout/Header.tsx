'use client';

import React from 'react';
import { useRole, usePatient } from '@/lib/hooks';
import { Badge } from '@/app/components/ui';
import { RoleSwitch } from './RoleSwitch';
import { ProfileSelector } from './ProfileSelector';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Top bar with patient name/info when in patient mode.
 * Shows current role indicator.
 * Contains ProfileSelector dropdown and RoleSwitch toggle.
 * Accessible with semantic HTML and ARIA attributes.
 */
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { isPatient, isAdmin, role } = useRole();
  const { activePatient } = usePatient();

  const headerClasses = [styles.header, className].filter(Boolean).join(' ');

  // Get patient info for display
  const getPatientInfo = () => {
    if (!activePatient) return null;

    const { firstName, lastName, dateOfBirth, sex } = activePatient.demographics;
    const age = calculateAge(dateOfBirth);
    const sexLabel = sex === 'female' ? 'F' : 'M';

    return {
      name: `${firstName} ${lastName}`,
      details: `${age}${sexLabel}`,
      conditions: activePatient.conditions.filter(c => c.status === 'active' || c.status === 'chronic').length,
    };
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const patientInfo = getPatientInfo();

  return (
    <header className={headerClasses} role="banner">
      <div className={styles.left}>
        {/* Logo/Brand - visible on mobile when sidebar is collapsed */}
        <div className={styles.brand}>
          <svg
            className={styles.logo}
            width="32"
            height="32"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="8" fill="var(--primary-600)" />
            <path
              d="M16 8V24M8 16H24"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
          <span className={styles.brandName}>HospitALL</span>
        </div>

        {/* Patient Info - only visible in patient mode */}
        {isPatient && patientInfo && (
          <div className={styles.patientInfo}>
            <span className={styles.patientLabel}>Current Patient:</span>
            <span className={styles.patientName}>{patientInfo.name}</span>
            <Badge variant="default" size="sm">
              {patientInfo.details}
            </Badge>
            {patientInfo.conditions > 0 && (
              <Badge variant="warning" size="sm">
                {patientInfo.conditions} active condition{patientInfo.conditions !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        )}

        {/* Admin Mode Indicator */}
        {isAdmin && (
          <div className={styles.adminIndicator}>
            <Badge variant="info" size="sm">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M7 1L1 4V7C1 10.31 3.55 13.36 7 14C10.45 13.36 13 10.31 13 7V4L7 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Admin Mode
            </Badge>
          </div>
        )}
      </div>

      <div className={styles.right}>
        {/* Profile Selector - only visible in patient mode */}
        {isPatient && <ProfileSelector className={styles.profileSelector} />}

        {/* Role Switch */}
        <RoleSwitch className={styles.roleSwitch} />

        {/* Current Role Badge (mobile) */}
        <div className={styles.roleBadgeMobile}>
          <Badge variant={isAdmin ? 'info' : 'success'} size="sm">
            {role}
          </Badge>
        </div>
      </div>
    </header>
  );
};

export default Header;
