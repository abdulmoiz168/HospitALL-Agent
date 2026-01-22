'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { usePatient } from '@/lib/hooks/use-patient';
import { useSettings } from '@/lib/hooks/use-settings';
import { DoctorCard } from '@/app/components/chat';
import { MOCK_DOCTORS } from '@/mastra/data/doctors';
import type { Doctor, Specialty } from '@/mastra/schemas/doctor';
import type { Condition } from '@/mastra/schemas/patient';
import styles from './page.module.css';

// AI recommendation state type
type AIRecommendationState = {
  isLoading: boolean;
  response: string | null;
  error: string | null;
};

/**
 * Mapping of conditions to relevant specialties for AI recommendations
 */
const CONDITION_TO_SPECIALTY_MAP: Record<string, Specialty[]> = {
  // Heart/Cardiovascular conditions
  hypertension: ['cardiology', 'internal_medicine'],
  'essential hypertension': ['cardiology', 'internal_medicine'],
  'high blood pressure': ['cardiology', 'internal_medicine'],
  'heart disease': ['cardiology'],
  'heart failure': ['cardiology'],
  'atrial fibrillation': ['cardiology'],
  'coronary artery disease': ['cardiology'],
  arrhythmia: ['cardiology'],

  // Diabetes/Endocrine conditions
  diabetes: ['endocrinology', 'internal_medicine'],
  'diabetes mellitus': ['endocrinology', 'internal_medicine'],
  'type 2 diabetes': ['endocrinology', 'internal_medicine'],
  'type 1 diabetes': ['endocrinology'],
  thyroid: ['endocrinology'],
  hypothyroidism: ['endocrinology'],
  hyperthyroidism: ['endocrinology'],
  pcos: ['endocrinology', 'ob_gyn'],

  // Kidney conditions
  'chronic kidney disease': ['nephrology'],
  ckd: ['nephrology'],
  'kidney disease': ['nephrology'],

  // Respiratory conditions
  asthma: ['pulmonology', 'family_medicine'],
  copd: ['pulmonology'],
  'sleep apnea': ['pulmonology'],
  pneumonia: ['pulmonology', 'internal_medicine'],

  // Women's health
  pregnancy: ['ob_gyn'],
  menopause: ['ob_gyn', 'endocrinology'],
  'gestational diabetes': ['ob_gyn', 'endocrinology'],

  // General/Other
  obesity: ['endocrinology', 'internal_medicine', 'family_medicine'],
  'high cholesterol': ['cardiology', 'internal_medicine'],
  hyperlipidemia: ['cardiology', 'internal_medicine'],
  arthritis: ['rheumatology', 'family_medicine'],
  osteoporosis: ['endocrinology', 'rheumatology'],
};

/**
 * Gets recommendation reason based on patient condition
 */
