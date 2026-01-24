'use client';

import React, { useState, useEffect } from 'react';
import { usePatient, useRole } from '@/lib/hooks';
import { CustomPatientModal } from '@/app/components/chat/CustomPatientModal';
import type { ChatPatientContext } from '@/lib/context/app-context';
import styles from './GlobalPatientSelector.module.css';

interface GlobalPatientSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  /** If true, user cannot close without selecting a patient */
  required?: boolean;
}

/**
 * Global modal for selecting a patient context.
 * Shows sample patients and custom patient option.
 * Used when switching to patient mode or changing patient context.
 */
export const GlobalPatientSelector: React.FC<GlobalPatientSelectorProps> = ({
  isOpen,
  onClose,
  required = false,
}) => {
  const {
    chatPatientContext,
    setChatPatientContext,
    customPatient,
    setCustomPatient,
    samplePatients
  } = usePatient();
  const { role } = useRole();
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);

  // Close modal if role changes to admin
  useEffect(() => {
    if (role === 'admin' && isOpen) {
      onClose();
    }
  }, [role, isOpen, onClose]);

  if (!isOpen) return null;

  const handleSelectPatient = (patient: ChatPatientContext) => {
    setChatPatientContext(patient);
    onClose();
  };

  const handleCustomPatientClick = () => {
    if (customPatient) {
      // If custom patient exists, select it
      setChatPatientContext(customPatient);
      onClose();
    } else {
      // Open modal to create custom patient
      setIsCustomModalOpen(true);
    }
  };

  const handleCustomPatientSave = (patient: ChatPatientContext) => {
    setCustomPatient(patient);
    setChatPatientContext(patient);
    setIsCustomModalOpen(false);
    onClose();
  };

  const handleEditCustom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCustomModalOpen(true);
  };

  const handleOverlayClick = () => {
    if (!required) {
      onClose();
    }
  };

  const handleClearPatient = () => {
    setChatPatientContext(null);
    onClose();
  };

  return (
    <>
      <div className={styles.overlay} onClick={handleOverlayClick}>
        <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
          <div className={styles.header}>
            <div className={styles.headerContent}>
              <svg className={styles.headerIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div>
                <h2 className={styles.title}>Select Patient Context</h2>
                <p className={styles.subtitle}>Choose a patient profile for your consultation session</p>
              </div>
            </div>
            {!required && (
              <button type="button" className={styles.closeButton} onClick={onClose}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>

          <div className={styles.content}>
            {required && (
              <div className={styles.requiredNotice}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8V12M12 16H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <span>Please select a patient to continue in Patient Mode</span>
              </div>
            )}

            <div className={styles.patientGrid}>
              {/* Sample Patient 1 */}
              <button
                type="button"
                className={`${styles.patientCard} ${chatPatientContext?.id === samplePatients[0]?.id ? styles.selected : ''}`}
                onClick={() => handleSelectPatient(samplePatients[0])}
              >
                <div className={styles.cardBadge}>Sample</div>
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{samplePatients[0]?.name}</span>
                  <span className={styles.cardAge}>
                    {samplePatients[0]?.age}{samplePatients[0]?.sex === 'female' ? 'F' : 'M'}
                  </span>
                </div>
                <div className={styles.cardConditions}>
                  {samplePatients[0]?.conditions.slice(0, 2).map((c, i) => (
                    <span key={i} className={styles.conditionTag}>{c.split('(')[0].trim()}</span>
                  ))}
                  {(samplePatients[0]?.conditions.length || 0) > 2 && (
                    <span className={styles.moreTag}>+{(samplePatients[0]?.conditions.length || 0) - 2}</span>
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <span>{samplePatients[0]?.medications.length} medications</span>
                  <span>{samplePatients[0]?.allergies.length} allergies</span>
                </div>
                {chatPatientContext?.id === samplePatients[0]?.id && (
                  <div className={styles.selectedIndicator}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>

              {/* Sample Patient 2 */}
              <button
                type="button"
                className={`${styles.patientCard} ${chatPatientContext?.id === samplePatients[1]?.id ? styles.selected : ''}`}
                onClick={() => handleSelectPatient(samplePatients[1])}
              >
                <div className={styles.cardBadge}>Sample</div>
                <div className={styles.cardHeader}>
                  <span className={styles.cardName}>{samplePatients[1]?.name}</span>
                  <span className={styles.cardAge}>
                    {samplePatients[1]?.age}{samplePatients[1]?.sex === 'male' ? 'M' : 'F'}
                  </span>
                </div>
                <div className={styles.cardConditions}>
                  {samplePatients[1]?.conditions.slice(0, 2).map((c, i) => (
                    <span key={i} className={styles.conditionTag}>{c.split('(')[0].trim()}</span>
                  ))}
                  {(samplePatients[1]?.conditions.length || 0) > 2 && (
                    <span className={styles.moreTag}>+{(samplePatients[1]?.conditions.length || 0) - 2}</span>
                  )}
                </div>
                <div className={styles.cardMeta}>
                  <span>{samplePatients[1]?.medications.length} medications</span>
                  <span>{samplePatients[1]?.allergies.length} allergies</span>
                </div>
                {chatPatientContext?.id === samplePatients[1]?.id && (
                  <div className={styles.selectedIndicator}>
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>

              {/* Custom Patient */}
              <div
                role="button"
                tabIndex={0}
                className={`${styles.patientCard} ${styles.customCard} ${chatPatientContext?.id === 'custom' ? styles.selected : ''}`}
                onClick={handleCustomPatientClick}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCustomPatientClick(); } }}
              >
                {customPatient ? (
                  <>
                    <div className={styles.cardBadge}>Custom</div>
                    <div className={styles.cardHeader}>
                      <span className={styles.cardName}>{customPatient.name || 'Custom Patient'}</span>
                      <span className={styles.cardAge}>
                        {customPatient.age}{customPatient.sex === 'male' ? 'M' : 'F'}
                      </span>
                    </div>
                    <div className={styles.cardConditions}>
                      {customPatient.conditions.slice(0, 2).map((c, i) => (
                        <span key={i} className={styles.conditionTag}>{c.split('(')[0].trim()}</span>
                      ))}
                      {customPatient.conditions.length > 2 && (
                        <span className={styles.moreTag}>+{customPatient.conditions.length - 2}</span>
                      )}
                    </div>
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.editButton}
                      onClick={handleEditCustom}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleEditCustom(e as unknown as React.MouseEvent);
                        }
                      }}
                    >
                      Edit
                    </span>
                    {chatPatientContext?.id === 'custom' && (
                      <div className={styles.selectedIndicator}>
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <svg className={styles.addIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className={styles.addText}>Create Custom Patient</span>
                    <span className={styles.addSubtext}>Define your own patient profile</span>
                  </>
                )}
              </div>
            </div>

            {chatPatientContext && !required && (
              <button type="button" className={styles.clearButton} onClick={handleClearPatient}>
                Clear Patient Selection
              </button>
            )}
          </div>

          <div className={styles.footer}>
            <p className={styles.footerText}>
              Patient context helps the AI provide personalized medical guidance based on conditions, medications, and allergies.
            </p>
          </div>
        </div>
      </div>

      <CustomPatientModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleCustomPatientSave}
        initialData={customPatient}
      />
    </>
  );
};

export default GlobalPatientSelector;
