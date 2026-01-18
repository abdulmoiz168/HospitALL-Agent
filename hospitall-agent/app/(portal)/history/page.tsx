'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { usePatient } from '@/lib/hooks/use-patient';
import { Card } from '@/app/components/ui/Card';
import { Badge, BadgeVariant } from '@/app/components/ui/Badge';
import { SummaryCard } from '@/app/components/dashboard';
import styles from './page.module.css';

/**
 * Event type for timeline items
 */
type HistoryEventType = 'visit' | 'lab_result' | 'upload';

/**
 * Filter type options
 */
type FilterType = 'all' | 'visits' | 'labs' | 'uploads';

/**
 * Date range filter options
 */
type DateRangeFilter = 'last_30' | 'last_90' | 'all_time';

/**
 * Unified timeline event interface
 */
interface HistoryEvent {
  id: string;
  type: HistoryEventType;
  title: string;
  date: string;
  summary: string;
  details: string[];
  badge?: string;
  badgeVariant?: BadgeVariant;
}

/**
 * Icons for summary cards
 */
const VisitsIcon = () => (
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

const DocumentsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M17 8L12 3L7 8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 3V15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const TimeSpanIcon = () => (
  <svg
    width="24"
    height="24"
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
);

/**
 * Returns the appropriate icon for the event type
 */
function getEventIcon(type: HistoryEventType): React.ReactNode {
  switch (type) {
    case 'visit':
      return (
        <svg
          width="16"
          height="16"
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
    case 'lab_result':
      return (
        <svg
          width="16"
          height="16"
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
    case 'upload':
      return (
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M17 8L12 3L7 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 3V15"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
  }
}

/**
 * Formats a date string for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Formats a date for group headers
 */
function formatGroupDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

/**
 * Calculate time span between earliest and latest dates
 */
function calculateTimeSpan(dates: string[]): string {
  if (dates.length === 0) return 'No records';
  if (dates.length === 1) return '1 day';

  const sortedDates = dates.map((d) => new Date(d).getTime()).sort((a, b) => a - b);
  const earliest = sortedDates[0];
  const latest = sortedDates[sortedDates.length - 1];
  const diffDays = Math.ceil((latest - earliest) / (1000 * 60 * 60 * 24));

  if (diffDays < 30) {
    return `${diffDays} days`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''}`;
  } else {
    const years = Math.floor(diffDays / 365);
    const remainingMonths = Math.floor((diffDays % 365) / 30);
    if (remainingMonths > 0) {
      return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
    }
    return `${years} year${years > 1 ? 's' : ''}`;
  }
}

/**
 * ExpandableTimelineItem component
 */
interface ExpandableTimelineItemProps {
  event: HistoryEvent;
  isExpanded: boolean;
  onToggle: () => void;
  isLast: boolean;
}

function ExpandableTimelineItem({
  event,
  isExpanded,
  onToggle,
  isLast,
}: ExpandableTimelineItemProps) {
  const itemClasses = [
    styles.timelineItem,
    styles[`type-${event.type}`],
    isExpanded ? styles.expanded : '',
    isLast ? styles.isLast : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={itemClasses}>
      {/* Timeline Line */}
      <div className={styles.timeline}>
        <div className={styles.iconWrapper}>
          {getEventIcon(event.type)}
        </div>
        {!isLast && <div className={styles.connector} />}
      </div>

      {/* Event Content */}
      <div className={styles.eventContent}>
        <button
          type="button"
          className={styles.eventHeader}
          onClick={onToggle}
          aria-expanded={isExpanded}
        >
          <div className={styles.eventMeta}>
            <span className={styles.eventDate}>
              {new Date(event.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {event.badge && (
              <Badge variant={event.badgeVariant || 'default'} size="sm">
                {event.badge}
              </Badge>
            )}
          </div>
          <h4 className={styles.eventTitle}>{event.title}</h4>
          <p className={styles.eventSummary}>{event.summary}</p>
          <div className={styles.expandIcon}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className={isExpanded ? styles.rotated : ''}
            >
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </button>

        {/* Expandable Details */}
        {isExpanded && (
          <div className={styles.eventDetails}>
            <div className={styles.detailsContent}>
              {event.details.length > 0 ? (
                <ul className={styles.detailsList}>
                  {event.details.map((detail, index) => (
                    <li key={index} className={styles.detailItem}>
                      {detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={styles.noDetails}>No additional details available.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * History Page Component
 *
 * Displays patient history with:
 * - Summary cards showing counts
 * - Filter controls for type and date range
 * - Expandable timeline grouped by date
 */
export default function HistoryPage() {
  const { activePatient, sessionDocuments } = usePatient();

  // Filter state
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>('all_time');

  // Expanded items state
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Toggle item expansion
  const toggleItem = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }, []);

  // Calculate summary statistics
  const stats = useMemo(() => {
    if (!activePatient) {
      return {
        totalVisits: 0,
        totalLabTests: 0,
        totalDocuments: 0,
        timeSpan: 'No records',
        allDates: [] as string[],
      };
    }

    const totalVisits = activePatient.visits.length;
    const totalLabTests = activePatient.labResults.length;
    const totalDocuments = sessionDocuments.length;

    // Collect all dates for time span calculation
    const allDates = [
      ...activePatient.visits.map((v) => v.date),
      ...activePatient.labResults.map((l) => l.date),
    ];

    const timeSpan = calculateTimeSpan(allDates);

    return {
      totalVisits,
      totalLabTests,
      totalDocuments,
      timeSpan,
      allDates,
    };
  }, [activePatient, sessionDocuments]);

  // Generate timeline events from patient data
  const allEvents = useMemo((): HistoryEvent[] => {
    if (!activePatient) return [];

    const events: HistoryEvent[] = [];

    // Add visits
    activePatient.visits.forEach((visit, index) => {
      const typeLabel = visit.type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
      events.push({
        id: `visit-${index}`,
        type: 'visit',
        title: `${typeLabel} - ${visit.doctor}`,
        date: visit.date,
        summary: visit.summary,
        details: [
          `Doctor: ${visit.doctor}`,
          visit.specialty ? `Specialty: ${visit.specialty}` : '',
          `Type: ${typeLabel}`,
          visit.followUpRequired ? 'Follow-up required' : 'No follow-up needed',
          visit.summary,
        ].filter(Boolean),
        badge: visit.specialty,
        badgeVariant: 'info',
      });
    });

    // Add lab results
    activePatient.labResults.forEach((lab, index) => {
      const statusLabels: Record<string, string> = {
        normal: 'Normal',
        abnormal_low: 'Low',
        abnormal_high: 'High',
        critical: 'Critical',
      };
      const statusBadgeVariants: Record<string, BadgeVariant> = {
        normal: 'success',
        abnormal_low: 'warning',
        abnormal_high: 'warning',
        critical: 'emergency',
      };

      events.push({
        id: `lab-${index}`,
        type: 'lab_result',
        title: lab.test,
        date: lab.date,
        summary: `${lab.value} ${lab.unit} (Reference: ${lab.referenceRange})`,
        details: [
          `Test: ${lab.test}`,
          `Result: ${lab.value} ${lab.unit}`,
          `Reference Range: ${lab.referenceRange}`,
          `Status: ${lab.status ? statusLabels[lab.status] : 'Pending'}`,
          lab.notes ? `Notes: ${lab.notes}` : '',
        ].filter(Boolean),
        badge: lab.status ? statusLabels[lab.status] : undefined,
        badgeVariant: lab.status ? statusBadgeVariants[lab.status] : undefined,
      });
    });

    // Add session documents as uploads
    sessionDocuments.forEach((doc, index) => {
      events.push({
        id: `upload-${index}`,
        type: 'upload',
        title: doc.name,
        date: new Date(doc.uploadedAt).toISOString().split('T')[0],
        summary: `Uploaded document - ${doc.type || 'Unknown type'}`,
        details: [
          `File name: ${doc.name}`,
          `Type: ${doc.type || 'Unknown'}`,
          `Uploaded: ${new Date(doc.uploadedAt).toLocaleString()}`,
        ],
        badge: 'Uploaded',
        badgeVariant: 'info',
      });
    });

    return events;
  }, [activePatient, sessionDocuments]);

  // Apply filters
  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    // Apply type filter
    if (filterType !== 'all') {
      const typeMap: Record<FilterType, HistoryEventType | null> = {
        all: null,
        visits: 'visit',
        labs: 'lab_result',
        uploads: 'upload',
      };
      const targetType = typeMap[filterType];
      if (targetType) {
        events = events.filter((e) => e.type === targetType);
      }
    }

    // Apply date range filter
    if (dateRange !== 'all_time') {
      const now = new Date();
      let cutoffDate: Date;

      if (dateRange === 'last_30') {
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      }

      events = events.filter((e) => new Date(e.date) >= cutoffDate);
    }

    // Sort by date descending
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return events;
  }, [allEvents, filterType, dateRange]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Map<string, HistoryEvent[]> = new Map();

    filteredEvents.forEach((event) => {
      const dateKey = event.date;
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(event);
    });

    return groups;
  }, [filteredEvents]);

  // Empty state when no patient selected
  if (!activePatient) {
    return (
      <div className={styles.historyPage}>
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
            Please select a patient profile from the header to view their history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.historyPage}>
      {/* Page Header */}
      <section className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Medical History</h1>
        <p className={styles.pageSubtitle}>
          Complete record of visits, lab results, and documents for{' '}
          {activePatient.demographics.firstName} {activePatient.demographics.lastName}
        </p>
      </section>

      {/* Summary Cards */}
      <section className={styles.summarySection} aria-label="History summary">
        <div className={styles.summaryGrid}>
          <SummaryCard
            title="Total Visits"
            value={stats.totalVisits}
            valueLabel="visits"
            description={stats.totalVisits > 0 ? 'All recorded visits' : 'No visits recorded'}
            icon={<VisitsIcon />}
            variant="health"
          />
          <SummaryCard
            title="Lab Tests"
            value={stats.totalLabTests}
            valueLabel="tests"
            description={stats.totalLabTests > 0 ? 'All lab results' : 'No lab tests recorded'}
            icon={<LabsIcon />}
            variant="labs"
          />
          <SummaryCard
            title="Documents"
            value={stats.totalDocuments}
            valueLabel="uploaded"
            description={stats.totalDocuments > 0 ? 'Session uploads' : 'No documents uploaded'}
            icon={<DocumentsIcon />}
            variant="medications"
          />
          <SummaryCard
            title="Time Span"
            value={stats.timeSpan.split(' ')[0] || '-'}
            valueLabel={stats.timeSpan.split(' ').slice(1).join(' ') || ''}
            description="Record coverage"
            icon={<TimeSpanIcon />}
            variant="upcoming"
          />
        </div>
      </section>

      {/* Filter Controls */}
      <section className={styles.filterSection}>
        <Card padding="md" shadow="sm" rounded="lg">
          <div className={styles.filterControls}>
            {/* Type Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Filter by type</label>
              <div className={styles.filterButtons}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'visits', label: 'Visits' },
                  { value: 'labs', label: 'Labs' },
                  { value: 'uploads', label: 'Uploads' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.filterButton} ${filterType === option.value ? styles.active : ''}`}
                    onClick={() => setFilterType(option.value as FilterType)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Date range</label>
              <div className={styles.filterButtons}>
                {[
                  { value: 'last_30', label: 'Last 30 days' },
                  { value: 'last_90', label: 'Last 90 days' },
                  { value: 'all_time', label: 'All time' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`${styles.filterButton} ${dateRange === option.value ? styles.active : ''}`}
                    onClick={() => setDateRange(option.value as DateRangeFilter)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </section>

      {/* Timeline Section */}
      <section className={styles.timelineSection}>
        <Card padding="lg" shadow="sm" rounded="lg">
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Timeline</h2>
            <span className={styles.eventCount}>
              {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {filteredEvents.length > 0 ? (
            <div className={styles.timelineContent}>
              {Array.from(groupedEvents.entries()).map(([date, events], groupIndex) => (
                <div key={date} className={styles.dateGroup}>
                  <div className={styles.dateHeader}>
                    <span className={styles.dateLabel}>{formatGroupDate(date)}</span>
                    <span className={styles.fullDate}>{formatDate(date)}</span>
                  </div>
                  <div className={styles.groupEvents}>
                    {events.map((event, eventIndex) => {
                      const isLastInGroup = eventIndex === events.length - 1;
                      const isLastGroup = groupIndex === groupedEvents.size - 1;
                      const isLast = isLastInGroup && isLastGroup;

                      return (
                        <ExpandableTimelineItem
                          key={event.id}
                          event={event}
                          isExpanded={expandedItems.has(event.id)}
                          onToggle={() => toggleItem(event.id)}
                          isLast={isLast}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noEventsState}>
              <div className={styles.noEventsIcon}>
                <svg
                  width="48"
                  height="48"
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
              </div>
              <h3 className={styles.noEventsTitle}>No Events Found</h3>
              <p className={styles.noEventsDescription}>
                {filterType === 'all' && dateRange === 'all_time'
                  ? 'No medical history has been recorded yet.'
                  : 'Try adjusting your filters to see more events.'}
              </p>
            </div>
          )}
        </Card>
      </section>
    </div>
  );
}
