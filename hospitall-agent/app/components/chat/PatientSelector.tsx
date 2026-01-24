'use client';

import React, { useState, useEffect } from 'react';
import styles from './PatientSelector.module.css';
import { CustomPatientModal } from './CustomPatientModal';

// Simplified patient context for chat
export interface PatientContext {
  id: string;
  type: 'sample' | 'custom';
  name: string;
  age: number;
  sex: 'male' | 'female';
  conditions: string[];
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
  }>;
  allergies: Array<{
    allergen: string;
    severity: 'mild' | 'moderate' | 'severe';
    reaction?: string;
  }>;
  smokingStatus: 'never' | 'former' | 'current';
  alcoholUse: 'none' | 'occasional' | 'moderate' | 'heavy';
  familyHistory?: string[];
  notes?: string;
}

// Sample patients (derived from mock data)
const SAMPLE_PATIENTS: PatientContext[] = [
  {
    id: 'sample_rukhsana',
    type: 'sample',
    name: 'Rukhsana B.',
    age: 68,
    sex: 'female',
    conditions: [
      'Type 2 Diabetes Mellitus (insulin-dependent)',
      'Essential Hypertension',
      'Chronic Kidney Disease Stage 3a',
      'Diabetic Retinopathy (mild)',
    ],
    medications: [
      { name: 'Metformin', dosage: '1000mg', frequency: 'Twice daily' },
      { name: 'Insulin Glargine', dosage: '24 units', frequency: 'Once daily at bedtime' },
      { name: 'Lisinopril', dosage: '20mg', frequency: 'Once daily' },
      { name: 'Amlodipine', dosage: '5mg', frequency: 'Once daily' },
      { name: 'Atorvastatin', dosage: '40mg', frequency: 'Once daily at bedtime' },
    ],
    allergies: [
      { allergen: 'Sulfa Drugs', severity: 'severe', reaction: 'Anaphylaxis' },
      { allergen: 'Shellfish', severity: 'moderate', reaction: 'Hives' },
    ],
    smokingStatus: 'never',
    alcoholUse: 'none',
    familyHistory: ['Diabetes (mother)', 'Heart disease (father)'],
  },
  {
    id: 'sample_farhan',
    type: 'sample',
    name: 'Farhan A.',
    age: 45,
    sex: 'male',
    conditions: [
      'Coronary Artery Disease (stent in LAD)',
      'Hyperlipidemia',
      'History of Myocardial Infarction (2022)',
      'Anxiety Disorder',
    ],
    medications: [
      { name: 'Aspirin', dosage: '81mg', frequency: 'Once daily' },
      { name: 'Clopidogrel', dosage: '75mg', frequency: 'Once daily' },
      { name: 'Rosuvastatin', dosage: '40mg', frequency: 'Once daily at bedtime' },
      { name: 'Metoprolol', dosage: '50mg', frequency: 'Once daily' },
      { name: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
      { name: 'Sertraline', dosage: '50mg', frequency: 'Once daily' },
    ],
    allergies: [
      { allergen: 'Penicillin', severity: 'moderate', reaction: 'Skin rash' },
    ],
    smokingStatus: 'former',
    alcoholUse: 'occasional',
    familyHistory: ['Heart disease (father, died at 55)', 'High cholesterol (mother)'],
  },
];

const STORAGE_KEY = 'hospitall_selected_patient';
const CUSTOM_PATIENT_KEY = 'hospitall_custom_patient';

interface PatientSelectorProps {
  onPatientChange?: (patient: PatientContext | null) => void;
}

export const PatientSelector: React.FC<PatientSelectorProps> = ({ onPatientChange }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [customPatient, setCustomPatient] = useState<PatientContext | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Load from localStorage on mount
  useEffect(() => {
    const savedSelection = localStorage.getItem(STORAGE_KEY);
    const savedCustom = localStorage.getItem(CUSTOM_PATIENT_KEY);

    if (savedCustom) {
      try {
        setCustomPatient(JSON.parse(savedCustom));
      } catch {
        // Invalid JSON, ignore
      }
    }

    if (savedSelection) {
      setSelectedId(savedSelection);
    }
  }, []);

  // Notify parent when selection changes
  useEffect(() => {
    if (!selectedId) {
      onPatientChange?.(null);
      return;
    }

    if (selectedId === 'custom' && customPatient) {
      onPatientChange?.(customPatient);
    } else {
      const sample = SAMPLE_PATIENTS.find((p) => p.id === selectedId);
      onPatientChange?.(sample || null);
    }
  }, [selectedId, customPatient, onPatientChange]);

  const handleSelect = (id: string) => {
    if (id === 'custom' && !customPatient) {
      setIsModalOpen(true);
      return;
    }

    setSelectedId(id);
    localStorage.setItem(STORAGE_KEY, id);
  };

  const handleCustomPatientSave = (patient: PatientContext) => {
    setCustomPatient(patient);
    localStorage.setItem(CUSTOM_PATIENT_KEY, JSON.stringify(patient));
    setSelectedId('custom');
    localStorage.setItem(STORAGE_KEY, 'custom');
    setIsModalOpen(false);
  };

  const handleEditCustom = () => {
    setIsModalOpen(true);
  };

  const getSelectedPatient = (): PatientContext | null => {
    if (!selectedId) return null;
    if (selectedId === 'custom') return customPatient;
    return SAMPLE_PATIENTS.find((p) => p.id === selectedId) || null;
  };

  const selected = getSelectedPatient();

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setIsExpanded(!isExpanded)}>
        <div className={styles.headerLeft}>
          <svg className={styles.patientIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className={styles.headerTitle}>Patient Context</span>
          {selected && (
            <span className={styles.selectedBadge}>
              {selected.name} ({selected.age}{selected.sex === 'male' ? 'M' : 'F'})
            </span>
          )}
        </div>
        <svg
          className={`${styles.chevron} ${isExpanded ? styles.chevronUp : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isExpanded && (
        <div className={styles.content}>
          <p className={styles.description}>
            Select a patient profile for the AI to use during this consultation.
          </p>

          <div className={styles.patientGrid}>
            {/* Sample Patient 1 */}
            <button
              type="button"
              className={`${styles.patientCard} ${selectedId === SAMPLE_PATIENTS[0].id ? styles.selected : ''}`}
              onClick={() => handleSelect(SAMPLE_PATIENTS[0].id)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{SAMPLE_PATIENTS[0].name}</span>
                <span className={styles.cardAge}>{SAMPLE_PATIENTS[0].age}{SAMPLE_PATIENTS[0].sex === 'female' ? 'F' : 'M'}</span>
              </div>
              <div className={styles.cardConditions}>
                {SAMPLE_PATIENTS[0].conditions.slice(0, 2).map((c, i) => (
                  <span key={i} className={styles.conditionTag}>{c.split('(')[0].trim()}</span>
                ))}
                {SAMPLE_PATIENTS[0].conditions.length > 2 && (
                  <span className={styles.moreTag}>+{SAMPLE_PATIENTS[0].conditions.length - 2}</span>
                )}
              </div>
              <div className={styles.cardMeta}>
                <span>{SAMPLE_PATIENTS[0].medications.length} medications</span>
                <span>{SAMPLE_PATIENTS[0].allergies.length} allergies</span>
              </div>
            </button>

            {/* Sample Patient 2 */}
            <button
              type="button"
              className={`${styles.patientCard} ${selectedId === SAMPLE_PATIENTS[1].id ? styles.selected : ''}`}
              onClick={() => handleSelect(SAMPLE_PATIENTS[1].id)}
            >
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{SAMPLE_PATIENTS[1].name}</span>
                <span className={styles.cardAge}>{SAMPLE_PATIENTS[1].age}{SAMPLE_PATIENTS[1].sex === 'male' ? 'M' : 'F'}</span>
              </div>
              <div className={styles.cardConditions}>
                {SAMPLE_PATIENTS[1].conditions.slice(0, 2).map((c, i) => (
                  <span key={i} className={styles.conditionTag}>{c.split('(')[0].trim()}</span>
                ))}
                {SAMPLE_PATIENTS[1].conditions.length > 2 && (
                  <span className={styles.moreTag}>+{SAMPLE_PATIENTS[1].conditions.length - 2}</span>
                )}
              </div>
              <div className={styles.cardMeta}>
                <span>{SAMPLE_PATIENTS[1].medications.length} medications</span>
                <span>{SAMPLE_PATIENTS[1].allergies.length} allergies</span>
              </div>
            </button>

            {/* Custom Patient */}
            <button
              type="button"
              className={`${styles.patientCard} ${styles.customCard} ${selectedId === 'custom' ? styles.selected : ''}`}
              onClick={() => handleSelect('custom')}
            >
              {customPatient ? (
                <>
                  <div className={styles.cardHeader}>
                    <span className={styles.cardName}>{customPatient.name || 'Custom Patient'}</span>
                    <span className={styles.cardAge}>{customPatient.age}{customPatient.sex === 'male' ? 'M' : 'F'}</span>
                  </div>
                  <div className={styles.cardConditions}>
                    {customPatient.conditions.slice(0, 2).map((c, i) => (
                      <span key={i} className={styles.conditionTag}>{c.split('(')[0].trim()}</span>
                    ))}
                    {customPatient.conditions.length > 2 && (
                      <span className={styles.moreTag}>+{customPatient.conditions.length - 2}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    className={styles.editButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditCustom();
                    }}
                  >
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <svg className={styles.addIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className={styles.addText}>Create Custom Patient</span>
                </>
              )}
            </button>
          </div>

          {!selectedId && (
            <p className={styles.hint}>
              Select a patient to provide medical context to the AI assistant.
            </p>
          )}
        </div>
      )}

      <CustomPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCustomPatientSave}
        initialData={customPatient}
      />
    </div>
  );
};

export default PatientSelector;
