'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useSettings } from '@/lib/hooks';
import { useRole } from '@/lib/hooks';
import { Card } from '@/app/components/ui/Card';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import { DEFAULT_SYSTEM_PROMPT } from '@/mastra/data/default-settings';
import styles from './page.module.css';

/**
 * Toggle Switch Component
 * A simple on/off toggle with label and description
 */
interface ToggleSwitchProps {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  id,
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) => {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!disabled) {
        onChange(!checked);
      }
    }
  };

  return (
    <div className={styles.toggleItem}>
      <div className={styles.toggleInfo}>
        <label htmlFor={id} className={styles.toggleLabel}>
          {label}
        </label>
        <p className={styles.toggleDescription}>{description}</p>
      </div>
      <button
        type="button"
        id={id}
        role="switch"
        aria-checked={checked}
        className={`${styles.toggle} ${checked ? styles.toggleOn : styles.toggleOff}`}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      >
        <span className={styles.toggleThumb} />
      </button>
    </div>
  );
};

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
 * - System prompt editor
 * - Feature flags toggles
 * - Configuration options
 */
export default function SettingsPage() {
  const { isAdmin } = useRole();
  const {
    settings,
    updateSystemPrompt,
    updateFeatureFlags,
    resetToDefaults,
  } = useSettings();

  // Local state for unsaved changes
  const [localPrompt, setLocalPrompt] = useState(settings.systemPrompt);
  const [localMaxHistory, setLocalMaxHistory] = useState(
    settings.maxChatHistoryLength?.toString() || '50'
  );
  const [localSessionTimeout, setLocalSessionTimeout] = useState(
    settings.sessionTimeoutMinutes?.toString() || '30'
  );
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Sync local state with settings when they change
  React.useEffect(() => {
    setLocalPrompt(settings.systemPrompt);
    setLocalMaxHistory(settings.maxChatHistoryLength?.toString() || '50');
    setLocalSessionTimeout(settings.sessionTimeoutMinutes?.toString() || '30');
  }, [settings]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return localPrompt !== settings.systemPrompt;
  }, [localPrompt, settings.systemPrompt]);

  // Character count for system prompt
  const characterCount = localPrompt.length;
  const maxCharacters = 10000;

  // Handle system prompt save
  const handleSavePrompt = useCallback(() => {
    setSaveStatus('saving');
    try {
      updateSystemPrompt(localPrompt);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [localPrompt, updateSystemPrompt]);

  // Handle reset to default
  const handleResetPrompt = useCallback(() => {
    setLocalPrompt(DEFAULT_SYSTEM_PROMPT);
  }, []);

  // Handle feature flag toggle
  const handleFeatureFlagChange = useCallback(
    (flag: 'enableDoctorRecommendations' | 'enableDocumentUpload' | 'enablePatientHistory', value: boolean) => {
      updateFeatureFlags({ [flag]: value });
    },
    [updateFeatureFlags]
  );

  // Handle configuration changes
  const handleMaxHistoryChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLocalMaxHistory(e.target.value);
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        // We would update settings here, but since maxChatHistoryLength isn't in updateFeatureFlags
        // we'd need to extend the settings context. For now, just store locally.
      }
    },
    []
  );

  const handleSessionTimeoutChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setLocalSessionTimeout(e.target.value);
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value > 0) {
        // Same as above
      }
    },
    []
  );

  // Reset all settings
  const handleResetAll = useCallback(() => {
    if (window.confirm('Are you sure you want to reset all settings to their default values? This action cannot be undone.')) {
      resetToDefaults();
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  }, [resetToDefaults]);

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
            Configure system settings, feature flags, and application behavior.
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
                  disabled={!hasUnsavedChanges}
                  loading={saveStatus === 'saving'}
                >
                  {saveStatus === 'saved' ? 'Saved!' : 'Save Changes'}
                </Button>
              </div>

              {hasUnsavedChanges && (
                <p className={styles.unsavedWarning}>
                  You have unsaved changes to the system prompt.
                </p>
              )}
            </div>
          </Card>
        </section>

        {/* Feature Flags */}
        <section className={styles.section}>
          <Card padding="lg" shadow="sm" rounded="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Feature Flags</h2>
              <p className={styles.sectionDescription}>
                Enable or disable application features.
              </p>
            </div>

            <div className={styles.featureFlags}>
              <ToggleSwitch
                id="enable-doctor-recommendations"
                label="Enable Doctor Recommendations"
                description="Allow the AI to suggest appropriate doctors and specialists based on patient symptoms."
                checked={settings.featureFlags.enableDoctorRecommendations}
                onChange={(checked) => handleFeatureFlagChange('enableDoctorRecommendations', checked)}
              />

              <ToggleSwitch
                id="enable-document-upload"
                label="Enable Document Upload"
                description="Allow patients to upload medical documents during chat sessions."
                checked={settings.featureFlags.enableDocumentUpload}
                onChange={(checked) => handleFeatureFlagChange('enableDocumentUpload', checked)}
              />

              <ToggleSwitch
                id="enable-patient-history"
                label="Enable Patient History"
                description="Allow viewing of patient medical history and previous consultations."
                checked={settings.featureFlags.enablePatientHistory}
                onChange={(checked) => handleFeatureFlagChange('enablePatientHistory', checked)}
              />
            </div>
          </Card>
        </section>

        {/* Configuration Options */}
        <section className={styles.section}>
          <Card padding="lg" shadow="sm" rounded="lg">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Configuration</h2>
              <p className={styles.sectionDescription}>
                Adjust system behavior and limits.
              </p>
            </div>

            <div className={styles.configOptions}>
              <div className={styles.configItem}>
                <Input
                  label="Max Chat History Length"
                  type="number"
                  value={localMaxHistory}
                  onChange={handleMaxHistoryChange}
                  placeholder="50"
                />
                <p className={styles.configHelp}>
                  Maximum number of messages to retain in chat history.
                </p>
              </div>

              <div className={styles.configItem}>
                <Input
                  label="Session Timeout (minutes)"
                  type="number"
                  value={localSessionTimeout}
                  onChange={handleSessionTimeoutChange}
                  placeholder="30"
                />
                <p className={styles.configHelp}>
                  Duration of inactivity before a session expires.
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Reset All Settings */}
        <section className={styles.section}>
          <Card padding="lg" shadow="sm" rounded="lg" className={styles.dangerZone}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Danger Zone</h2>
              <p className={styles.sectionDescription}>
                Irreversible actions that affect all settings.
              </p>
            </div>

            <div className={styles.dangerActions}>
              <div className={styles.dangerItem}>
                <div className={styles.dangerInfo}>
                  <h3 className={styles.dangerTitle}>Reset All Settings</h3>
                  <p className={styles.dangerDescription}>
                    This will reset the system prompt, feature flags, and all configuration options to their default values.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="md"
                  onClick={handleResetAll}
                >
                  Reset All
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
