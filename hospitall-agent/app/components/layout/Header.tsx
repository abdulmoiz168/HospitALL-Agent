'use client';

import React from 'react';
import { useRole } from '@/lib/hooks';
import { Badge } from '@/app/components/ui';
import { RoleSwitch } from './RoleSwitch';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Top bar with role indicator and role switch.
 * Accessible with semantic HTML and ARIA attributes.
 */
export const Header: React.FC<HeaderProps> = ({ className = '' }) => {
  const { isPatient, isAdmin, role } = useRole();

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

        {/* Patient Mode Indicator */}
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
      </div>
    </header>
  );
};

export default Header;
