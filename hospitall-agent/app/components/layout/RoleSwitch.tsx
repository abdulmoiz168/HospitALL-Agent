'use client';

import React, { useCallback, useId } from 'react';
import { useRole, usePatient } from '@/lib/hooks';
import styles from './RoleSwitch.module.css';

export interface RoleSwitchProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Toggle switch to switch between Patient and Admin modes.
 * Uses the useRole hook for state management.
 * When switching to patient mode, triggers patient selector if no patient is selected.
 * Accessible with keyboard navigation and ARIA attributes.
 */
export const RoleSwitch: React.FC<RoleSwitchProps> = ({ className = '' }) => {
  const { role, setRole, isAdmin } = useRole();
  const { chatPatientContext, setShowPatientSelector } = usePatient();
  const switchId = useId();

  const handleToggle = useCallback(() => {
    if (isAdmin) {
      // Switching to patient mode
      setRole('patient');
      // Show patient selector if no patient is selected
      if (!chatPatientContext) {
        setShowPatientSelector(true);
      }
    } else {
      // Switching to admin mode
      setRole('admin');
    }
  }, [isAdmin, setRole, chatPatientContext, setShowPatientSelector]);

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