function getRecommendationReason(doctor: Doctor, conditions: Condition[]): string {
  const activeConditions = conditions.filter(
    (c) => c.status === 'active' || c.status === 'chronic'
  );

  for (const condition of activeConditions) {
    const conditionName = condition.name.toLowerCase();

    // Check if any mapped condition matches
    for (const [keyword, specialties] of Object.entries(CONDITION_TO_SPECIALTY_MAP)) {
      if (conditionName.includes(keyword) && specialties.includes(doctor.specialty)) {
        // Check sub-specialties for more specific match
        if (doctor.subSpecialties) {
          for (const subSpec of doctor.subSpecialties) {
            if (
              subSpec.toLowerCase().includes(keyword) ||
              conditionName.includes(subSpec.toLowerCase())
            ) {
              return `Specializes in ${subSpec}, relevant to your ${condition.name}`;
            }
          }
        }
        return `Specialist in ${formatSpecialty(doctor.specialty)}, recommended for your ${condition.name}`;
      }
    }
  }

  // Default reason based on specialty
  return `Highly rated ${formatSpecialty(doctor.specialty)} specialist`;
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
 * Gets unique specialties from doctor list
 */
function getUniqueSpecialties(): Specialty[] {
  const specialties = new Set<Specialty>();
  MOCK_DOCTORS.forEach((doctor) => specialties.add(doctor.specialty));
  return Array.from(specialties).sort();
}

/**
 * Search icon component
 */
const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle
      cx="11"
      cy="11"
      r="8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 21L16.65 16.65"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * AI/Lightbulb icon for recommendations
 */
const AIIcon = () => (
  <svg
    width="24"
    height="24"
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
);

/**
 * Filter icon component
 */
const FilterIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22 3H2L10 12.46V19L14 21V12.46L22 3Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Recommendations Page Component
 *
 * Displays doctor recommendations with filtering capabilities.
 * Features:
 * - AI-powered recommendations based on patient conditions
 * - Filter by specialty
 * - Filter by availability (accepting new patients)
 * - Search by doctor name
 * - Responsive grid layout
 */
export default function RecommendationsPage() {
  const { activePatient } = usePatient();
  const { settings } = useSettings();

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | ''>('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);

  // AI recommendation states
  const [aiQuery, setAiQuery] = useState('');
  const [aiState, setAiState] = useState<AIRecommendationState>({
    isLoading: false,
    response: null,
    error: null,
  });

  // Ask AI for recommendations
  const handleAskAI = useCallback(async () => {
    if (!aiQuery.trim() || aiState.isLoading) return;

    setAiState({ isLoading: true, response: null, error: null });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `I need help finding a doctor. ${aiQuery}`,
          sessionId: `recommendations-${Date.now()}`,
          patientId: activePatient?.demographics.id,
          systemPrompt: settings.systemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            if (parsed.type === 'chunk' && parsed.content) {
              fullResponse += parsed.content;
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }

      setAiState({ isLoading: false, response: fullResponse, error: null });
    } catch (error) {
      setAiState({
        isLoading: false,
        response: null,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [aiQuery, aiState.isLoading, activePatient]);

  // Handle AI query key press
  const handleAiKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleAskAI();
      }
    },
    [handleAskAI]
  );

  // Clear AI response
  const handleClearAI = useCallback(() => {
    setAiQuery('');
    setAiState({ isLoading: false, response: null, error: null });
  }, []);

  // Get unique specialties for filter dropdown
  const specialties = useMemo(() => getUniqueSpecialties(), []);

  // Get AI-recommended doctors based on patient conditions
  const recommendedDoctors = useMemo(() => {
    if (!activePatient || activePatient.conditions.length === 0) {
      return [];
    }

    const activeConditions = activePatient.conditions.filter(
      (c) => c.status === 'active' || c.status === 'chronic'
    );

    if (activeConditions.length === 0) {
      return [];
    }

    // Find relevant specialties for patient's conditions
    const relevantSpecialties = new Set<Specialty>();
    activeConditions.forEach((condition) => {
      const conditionName = condition.name.toLowerCase();
      Object.entries(CONDITION_TO_SPECIALTY_MAP).forEach(([keyword, specialties]) => {
        if (conditionName.includes(keyword)) {
          specialties.forEach((s) => relevantSpecialties.add(s));
        }
      });
    });

    // If no specific matches, include general practitioners
    if (relevantSpecialties.size === 0) {
      relevantSpecialties.add('internal_medicine');
      relevantSpecialties.add('family_medicine');
    }

    // Filter and sort doctors
    return MOCK_DOCTORS.filter(
      (doctor) =>
        relevantSpecialties.has(doctor.specialty) && doctor.acceptingNewPatients
    )
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3); // Top 3 recommendations
  }, [activePatient]);

  // Filter all doctors based on search, specialty, and availability
  const filteredDoctors = useMemo(() => {
    return MOCK_DOCTORS.filter((doctor) => {
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const fullName = `${doctor.firstName} ${doctor.lastName}`.toLowerCase();
        const specialtyName = formatSpecialty(doctor.specialty).toLowerCase();
        if (!fullName.includes(query) && !specialtyName.includes(query)) {
          return false;
        }
      }

      // Filter by specialty
      if (selectedSpecialty && doctor.specialty !== selectedSpecialty) {
        return false;
      }

      // Filter by availability
      if (showAvailableOnly && !doctor.acceptingNewPatients) {
        return false;
      }

      return true;
    }).sort((a, b) => b.rating - a.rating);
  }, [searchQuery, selectedSpecialty, showAvailableOnly]);

  // Get recommended doctor IDs to avoid showing duplicates
  const recommendedDoctorIds = useMemo(
    () => new Set(recommendedDoctors.map((d) => d.id)),
    [recommendedDoctors]
  );

  // Filter out recommended doctors from main list if recommendations are shown
  const mainDoctorList = useMemo(() => {
    if (recommendedDoctors.length === 0) {
      return filteredDoctors;
    }
    return filteredDoctors.filter((d) => !recommendedDoctorIds.has(d.id));
  }, [filteredDoctors, recommendedDoctorIds, recommendedDoctors.length]);

  // Handle book appointment click
  const handleBook = useCallback((doctor: Doctor) => {
    // In a real app, this would open a booking modal or navigate to booking page
    alert(`Booking appointment with Dr. ${doctor.firstName} ${doctor.lastName}`);
  }, []);

  // Handle view profile click
  const handleViewProfile = useCallback((doctor: Doctor) => {
    // In a real app, this would navigate to doctor's profile page
    alert(`Viewing profile of Dr. ${doctor.firstName} ${doctor.lastName}`);
  }, []);

  // Clear all filters
  const handleClearFilters = useCallback(() => {
    setSearchQuery('');
    setSelectedSpecialty('');
    setShowAvailableOnly(false);
  }, []);

  // Check if any filters are active
  const hasActiveFilters = searchQuery || selectedSpecialty || showAvailableOnly;

  return (
    <div className={styles.recommendations}>
      {/* Page Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Find a Doctor</h1>
        <p className={styles.subtitle}>
          {activePatient
            ? `Discover specialists based on your health needs, ${activePatient.demographics.firstName}`
            : 'Browse our network of qualified healthcare specialists'}
        </p>
      </header>

      {/* AI-Powered Recommendation Section */}
      <section className={styles.aiSection} aria-label="AI-powered recommendations">
        <div className={styles.aiHeader}>
          <span className={styles.aiIcon}>
            <AIIcon />
          </span>
          <div>
            <h2 className={styles.aiTitle}>Ask AI for Recommendations</h2>
            <p className={styles.aiDescription}>
              Describe your symptoms or needs, and our AI will recommend the right specialist
            </p>
          </div>
        </div>

        <div className={styles.aiInputWrapper}>
          <input
            type="text"
            className={styles.aiInput}
            placeholder="e.g., I've been having chest pain and shortness of breath..."
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={handleAiKeyPress}
            disabled={aiState.isLoading}
            aria-label="Describe your symptoms"
          />
          <button
            type="button"
            className={styles.aiButton}
            onClick={handleAskAI}
            disabled={!aiQuery.trim() || aiState.isLoading}
          >
            {aiState.isLoading ? (
              <span className={styles.spinner} />
            ) : (
              'Get Recommendations'
            )}
          </button>
        </div>

        {/* AI Response */}
        {aiState.response && (
          <div className={styles.aiResponse}>
            <div className={styles.aiResponseHeader}>
              <span className={styles.aiResponseLabel}>AI Recommendation</span>
              <button
                type="button"
                className={styles.aiClearButton}
                onClick={handleClearAI}
              >
                Clear
              </button>
            </div>
            <div className={styles.aiResponseContent}>
              {aiState.response.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className={styles.aiBranding}>
              Powered by <span>Genaima AI</span>
            </div>
          </div>
        )}

        {/* AI Error */}
        {aiState.error && (
          <div className={styles.aiError}>
            {aiState.error}
            <button type="button" onClick={handleClearAI}>
              Try again
            </button>
          </div>
        )}
      </section>

      {/* Filter Controls */}
      <section className={styles.filters} aria-label="Filter controls">
        <div className={styles.filterRow}>
          {/* Search Input */}
          <div className={styles.searchWrapper}>
            <span className={styles.searchIcon}>
              <SearchIcon />
            </span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search doctors"
            />
          </div>

          {/* Specialty Filter */}
          <div className={styles.selectWrapper}>
            <span className={styles.selectIcon}>
              <FilterIcon />
            </span>
            <select
              className={styles.select}
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value as Specialty | '')}
              aria-label="Filter by specialty"
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {formatSpecialty(specialty)}
                </option>
              ))}
            </select>
          </div>

          {/* Availability Toggle */}
          <label className={styles.toggleWrapper}>
            <input
              type="checkbox"
              className={styles.toggleInput}
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
            />
            <span className={styles.toggleSlider} />
            <span className={styles.toggleLabel}>Accepting new patients</span>
          </label>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className={styles.clearButton}
              onClick={handleClearFilters}
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* AI Recommendations Section */}
      {activePatient && recommendedDoctors.length > 0 && !hasActiveFilters && (
        <section className={styles.recommendationsSection} aria-label="AI Recommendations">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleWrapper}>
              <span className={styles.aiIcon}>
                <AIIcon />
              </span>
              <h2 className={styles.sectionTitle}>Recommended for You</h2>
            </div>
            <p className={styles.sectionDescription}>
              Based on your health profile and conditions
            </p>
          </div>

          <div className={styles.recommendedGrid}>
            {recommendedDoctors.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                recommendationReason={getRecommendationReason(
                  doctor,
                  activePatient.conditions
                )}
                onBook={handleBook}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        </section>
      )}

      {/* All Doctors Section */}
      <section className={styles.allDoctorsSection} aria-label="All doctors">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            {hasActiveFilters ? 'Search Results' : 'All Doctors'}
          </h2>
          <p className={styles.resultCount}>
            {mainDoctorList.length} doctor{mainDoctorList.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {mainDoctorList.length > 0 ? (
          <div className={styles.doctorsGrid}>
            {mainDoctorList.map((doctor) => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                onBook={handleBook}
                onViewProfile={handleViewProfile}
              />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <SearchIcon />
            </div>
            <h3 className={styles.emptyTitle}>No doctors found</h3>
            <p className={styles.emptyDescription}>
              Try adjusting your search or filter criteria to find more doctors.
            </p>
            <button
              type="button"
              className={styles.emptyButton}
              onClick={handleClearFilters}
            >
              Clear all filters
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
