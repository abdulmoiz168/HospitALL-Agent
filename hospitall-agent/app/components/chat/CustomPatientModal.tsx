'use client';

import React, { useState, useEffect } from 'react';
import styles from './CustomPatientModal.module.css';
import type { ChatPatientContext as PatientContext } from '@/lib/context/app-context';

// Common conditions for quick selection
const COMMON_CONDITIONS = [
  'Type 2 Diabetes',
  'Type 1 Diabetes',
  'Hypertension',
  'Coronary Artery Disease',
  'Heart Failure',
  'Atrial Fibrillation',
  'COPD',
  'Asthma',
  'Chronic Kidney Disease',
  'Hypothyroidism',
  'Hyperthyroidism',
  'Depression',
  'Anxiety',
  'Osteoarthritis',
  'Rheumatoid Arthritis',
  'GERD',
  'Hyperlipidemia',
  'Obesity',
  'Sleep Apnea',
  'Migraine',
];

// Common allergens
const COMMON_ALLERGENS = [
  'Penicillin',
  'Sulfa Drugs',
  'Aspirin/NSAIDs',
  'Codeine',
  'Morphine',
  'Latex',
  'Iodine/Contrast Dye',
  'Shellfish',
  'Peanuts',
  'Eggs',
];

// Common medications by category
const COMMON_MEDICATIONS: Record<string, Array<{ name: string; defaultDosage: string; defaultFrequency: string }>> = {
  'Diabetes': [
    { name: 'Metformin', defaultDosage: '500mg', defaultFrequency: 'Twice daily' },
    { name: 'Glimepiride', defaultDosage: '2mg', defaultFrequency: 'Once daily' },
    { name: 'Sitagliptin', defaultDosage: '100mg', defaultFrequency: 'Once daily' },
    { name: 'Empagliflozin', defaultDosage: '10mg', defaultFrequency: 'Once daily' },
  ],
  'Blood Pressure': [
    { name: 'Lisinopril', defaultDosage: '10mg', defaultFrequency: 'Once daily' },
    { name: 'Amlodipine', defaultDosage: '5mg', defaultFrequency: 'Once daily' },
    { name: 'Losartan', defaultDosage: '50mg', defaultFrequency: 'Once daily' },
    { name: 'Metoprolol', defaultDosage: '25mg', defaultFrequency: 'Twice daily' },
  ],
  'Cholesterol': [
    { name: 'Atorvastatin', defaultDosage: '20mg', defaultFrequency: 'Once daily' },
    { name: 'Rosuvastatin', defaultDosage: '10mg', defaultFrequency: 'Once daily' },
  ],
  'Pain/Anti-inflammatory': [
    { name: 'Paracetamol', defaultDosage: '500mg', defaultFrequency: 'As needed' },
    { name: 'Ibuprofen', defaultDosage: '400mg', defaultFrequency: 'As needed' },
  ],
  'Mental Health': [
    { name: 'Sertraline', defaultDosage: '50mg', defaultFrequency: 'Once daily' },
    { name: 'Escitalopram', defaultDosage: '10mg', defaultFrequency: 'Once daily' },
  ],
  'Acid Reflux': [
    { name: 'Omeprazole', defaultDosage: '20mg', defaultFrequency: 'Once daily' },
    { name: 'Pantoprazole', defaultDosage: '40mg', defaultFrequency: 'Once daily' },
  ],
  'Blood Thinners': [
    { name: 'Aspirin', defaultDosage: '75mg', defaultFrequency: 'Once daily' },
    { name: 'Clopidogrel', defaultDosage: '75mg', defaultFrequency: 'Once daily' },
    { name: 'Warfarin', defaultDosage: '5mg', defaultFrequency: 'Once daily' },
  ],
};

interface CustomPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (patient: PatientContext) => void;
  initialData?: PatientContext | null;
}

interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
}

interface AllergyEntry {
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction?: string;
}

// Default patient values
const DEFAULT_PATIENT: Omit<PatientContext, 'id' | 'type'> = {
  name: '',
  age: 35,
  sex: 'male',
  conditions: [],
  medications: [],
  allergies: [],
  smokingStatus: 'never',
  alcoholUse: 'none',
  familyHistory: [],
  notes: '',
};

