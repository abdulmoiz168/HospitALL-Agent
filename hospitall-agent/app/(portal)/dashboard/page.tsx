'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePatient } from '@/lib/hooks/use-patient';
import { useSettings } from '@/lib/hooks/use-settings';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { SummaryCard, TimelineEvent, TimelineEventType } from '@/app/components/dashboard';
import styles from './page.module.css';

// AI Insights state type
type AIInsightsState = {
  isLoading: boolean;
  insights: string | null;
  lastFetchedPatientId: string | null;
};

/**
 * Icons for summary cards
 */
const HealthIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M22 12H18L15 21L9 3L6 12H2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const MedicationsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M10.5 20.5L3.5 13.5C2.83696 12.837 2.46447 11.9385 2.46447 11C2.46447 10.0616 2.83696 9.16304 3.5 8.50001L8.5 3.50001C9.16304 2.83696 10.0616 2.46448 11 2.46448C11.9385 2.46448 12.837 2.83696 13.5 3.50001L20.5 10.5C21.163 11.163 21.5355 12.0616 21.5355 13C21.5355 13.9385 21.163 14.837 20.5 15.5L15.5 20.5C14.837 21.163 13.9385 21.5355 13 21.5355C12.0616 21.5355 11.163 21.163 10.5 20.5Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M7 17L17 7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LabsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M14.5 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V7.5L14.5 2Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 2V8H20M16 13H8M16 17H8M10 9H8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M19 4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M16 2V6M8 2V6M3 10H21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Gets a greeting based on time of day
 */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Formats the current date
 */
function getCurrentDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Dashboard Page Component
 *
 * Main patient dashboard page showing:
 * - Welcome section with greeting
 * - Summary cards (Health, Medications, Labs, Upcoming)
 * - Recent timeline of events
 * - Quick action buttons
 *
 * Uses the global chatPatientContext for patient info.
 */
