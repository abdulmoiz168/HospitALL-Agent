'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRole } from '@/lib/hooks';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { DEFAULT_SYSTEM_PROMPT } from '@/mastra/data/default-settings';
import styles from './page.module.css';

/**
 * Icons
 */
const SettingsIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    <path
      d="M12 2V4M12 20V22M22 12H20M4 12H2M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07M19.07 19.07L17.66 17.66M6.34 6.34L4.93 4.93"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
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

/**
 * Admin Settings Page
 *
 * Settings management page for administrators including:
 * - System prompt editor (saved to Supabase, applies to ALL users)
 */
export default function SettingsPage() {
  const { isAdmin } = useRole();

  // State for system prompt
  const [serverPrompt, setServerPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [localPrompt, setLocalPrompt] = useState<string>(DEFAULT_SYSTEM_PROMPT);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch system prompt from server on mount
  useEffect(() => {
    async function fetchSystemPrompt() {
      try {
        const response = await fetch('/api/admin/settings');
        if (response.ok) {
          const data = await response.json();
          const prompt = data.settings?.systemPrompt || DEFAULT_SYSTEM_PROMPT;
          setServerPrompt(prompt);
          setLocalPrompt(prompt);
        } else if (response.status === 401 || response.status === 403) {
          // Not authorized, use default
          setServerPrompt(DEFAULT_SYSTEM_PROMPT);
          setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
        }
      } catch (error) {
        console.error('Failed to fetch system prompt:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (isAdmin) {
      fetchSystemPrompt();
    } else {
      setIsLoading(false);
    }
  }, [isAdmin]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return localPrompt !== serverPrompt;
  }, [localPrompt, serverPrompt]);

  // Character count for system prompt
  const characterCount = localPrompt.length;
  const maxCharacters = 10000;

  // Handle system prompt save to Supabase via API
  const handleSavePrompt = useCallback(async () => {
    setSaveStatus('saving');
    setErrorMessage(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          settings: {
            systemPrompt: localPrompt,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save settings');
      }

      setServerPrompt(localPrompt);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [localPrompt]);

  // Handle reset to default
  const handleResetPrompt = useCallback(() => {
    setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
  }, []);

  // If not admin, show access denied
  if (!isAdmin) {
    return (
      <div className={styles.settingsPage}>
        <div className={styles.accessDenied}>
          <div className={styles.accessDeniedIcon}>
            <LockIcon />
          </div>
          <h2 className={styles.accessDeniedTitle}>Access Denied</h2>
          <p className={styles.accessDeniedDescription}>
            You need administrator privileges to access this page.
            Please switch to admin mode to view and modify settings.
          </p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={styles.settingsPage}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      {/* Page Header */}
      <header className={styles.pageHeader}>
        <div className={styles.headerIcon}>
          <SettingsIcon />
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>Admin Settings</h1>
          <p className={styles.pageDescription}>
            Configure the AI assistant&apos;s system prompt. Changes apply to ALL users.
          </p>
        </div>
      </header>

      <div className={styles.settingsGrid}>
        {/* System Prompt Editor */}
        <section className={styles.section}>
          <Card padding="lg" shadow="sm" rounded="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>System Prompt</h2>
              <p className={styles.sectionDescription}>
                Configure the AI assistant&apos;s personality and behavior instructions.
                This prompt is stored in the database and applies to all users.
              </p>
            </div>

            <div className={styles.promptEditor}>
              <div className={styles.promptTextareaWrapper}>
                <textarea
                  className={styles.promptTextarea}
                  value={localPrompt}
                  onChange={(e) => setLocalPrompt(e.target.value)}
                  placeholder="Enter the system prompt..."
                  maxLength={maxCharacters}
                  rows={12}
                  aria-label="System prompt"
                />
                <div className={styles.characterCount}>
                  <span className={characterCount > maxCharacters * 0.9 ? styles.characterCountWarning : ''}>
                    {characterCount.toLocaleString()}
                  </span>
                  <span className={styles.characterCountDivider}>/</span>
                  <span>{maxCharacters.toLocaleString()}</span>
                </div>
              </div>

              <div className={styles.promptActions}>
                <Button
                  variant="ghost"
                  size="md"
                  onClick={handleResetPrompt}
                  disabled={localPrompt === DEFAULT_SYSTEM_PROMPT}
                >
                  Reset to Default
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleSavePrompt}
                  disabled={!hasUnsavedChanges || saveStatus === 'saving'}
                  loading={saveStatus === 'saving'}
                >
                  {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Changes'}
                </Button>
              </div>

              {hasUnsavedChanges && (
                <p className={styles.unsavedWarning}>
                  You have unsaved changes to the system prompt.
                </p>
              )}

              {errorMessage && (
                <p className={styles.errorMessage}>
                  {errorMessage}
                </p>
              )}
            </div>
          </Card>
        </section>

      </div>
    </div>
  );
}
