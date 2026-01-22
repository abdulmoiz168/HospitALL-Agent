'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRole } from '@/lib/hooks';
import { Card } from '@/app/components/ui/Card';
import styles from './page.module.css';

interface UsageSummary {
  totalRequests: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCostCents: number;
  avgLatencyMs: number;
  uniqueUsers: number;
  llmRequests: number;
}

interface DailyUsage {
  date: string;
  requests: number;
  tokens: number;
  costCents: number;
}

interface IntentBreakdown {
  intent: string;
  count: number;
}

interface RecentConversation {
  id: string;
  sessionId: string;
  intent: string | null;
  sanitizedMessage: string;
  responseSummary: string | null;
  createdAt: string;
}

interface RecentError {
  id: string;
  endpoint: string;
  errorType: string;
  errorMessage: string;
  createdAt: string;
}

interface AnalyticsData {
  summary: UsageSummary;
  dailyUsage: DailyUsage[];
  intentBreakdown: IntentBreakdown[];
  recentConversations: RecentConversation[];
  recentErrors: RecentError[];
  feedbackStats: {
    positive: number;
    negative: number;
  };
}

/**
 * Icons
 */
const AnalyticsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      d="M18 20V10M12 20V4M6 20V14"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LockIcon = () => (
  <svg
    width="48"
    height="48"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <rect
      x="3"
      y="11"
      width="18"
      height="11"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M7 11V7C7 4.23858 9.23858 2 12 2C14.7614 2 17 4.23858 17 7V11"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Admin Analytics Dashboard
 *
 * Displays usage metrics, conversation logs, and system statistics.
 * Only accessible to admin users.
 */
export default function AnalyticsPage() {
  const { isAdmin } = useRole();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState(7);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?days=${periodDays}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.analytics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [periodDays]);

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin, fetchAnalytics]);

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className={styles.analyticsPage}>
        <div className={styles.accessDenied}>
          <div className={styles.accessDeniedIcon}>
            <LockIcon />
          </div>
          <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
          <p className={styles.accessDeniedDescription}>
            You need administrator privileges to access analytics.
            Please switch to admin mode to view usage metrics and logs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analyticsPage}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <AnalyticsIcon />
          </div>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>Analytics Dashboard</h1>
            <p className={styles.pageDescription}>
              Usage metrics, conversation logs, and system statistics.
            </p>
          </div>
        </div>
        <div className={styles.periodSelector}>
          {[7, 14, 30].map((days) => (
            <button
              key={days}
              className={`${styles.periodButton} ${periodDays === days ? styles.periodButtonActive : ''}`}
              onClick={() => setPeriodDays(days)}
            >
              {days}d
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p className={styles.loadingText}>Loading analytics...</p>
        </div>
      ) : error ? (
        <Card padding="lg" shadow="sm" rounded="lg">
          <div className={styles.emptyState}>
            <p>Error: {error}</p>
          </div>
        </Card>
      ) : analytics ? (
        <>
          {/* Stats Grid */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Requests</span>
              <span className={styles.statValue}>{formatNumber(analytics.summary.totalRequests)}</span>
              <span className={styles.statSubtext}>{analytics.summary.llmRequests} used LLM</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Total Tokens</span>
              <span className={styles.statValue}>{formatNumber(analytics.summary.totalTokens)}</span>
              <span className={styles.statSubtext}>
                {formatNumber(analytics.summary.totalInputTokens)} in / {formatNumber(analytics.summary.totalOutputTokens)} out
              </span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Estimated Cost</span>
              <span className={styles.statValue}>{formatCost(analytics.summary.estimatedCostCents)}</span>
              <span className={styles.statSubtext}>Last {periodDays} days</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statLabel}>Avg Latency</span>
              <span className={styles.statValue}>{analytics.summary.avgLatencyMs}ms</span>
              <span className={styles.statSubtext}>{analytics.summary.uniqueUsers} unique users</span>
            </div>
          </div>

          {/* Content Grid */}
          <div className={styles.contentGrid}>
            {/* Recent Conversations */}
            <section className={styles.section}>
              <Card padding="lg" shadow="sm" rounded="lg">
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Recent Conversations</h2>
                </div>
                {analytics.recentConversations.length > 0 ? (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Time</th>
                          <th>Intent</th>
                          <th>Message (PHI-stripped)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.recentConversations.map((conv) => (
                          <tr key={conv.id}>
                            <td className={styles.timestamp}>{formatDate(conv.createdAt)}</td>
                            <td>
                              {conv.intent && (
                                <span className={styles.intentBadge}>{conv.intent}</span>
                              )}
                            </td>
                            <td className={styles.messageCell} title={conv.sanitizedMessage}>
                              {conv.sanitizedMessage}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className={styles.emptyState}>
                    <p>No conversations yet. Start using the app to see logs here.</p>
                  </div>
                )}
              </Card>
            </section>

            {/* Sidebar: Intent Breakdown & Feedback */}
            <div>
              {/* Intent Breakdown */}
              <section className={styles.section}>
                <Card padding="lg" shadow="sm" rounded="lg">
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>Intent Breakdown</h2>
                  </div>
                  {analytics.intentBreakdown.length > 0 ? (
                    <div className={styles.intentList}>
                      {analytics.intentBreakdown.slice(0, 5).map((item) => (
                        <div key={item.intent} className={styles.intentItem}>
                          <span className={styles.intentName}>{item.intent}</span>
                          <span className={styles.intentCount}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyState}>
                      <p>No data yet.</p>
                    </div>
                  )}
                </Card>
              </section>

              {/* Feedback Stats */}
              <section className={styles.section} style={{ marginTop: 'var(--space-lg)' }}>
                <Card padding="lg" shadow="sm" rounded="lg">
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>User Feedback</h2>
                  </div>
                  <div className={styles.feedbackStats}>
                    <div className={`${styles.feedbackItem} ${styles.feedbackPositive}`}>
                      <div className={styles.feedbackIcon}>+</div>
                      <div className={styles.feedbackInfo}>
                        <span className={styles.feedbackLabel}>Positive</span>
                        <span className={styles.feedbackValue}>{analytics.feedbackStats.positive}</span>
                      </div>
                    </div>
                    <div className={`${styles.feedbackItem} ${styles.feedbackNegative}`}>
                      <div className={styles.feedbackIcon}>-</div>
                      <div className={styles.feedbackInfo}>
                        <span className={styles.feedbackLabel}>Negative</span>
                        <span className={styles.feedbackValue}>{analytics.feedbackStats.negative}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </section>
            </div>
          </div>

          {/* Recent Errors */}
          <section className={styles.section}>
            <Card padding="lg" shadow="sm" rounded="lg">
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Recent Errors</h2>
              </div>
              {analytics.recentErrors.length > 0 ? (
                <div className={styles.tableWrapper}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Endpoint</th>
                        <th>Type</th>
                        <th>Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recentErrors.map((err) => (
                        <tr key={err.id}>
                          <td className={styles.timestamp}>{formatDate(err.createdAt)}</td>
                          <td>{err.endpoint}</td>
                          <td>
                            <span className={`${styles.intentBadge} ${styles.errorBadge}`}>
                              {err.errorType}
                            </span>
                          </td>
                          <td className={styles.messageCell} title={err.errorMessage}>
                            {err.errorMessage}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.emptyState}>
                  <p>No errors recorded. Great job!</p>
                </div>
              )}
            </Card>
          </section>
        </>
      ) : null}
    </div>
  );
}
