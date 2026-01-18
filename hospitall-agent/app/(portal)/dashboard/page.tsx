'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePatient } from '@/lib/hooks/use-patient';
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
 */
export default function DashboardPage() {
  const { activePatient } = usePatient();

  // AI Health Insights state
  const [aiInsights, setAiInsights] = useState<AIInsightsState>({
    isLoading: false,
    insights: null,
    lastFetchedPatientId: null,
  });

  // Fetch AI insights when patient changes
  const fetchInsights = useCallback(async () => {
    if (!activePatient) return;

    // Skip if we already have insights for this patient
    if (aiInsights.lastFetchedPatientId === activePatient.demographics.id) return;

    setAiInsights({ isLoading: true, insights: null, lastFetchedPatientId: null });

    try {
      const conditions = activePatient.conditions
        .filter((c) => c.status === 'active' || c.status === 'chronic')
        .map((c) => c.name)
        .join(', ');

      const medications = activePatient.medications
        .filter((m) => m.status === 'active')
        .map((m) => m.name)
        .join(', ');

      const abnormalLabs = activePatient.labResults
        .filter((l) => l.status !== 'normal')
        .slice(0, 3)
        .map((l) => `${l.test}: ${l.value} ${l.unit}`)
        .join(', ');

      const prompt = `Based on my current health profile, provide 2-3 brief, actionable health insights or recommendations.
My conditions: ${conditions || 'None'}
My medications: ${medications || 'None'}
Recent abnormal labs: ${abnormalLabs || 'None'}
Keep each insight to 1-2 sentences. Focus on practical advice I can act on today.`;

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          sessionId: `insights-${activePatient.demographics.id}-${Date.now()}`,
          patientId: activePatient.demographics.id,
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

      setAiInsights({
        isLoading: false,
        insights: fullResponse,
        lastFetchedPatientId: activePatient.demographics.id,
      });
    } catch {
      setAiInsights({
        isLoading: false,
        insights: null,
        lastFetchedPatientId: activePatient.demographics.id,
      });
    }
  }, [activePatient, aiInsights.lastFetchedPatientId]);

  // Reset insights when patient changes (don't auto-fetch)
  useEffect(() => {
    if (activePatient && aiInsights.lastFetchedPatientId !== activePatient.demographics.id && aiInsights.insights !== null) {
      // Reset state when patient changes, but don't auto-fetch
      setAiInsights({ isLoading: false, insights: null, lastFetchedPatientId: null });
    }
  }, [activePatient, aiInsights.lastFetchedPatientId, aiInsights.insights]);

  // Calculate dashboard statistics from patient data
  const stats = useMemo(() => {
    if (!activePatient) {
      return {
        activeConditions: 0,
        activeMedications: 0,
        recentLabResults: 0,
        abnormalLabs: 0,
        upcomingVisits: 0,
        nextVisitDate: null as string | null,
      };
    }

    // Count active conditions
    const activeConditions = activePatient.conditions.filter(
      (c) => c.status === 'active' || c.status === 'chronic'
    ).length;

    // Count active medications
    const activeMedications = activePatient.medications.filter(
      (m) => m.status === 'active'
    ).length;

    // Count recent lab results (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentLabs = activePatient.labResults.filter(
      (lab) => new Date(lab.date) >= thirtyDaysAgo
    );
    const recentLabResults = recentLabs.length;

    // Count abnormal lab results
    const abnormalLabs = recentLabs.filter(
      (lab) =>
        lab.status === 'abnormal_high' ||
        lab.status === 'abnormal_low' ||
        lab.status === 'critical'
    ).length;

    // Find visits with follow-up required (simulating upcoming)
    const visitsWithFollowUp = activePatient.visits.filter(
      (v) => v.followUpRequired
    );
    const upcomingVisits = visitsWithFollowUp.length;

    // Get the most recent visit date as a proxy for next visit
    const sortedVisits = [...activePatient.visits].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const nextVisitDate = sortedVisits.length > 0 ? sortedVisits[0].date : null;

    return {
      activeConditions,
      activeMedications,
      recentLabResults,
      abnormalLabs,
      upcomingVisits,
      nextVisitDate,
    };
  }, [activePatient]);

  // Generate timeline events from patient data
  const timelineEvents = useMemo(() => {
    if (!activePatient) return [];

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

    // Add visits to timeline
    activePatient.visits.forEach((visit, index) => {
      events.push({
        id: `visit-${index}`,
        title: `${visit.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())} - ${visit.doctor}`,
        date: visit.date,
        type: 'visit' as TimelineEventType,
        summary: visit.summary,
        badge: visit.specialty,
        badgeVariant: 'info' as const,
      });
    });

    // Add recent lab results to timeline (group by date)
    const labsByDate = activePatient.labResults.reduce((acc, lab) => {
      if (!acc[lab.date]) {
        acc[lab.date] = [];
      }
      acc[lab.date].push(lab);
      return acc;
    }, {} as Record<string, typeof activePatient.labResults>);

    Object.entries(labsByDate).forEach(([date, labs]) => {
      const abnormalCount = labs.filter(
        (l) =>
          l.status === 'abnormal_high' ||
          l.status === 'abnormal_low' ||
          l.status === 'critical'
      ).length;

      events.push({
        id: `lab-${date}`,
        title: `Lab Results (${labs.length} tests)`,
        date,
        type: 'lab_result' as TimelineEventType,
        summary: labs.map((l) => l.test).slice(0, 3).join(', ') + (labs.length > 3 ? '...' : ''),
        badge: abnormalCount > 0 ? `${abnormalCount} abnormal` : undefined,
        badgeVariant: abnormalCount > 0 ? ('warning' as const) : undefined,
      });
    });

    // Sort by date descending and take the 5 most recent
    return events
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [activePatient]);

  // Format next medication reminder (simplified)
  const nextMedicationReminder = useMemo(() => {
    if (!activePatient || stats.activeMedications === 0) return null;

    const activeMeds = activePatient.medications.filter((m) => m.status === 'active');
    if (activeMeds.length === 0) return null;

    // Find medications that need to be taken multiple times
    const multiDoseMeds = activeMeds.filter(
      (m) =>
        m.frequency.toLowerCase().includes('twice') ||
        m.frequency.toLowerCase().includes('daily')
    );

    if (multiDoseMeds.length > 0) {
      return `${multiDoseMeds[0].name} - ${multiDoseMeds[0].frequency}`;
    }

    return `${activeMeds[0].name} - ${activeMeds[0].frequency}`;
  }, [activePatient, stats.activeMedications]);

  // Loading state when no patient is selected
  if (!activePatient) {
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
            Please select a patient profile from the header to view the dashboard.
          </p>
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
            {getGreeting()}, {activePatient.demographics.firstName}
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

          {/* Lab Results Card */}
          <SummaryCard
            title="Lab Results"
            value={stats.recentLabResults}
            valueLabel="recent tests"
            description={
              stats.abnormalLabs > 0
                ? `${stats.abnormalLabs} result${stats.abnormalLabs > 1 ? 's' : ''} need${stats.abnormalLabs === 1 ? 's' : ''} attention`
                : 'All results normal'
            }
            icon={<LabsIcon />}
            variant="labs"
            badge={stats.abnormalLabs > 0 ? 'Review' : undefined}
            badgeVariant={stats.abnormalLabs > 0 ? 'warning' : undefined}
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