export const CustomPatientModal: React.FC<CustomPatientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Omit<PatientContext, 'id' | 'type'>>(DEFAULT_PATIENT);
  const [activeTab, setActiveTab] = useState<'basic' | 'conditions' | 'medications' | 'allergies'>('basic');
  const [customCondition, setCustomCondition] = useState('');
  const [customMedication, setCustomMedication] = useState<MedicationEntry>({ name: '', dosage: '', frequency: '' });
  const [customAllergen, setCustomAllergen] = useState<AllergyEntry>({ allergen: '', severity: 'moderate' });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        const { id, type, ...rest } = initialData;
        setFormData(rest);
      } else {
        setFormData(DEFAULT_PATIENT);
      }
      setActiveTab('basic');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleBasicChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCondition = (condition: string) => {
    setFormData((prev) => ({
      ...prev,
      conditions: prev.conditions.includes(condition)
        ? prev.conditions.filter((c) => c !== condition)
        : [...prev.conditions, condition],
    }));
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !formData.conditions.includes(customCondition.trim())) {
      setFormData((prev) => ({
        ...prev,
        conditions: [...prev.conditions, customCondition.trim()],
      }));
      setCustomCondition('');
    }
  };

  const addMedicationFromPreset = (med: { name: string; defaultDosage: string; defaultFrequency: string }) => {
    if (!formData.medications.some((m) => m.name === med.name)) {
      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, { name: med.name, dosage: med.defaultDosage, frequency: med.defaultFrequency }],
      }));
    }
  };

  const addCustomMedication = () => {
    if (customMedication.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        medications: [...prev.medications, {
          name: customMedication.name.trim(),
          dosage: customMedication.dosage.trim() || 'As prescribed',
          frequency: customMedication.frequency.trim() || 'As directed',
        }],
      }));
      setCustomMedication({ name: '', dosage: '', frequency: '' });
    }
  };

  const removeMedication = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index),
    }));
  };

  const toggleAllergen = (allergen: string) => {
    const existing = formData.allergies.find((a) => a.allergen === allergen);
    if (existing) {
      setFormData((prev) => ({
        ...prev,
        allergies: prev.allergies.filter((a) => a.allergen !== allergen),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, { allergen, severity: 'moderate' }],
      }));
    }
  };

  const updateAllergySeverity = (allergen: string, severity: 'mild' | 'moderate' | 'severe') => {
    setFormData((prev) => ({
      ...prev,
      allergies: prev.allergies.map((a) =>
        a.allergen === allergen ? { ...a, severity } : a
      ),
    }));
  };

  const addCustomAllergen = () => {
    if (customAllergen.allergen.trim() && !formData.allergies.some((a) => a.allergen === customAllergen.allergen.trim())) {
      setFormData((prev) => ({
        ...prev,
        allergies: [...prev.allergies, {
          allergen: customAllergen.allergen.trim(),
          severity: customAllergen.severity,
          reaction: customAllergen.reaction,
        }],
      }));
      setCustomAllergen({ allergen: '', severity: 'moderate' });
    }
  };

  const handleSave = () => {
    const patient: PatientContext = {
      id: 'custom',
      type: 'custom',
      ...formData,
      name: formData.name || 'Custom Patient',
    };
    onSave(patient);
  };

  const isValid = formData.age > 0 && formData.age < 120;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{initialData ? 'Edit Custom Patient' : 'Create Custom Patient'}</h2>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        <div className={styles.tabs}>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'basic' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('basic')}
          >
            Basic Info
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'conditions' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('conditions')}
          >
            Conditions {formData.conditions.length > 0 && `(${formData.conditions.length})`}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'medications' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('medications')}
          >
            Medications {formData.medications.length > 0 && `(${formData.medications.length})`}
          </button>
          <button
            type="button"
            className={`${styles.tab} ${activeTab === 'allergies' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('allergies')}
          >
            Allergies {formData.allergies.length > 0 && `(${formData.allergies.length})`}
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className={styles.tabContent}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Display Name (optional)</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleBasicChange('name', e.target.value)}
                    placeholder="e.g., Test Patient 1"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Age *</label>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={formData.age}
                    onChange={(e) => handleBasicChange('age', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Biological Sex *</label>
                  <select
                    value={formData.sex}
                    onChange={(e) => handleBasicChange('sex', e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Smoking Status</label>
                  <select
                    value={formData.smokingStatus}
                    onChange={(e) => handleBasicChange('smokingStatus', e.target.value)}
                  >
                    <option value="never">Never smoked</option>
                    <option value="former">Former smoker</option>
                    <option value="current">Current smoker</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Alcohol Use</label>
                  <select
                    value={formData.alcoholUse}
                    onChange={(e) => handleBasicChange('alcoholUse', e.target.value)}
                  >
                    <option value="none">None</option>
                    <option value="occasional">Occasional</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Additional Notes</label>
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleBasicChange('notes', e.target.value)}
                  placeholder="Any other relevant medical information..."
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Conditions Tab */}
          {activeTab === 'conditions' && (
            <div className={styles.tabContent}>
              <p className={styles.tabDescription}>Select existing conditions or add custom ones.</p>

              <div className={styles.chipGrid}>
                {COMMON_CONDITIONS.map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    className={`${styles.chip} ${formData.conditions.includes(condition) ? styles.chipSelected : ''}`}
                    onClick={() => toggleCondition(condition)}
                  >
                    {condition}
                  </button>
                ))}
              </div>

              <div className={styles.customInput}>
                <input
                  type="text"
                  value={customCondition}
                  onChange={(e) => setCustomCondition(e.target.value)}
                  placeholder="Add custom condition..."
                  onKeyDown={(e) => e.key === 'Enter' && addCustomCondition()}
                />
                <button type="button" onClick={addCustomCondition}>Add</button>
              </div>

              {formData.conditions.length > 0 && (
                <div className={styles.selectedList}>
                  <h4>Selected Conditions:</h4>
                  {formData.conditions.map((condition, i) => (
                    <span key={i} className={styles.selectedItem}>
                      {condition}
                      <button type="button" onClick={() => toggleCondition(condition)}>&times;</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Medications Tab */}
          {activeTab === 'medications' && (
            <div className={styles.tabContent}>
              <p className={styles.tabDescription}>Add current medications from presets or enter custom ones.</p>

              {Object.entries(COMMON_MEDICATIONS).map(([category, meds]) => (
                <div key={category} className={styles.medCategory}>
                  <h4>{category}</h4>
                  <div className={styles.chipGrid}>
                    {meds.map((med) => (
                      <button
                        key={med.name}
                        type="button"
                        className={`${styles.chip} ${formData.medications.some((m) => m.name === med.name) ? styles.chipSelected : ''}`}
                        onClick={() => addMedicationFromPreset(med)}
                        disabled={formData.medications.some((m) => m.name === med.name)}
                      >
                        {med.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div className={styles.customMedInput}>
                <input
                  type="text"
                  value={customMedication.name}
                  onChange={(e) => setCustomMedication((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Medication name"
                />
                <input
                  type="text"
                  value={customMedication.dosage}
                  onChange={(e) => setCustomMedication((prev) => ({ ...prev, dosage: e.target.value }))}
                  placeholder="Dosage"
                />
                <input
                  type="text"
                  value={customMedication.frequency}
                  onChange={(e) => setCustomMedication((prev) => ({ ...prev, frequency: e.target.value }))}
                  placeholder="Frequency"
                />
                <button type="button" onClick={addCustomMedication}>Add</button>
              </div>

              {formData.medications.length > 0 && (
                <div className={styles.medicationList}>
                  <h4>Current Medications:</h4>
                  {formData.medications.map((med, i) => (
                    <div key={i} className={styles.medicationItem}>
                      <span className={styles.medName}>{med.name}</span>
                      <span className={styles.medDetails}>{med.dosage} - {med.frequency}</span>
                      <button type="button" onClick={() => removeMedication(i)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Allergies Tab */}
          {activeTab === 'allergies' && (
            <div className={styles.tabContent}>
              <p className={styles.tabDescription}>Select known allergies and their severity.</p>

              <div className={styles.chipGrid}>
                {COMMON_ALLERGENS.map((allergen) => {
                  const existing = formData.allergies.find((a) => a.allergen === allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      className={`${styles.chip} ${existing ? styles.chipSelected : ''}`}
                      onClick={() => toggleAllergen(allergen)}
                    >
                      {allergen}
                    </button>
                  );
                })}
              </div>

              <div className={styles.customAllergyInput}>
                <input
                  type="text"
                  value={customAllergen.allergen}
                  onChange={(e) => setCustomAllergen((prev) => ({ ...prev, allergen: e.target.value }))}
                  placeholder="Custom allergen..."
                />
                <select
                  value={customAllergen.severity}
                  onChange={(e) => setCustomAllergen((prev) => ({ ...prev, severity: e.target.value as 'mild' | 'moderate' | 'severe' }))}
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
                <button type="button" onClick={addCustomAllergen}>Add</button>
              </div>

              {formData.allergies.length > 0 && (
                <div className={styles.allergyList}>
                  <h4>Allergies:</h4>
                  {formData.allergies.map((allergy, i) => (
                    <div key={i} className={styles.allergyItem}>
                      <span className={styles.allergenName}>{allergy.allergen}</span>
                      <select
                        value={allergy.severity}
                        onChange={(e) => updateAllergySeverity(allergy.allergen, e.target.value as 'mild' | 'moderate' | 'severe')}
                        className={styles[`severity${allergy.severity.charAt(0).toUpperCase() + allergy.severity.slice(1)}`]}
                      >
                        <option value="mild">Mild</option>
                        <option value="moderate">Moderate</option>
                        <option value="severe">Severe</option>
                      </select>
                      <button type="button" onClick={() => toggleAllergen(allergy.allergen)}>&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button type="button" className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!isValid}
          >
            {initialData ? 'Update Patient' : 'Create Patient'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomPatientModal;