export default function DashboardPage() {
  const { activePatient, chatPatientContext, setShowPatientSelector } = usePatient();
  const { settings } = useSettings();

  // Use chatPatientContext as the primary patient source
  // Fall back to activePatient for full data if available
  const currentPatient = chatPatientContext;

  // AI Health Insights state
  const [aiInsights, setAiInsights] = useState<AIInsightsState>({
    isLoading: false,
    insights: null,
    lastFetchedPatientId: null,
  });

  // Fetch AI insights when patient changes
  const fetchInsights = useCallback(async () => {
    if (!currentPatient) return;

    // Skip if we already have insights for this patient
    if (aiInsights.lastFetchedPatientId === currentPatient.id) return;

    setAiInsights({ isLoading: true, insights: null, lastFetchedPatientId: null });

    try {
      // Use chatPatientContext data
      const conditions = currentPatient.conditions.join(', ');
      const medications = currentPatient.medications.map((m) => m.name).join(', ');
      const allergies = currentPatient.allergies.map((a) => `${a.allergen} (${a.severity})`).join(', ');

      const prompt = `Based on my current health profile, provide 2-3 brief, actionable health insights or recommendations.
Patient: ${currentPatient.name}, ${currentPatient.age} years old, ${currentPatient.sex}
My conditions: ${conditions || 'None'}
My medications: ${medications || 'None'}
My allergies: ${allergies || 'None'}
Smoking: ${currentPatient.smokingStatus}, Alcohol: ${currentPatient.alcoholUse}
Keep each insight to 1-2 sentences. Focus on practical advice I can act on today.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          sessionId: `insights-${currentPatient.id}-${Date.now()}`,
          patientContext: currentPatient,
        }),
      });

      if (!response.ok) throw new Error('Failed to get insights');

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
          // Parse SSE format
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'text-delta' && parsed.delta) {
                fullResponse += parsed.delta;
              }
            } catch {
              // Skip malformed JSON
            }
          }
        }
      }

      setAiInsights({
        isLoading: false,
        insights: fullResponse,
        lastFetchedPatientId: currentPatient.id,
      });
    } catch {
      setAiInsights({
        isLoading: false,
        insights: null,
        lastFetchedPatientId: currentPatient.id,
      });
    }
  }, [currentPatient, aiInsights.lastFetchedPatientId]);

  // Reset insights when patient changes (don't auto-fetch)
  useEffect(() => {
    if (currentPatient && aiInsights.lastFetchedPatientId !== currentPatient.id && aiInsights.insights !== null) {
      // Reset state when patient changes, but don't auto-fetch
      setAiInsights({ isLoading: false, insights: null, lastFetchedPatientId: null });
    }
  }, [currentPatient, aiInsights.lastFetchedPatientId, aiInsights.insights]);

  // Calculate dashboard statistics from patient context data
  const stats = useMemo(() => {
    if (!currentPatient) {
      return {
        activeConditions: 0,
        activeMedications: 0,
        allergiesCount: 0,
        recentLabResults: 0,
        abnormalLabs: 0,
        upcomingVisits: 0,
        nextVisitDate: null as string | null,
      };
    }

    // Use chatPatientContext data
    const activeConditions = currentPatient.conditions.length;
    const activeMedications = currentPatient.medications.length;
    const allergiesCount = currentPatient.allergies.length;

    // These are not available in simplified patient context
    // Show placeholder values
    const recentLabResults = 0;
    const abnormalLabs = 0;
    const upcomingVisits = 0;
    const nextVisitDate = null;

    return {
      activeConditions,
      activeMedications,
      allergiesCount,
      recentLabResults,
      abnormalLabs,
      upcomingVisits,
      nextVisitDate,
    };
  }, [currentPatient]);

  // Generate timeline events from patient data
  // Note: chatPatientContext doesn't have visit/lab history, so we show conditions as "events"
  const timelineEvents = useMemo(() => {
    if (!currentPatient) return [];

    interface TimelineItem {
      id: string;
      title: string;
      date: string;
      type: TimelineEventType;
      summary: string;
      badge?: string;
      badgeVariant?: 'default' | 'emergency' | 'urgent' | 'routine' | 'success' | 'warning' | 'info';
    }

    const events: TimelineItem[] = [];
    const today = new Date().toISOString().split('T')[0];

    // Show conditions as health events
    currentPatient.conditions.forEach((condition, index) => {
      events.push({
        id: `condition-${index}`,
        title: condition,
        date: today,
        type: 'condition' as TimelineEventType,
        summary: 'Active condition being managed',
        badge: 'Active',
        badgeVariant: 'info' as const,
      });
    });

    // Show severe allergies as alerts
    currentPatient.allergies
      .filter((a) => a.severity === 'severe')
      .forEach((allergy, index) => {
        events.push({
          id: `allergy-${index}`,
          title: `Allergy Alert: ${allergy.allergen}`,
          date: today,
          type: 'alert' as TimelineEventType,
          summary: allergy.reaction || 'Severe allergic reaction risk',
          badge: 'Severe',
          badgeVariant: 'warning' as const,
        });
      });

    return events.slice(0, 5);
  }, [currentPatient]);

  // Format next medication reminder (simplified)
  const nextMedicationReminder = useMemo(() => {
    if (!currentPatient || currentPatient.medications.length === 0) return null;

    const meds = currentPatient.medications;
    if (meds.length === 0) return null;

    // Show first medication as reminder
    return `${meds[0].name} ${meds[0].dosage} - ${meds[0].frequency}`;
  }, [currentPatient]);

  // Loading state when no patient is selected
  if (!currentPatient) {
    return (
      <div className={styles.dashboard}>
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="7"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className={styles.emptyTitle}>No Patient Selected</h2>
          <p className={styles.emptyDescription}>
            Please select a patient profile to view the dashboard.
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => setShowPatientSelector(true)}
            style={{ marginTop: '1rem' }}
          >
            Select Patient
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* Welcome Section */}
      <section className={styles.welcomeSection}>
        <div className={styles.welcomeContent}>
          <h1 className={styles.greeting}>
            {getGreeting()}, {currentPatient.name.split(' ')[0]}
          </h1>
          <p className={styles.date}>{getCurrentDate()}</p>
        </div>
      </section>

      {/* Summary Cards Grid */}
      <section className={styles.summarySection} aria-label="Health summary">
        <div className={styles.summaryGrid}>
          {/* Health Status Card */}
          <SummaryCard
            title="Health Status"
            value={stats.activeConditions}
            valueLabel="active conditions"
            description={
              stats.activeConditions > 0
                ? `Managing ${stats.activeConditions} condition${stats.activeConditions > 1 ? 's' : ''}`
                : 'No active conditions'
            }
            icon={<HealthIcon />}
            variant="health"
            badge={stats.activeConditions > 2 ? 'Monitor' : undefined}
            badgeVariant="info"
          />

          {/* Medications Card */}
          <SummaryCard
            title="Medications"
            value={stats.activeMedications}
            valueLabel="active"
            description={nextMedicationReminder || 'No active medications'}
            icon={<MedicationsIcon />}
            variant="medications"
          />

          {/* Allergies Card */}
          <SummaryCard
            title="Allergies"
            value={stats.allergiesCount}
            valueLabel="recorded"
            description={
              stats.allergiesCount > 0
                ? `${currentPatient.allergies.filter(a => a.severity === 'severe').length} severe allergies`
                : 'No allergies recorded'
            }
            icon={<LabsIcon />}
            variant="labs"
            badge={currentPatient.allergies.some(a => a.severity === 'severe') ? 'Alert' : undefined}
            badgeVariant={currentPatient.allergies.some(a => a.severity === 'severe') ? 'warning' : undefined}
          />

          {/* Upcoming Card */}
          <SummaryCard
            title="Follow-ups"
            value={stats.upcomingVisits}
            valueLabel="scheduled"
            description={
              stats.nextVisitDate
                ? `Last visit: ${new Date(stats.nextVisitDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : 'No upcoming appointments'
            }
            icon={<CalendarIcon />}
            variant="upcoming"
          />
        </div>
      </section>

      {/* AI Health Insights Section */}
      <section className={styles.insightsSection} aria-label="AI Health Insights">
        <Card padding="lg" shadow="sm" rounded="lg" className={styles.insightsCard}>
          <div className={styles.insightsHeader}>
            <div className={styles.insightsIconWrapper}>
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
            </div>
            <div>
              <h2 className={styles.insightsTitle}>Health Insights</h2>
              <p className={styles.insightsSubtitle}>Personalized recommendations from your AI health assistant</p>
            </div>
          </div>

          <div className={styles.insightsContent}>
            {aiInsights.isLoading ? (
              <div className={styles.insightsLoading}>
                <div className={styles.insightsSpinner} />
                <span>Analyzing your health profile...</span>
              </div>
            ) : aiInsights.insights ? (
              <>
                <div className={styles.insightsText}>
                  {aiInsights.insights.split('\n').map((line, i) => (
                    line.trim() && <p key={i}>{line}</p>
                  ))}
                </div>
                <div className={styles.insightsBranding}>
                  Powered by <span>Genaima AI</span>
                </div>
              </>
            ) : (
              <div className={styles.insightsPrompt}>
                <p>Get personalized health recommendations based on your conditions, medications, and recent lab results.</p>
                <Button
                  variant="primary"
                  size="md"
                  onClick={fetchInsights}
                  className={styles.generateButton}
                >
                  <svg
                    width="20"
                    height="20"
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
                  Generate Insights
                </Button>
              </div>
            )}
          </div>

          {aiInsights.insights && (
            <div className={styles.insightsActions}>
              <Link href="/consultation">
                <Button variant="primary" size="sm">
                  Chat with AI
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchInsights}
                disabled={aiInsights.isLoading}
              >
                Refresh Insights
              </Button>
            </div>
          )}
        </Card>
      </section>

      {/* Recent Timeline Section */}
      <section className={styles.timelineSection}>
        <Card padding="lg" shadow="sm" rounded="lg">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Recent Activity</h2>
            <Link href="/history" className={styles.viewAllLink}>
              View all
            </Link>
          </div>

          {timelineEvents.length > 0 ? (
            <div className={styles.timeline}>
              {timelineEvents.map((event, index) => (
                <TimelineEvent
                  key={event.id}
                  title={event.title}
                  date={event.date}
                  type={event.type}
                  summary={event.summary}
                  badge={event.badge}
                  badgeVariant={event.badgeVariant}
                  isLast={index === timelineEvents.length - 1}
                />
              ))}
            </div>
          ) : (
            <p className={styles.noEvents}>No recent activity to display.</p>
          )}
        </Card>
      </section>

      {/* Quick Actions Section */}
      <section className={styles.quickActionsSection} aria-label="Quick actions">
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.quickActionsGrid}>
          <Link href="/consultation" className={styles.actionLink}>
            <Button variant="primary" size="lg" className={styles.actionButton}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M21 15C21 15.5304 20.7893 16.0391 20.4142 16.4142C20.0391 16.7893 19.5304 17 19 17H7L3 21V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H19C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V15Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Start New Chat
            </Button>
          </Link>

          <Link href="/history" className={styles.actionLink}>
            <Button variant="secondary" size="lg" className={styles.actionButton}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="2"
                />
                <path
                  d="M12 6V12L16 14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              View Full History
            </Button>
          </Link>

          <Link href="/recommendations" className={styles.actionLink}>
            <Button variant="secondary" size="lg" className={styles.actionButton}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle
                  cx="9"
                  cy="7"
                  r="4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Find a Doctor
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
