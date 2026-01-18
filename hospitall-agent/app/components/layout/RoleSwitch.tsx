'use client';

import React, { useCallback, useId } from 'react';
import { useRole } from '@/lib/hooks';
import styles from './RoleSwitch.module.css';

export interface RoleSwitchProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toggle switch to switch between Patient and Admin modes.
 * Uses the useRole hook for state management.
 * Accessible with keyboard navigation and ARIA attributes.
 */
export const RoleSwitch: React.FC<RoleSwitchProps> = ({ className = '' }) => {
  const { role, setRole, isAdmin } = useRole();
  const switchId = useId();

  const handleToggle = useCallback(() => {
    setRole(isAdmin ? 'patient' : 'admin');
  }, [isAdmin, setRole]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <span
        className={`${styles.label} ${!isAdmin ? styles.labelActive : ''}`}
        id={`${switchId}-patient`}
      >
        Patient
      </span>

      <button
        type="button"
        role="switch"
        aria-checked={isAdmin}
        aria-labelledby={`${switchId}-patient ${switchId}-admin`}
        className={`${styles.switch} ${isAdmin ? styles.switchActive : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <span className={styles.track}>
          <span
            className={`${styles.thumb} ${isAdmin ? styles.thumbActive : ''}`}
            aria-hidden="true"
          />
        </span>
        <span className={styles.srOnly}>
          Toggle between Patient and Admin mode. Currently in {role} mode.
        </span>
      </button>

      <span
        className={`${styles.label} ${isAdmin ? styles.labelActive : ''}`}
        id={`${switchId}-admin`}
      >
        Admin
      </span>
    </div>
  );
};

export default RoleSwitch;
