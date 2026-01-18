'use client';

import React, { useState, useRef, useEffect, useCallback, useId } from 'react';
import { usePatient } from '@/lib/hooks';
import { Avatar } from '@/app/components/ui';
import styles from './ProfileSelector.module.css';

export interface ProfileSelectorProps {
  /** Additional CSS classes */
  className?: string;
}

/**
 * Dropdown to switch between the 3 mock patients.
 * Shows current patient name and avatar.
 * Uses the usePatient hook for state management.
 * Only visible in patient mode.
 * Accessible with keyboard navigation and ARIA attributes.
 */
export const ProfileSelector: React.FC<ProfileSelectorProps> = ({ className = '' }) => {
  const { activePatient, setActivePatient, patients } = usePatient();
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listboxId = useId();
  const buttonId = useId();

  // Get full name from patient demographics
  const getPatientName = (patient: typeof activePatient) => {
    if (!patient) return 'Select Patient';
    return `${patient.demographics.firstName} ${patient.demographics.lastName}`;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setFocusedIndex(-1);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    if (!isOpen) {
      const currentIndex = patients.findIndex(
        (p) => p.demographics.id === activePatient?.demographics.id
      );
      setFocusedIndex(currentIndex >= 0 ? currentIndex : 0);
    }
  }, [isOpen, patients, activePatient]);

  const handleSelect = useCallback(
    (patient: typeof activePatient) => {
      setActivePatient(patient);
      setIsOpen(false);
      setFocusedIndex(-1);
      buttonRef.current?.focus();
    },
    [setActivePatient]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp' || event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          setIsOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => (prev < patients.length - 1 ? prev + 1 : 0));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : patients.length - 1));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < patients.length) {
            handleSelect(patients[focusedIndex]);
          }
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(patients.length - 1);
          break;
        case 'Tab':
          setIsOpen(false);
          setFocusedIndex(-1);
          break;
      }
    },
    [isOpen, patients, focusedIndex, handleSelect]
  );

  const containerClasses = [styles.container, className].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} ref={dropdownRef}>
      <button
        ref={buttonRef}
        type="button"
        id={buttonId}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ''}`}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={buttonId}
        aria-controls={listboxId}
      >
        <Avatar
          name={getPatientName(activePatient)}
          size="sm"
          className={styles.avatar}
        />
        <span className={styles.name}>{getPatientName(activePatient)}</span>
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-labelledby={buttonId}
          className={styles.dropdown}
          tabIndex={-1}
        >
          {patients.map((patient, index) => {
            const patientName = getPatientName(patient);
            const isSelected = patient.demographics.id === activePatient?.demographics.id;
            const isFocused = index === focusedIndex;

            return (
              <li
                key={patient.demographics.id}
                role="option"
                aria-selected={isSelected}
                className={`${styles.option} ${isSelected ? styles.optionSelected : ''} ${isFocused ? styles.optionFocused : ''}`}
                onClick={() => handleSelect(patient)}
                onMouseEnter={() => setFocusedIndex(index)}
              >
                <Avatar
                  name={patientName}
                  size="sm"
                  className={styles.optionAvatar}
                />
                <div className={styles.optionContent}>
                  <span className={styles.optionName}>{patientName}</span>
                  <span className={styles.optionInfo}>
                    {patient.demographics.sex === 'female' ? 'F' : 'M'} - {patient.conditions[0]?.name || 'No conditions'}
                  </span>
                </div>
                {isSelected && (
                  <svg
                    className={styles.checkmark}
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M13.5 4.5L6 12L2.5 8.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default ProfileSelector;
