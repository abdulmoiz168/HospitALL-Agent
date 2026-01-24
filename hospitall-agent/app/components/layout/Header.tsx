'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRole, usePatient } from '@/lib/hooks';
import { Badge } from '@/app/components/ui';
import { RoleSwitch } from './RoleSwitch';
import { GlobalPatientSelector } from './GlobalPatientSelector';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Top bar with role indicator, patient context indicator, and role switch.
 * Shows patient selector modal when in patient mode.
 * Accessible with semantic HTML and ARIA attributes.
 */
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { isPatient, isAdmin, role } = useRole();
  const { chatPatientContext, showPatientSelector, setShowPatientSelector } = usePatient();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Show patient selector if in patient mode with no patient selected
  useEffect(() => {
    if (isPatient && !chatPatientContext && !showPatientSelector) {
      // Small delay to prevent flash on initial load
      const timer = setTimeout(() => {
        setShowPatientSelector(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPatient, chatPatientContext, showPatientSelector, setShowPatientSelector]);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
      });
      if (response.ok) {
        router.push('/auth/signin');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [router]);

  const headerClasses = [styles.header, className].filter(Boolean).join(' ');

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

        {/* Patient Mode Indicator with Patient Context */}
        {isPatient && (
          <div className={styles.modeIndicator}>
            <Badge variant="success" size="sm">
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M7 1C4.24 1 2 3.24 2 6C2 8.76 4.24 11 7 11C9.76 11 12 8.76 12 6C12 3.24 9.76 1 7 1Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M7 13C3.69 13 1 11.21 1 9C1 7.9 1.9 7 3 7H11C12.1 7 13 7.9 13 9C13 11.21 10.31 13 7 13Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
              Patient Mode
            </Badge>
            {chatPatientContext && (
              <button
                type="button"
                className={styles.patientContextButton}
                onClick={() => setShowPatientSelector(true)}
                title="Change patient context"
              >
                <span className={styles.patientName}>{chatPatientContext.name}</span>
                <span className={styles.patientDetails}>
                  {chatPatientContext.age}{chatPatientContext.sex === 'male' ? 'M' : 'F'}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
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
        {/* Role Switch */}
        <RoleSwitch className={styles.roleSwitch} />

        {/* Current Role Badge (mobile) */}
        <div className={styles.roleBadgeMobile}>
          <Badge variant={isAdmin ? 'info' : 'success'} size="sm">
            {role}
          </Badge>
        </div>

        {/* Logout Button */}
        <button
          type="button"
          className={styles.logoutButton}
          onClick={handleLogout}
          disabled={isLoggingOut}
          aria-label="Sign out"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16 17L21 12L16 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M21 12H9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.logoutText}>
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </span>
        </button>
      </div>

      {/* Global Patient Selector Modal */}
      <GlobalPatientSelector
        isOpen={showPatientSelector}
        onClose={() => setShowPatientSelector(false)}
        required={isPatient && !chatPatientContext}
      />
    </header>
  );
};

export default Header;
