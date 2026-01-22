'use client';

import React, { useCallback, useId } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useRole } from '@/lib/hooks';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether the sidebar is collapsed (for mobile) */
  collapsed?: boolean;
  /** Callback when collapse state changes */
  onCollapsedChange?: (collapsed: boolean) => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  mode: 'patient' | 'admin' | 'both';
}

// Icon components for navigation items
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <rect x="2" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="2" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="2" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    <rect x="11" y="11" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const ChatIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M17 10C17 13.866 13.866 17 10 17C8.79 17 7.65 16.71 6.64 16.19L3 17L3.81 13.36C3.29 12.35 3 11.21 3 10C3 6.134 6.134 3 10 3C13.866 3 17 6.134 17 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7 9H13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M7 12H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 6V10L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RecommendationsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M10 2L12.09 7.26L18 7.64L13.54 11.42L15.18 17L10 14.27L4.82 17L6.46 11.42L2 7.64L7.91 7.26L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 2V4M10 16V18M18 10H16M4 10H2M15.66 4.34L14.24 5.76M5.76 14.24L4.34 15.66M15.66 15.66L14.24 14.24M5.76 5.76L4.34 4.34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const KnowledgeBaseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M2 4C2 3.44772 2.44772 3 3 3H7L9 5H17C17.5523 5 18 5.44772 18 6V16C18 16.5523 17.5523 17 17 17H3C2.44772 17 2 16.5523 2 16V4Z" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 10H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M6 13H11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// Navigation items configuration
// Patient mode: Dashboard, Consultation, History, Recommendations
// Admin mode: Knowledge Base, Settings (admin-only pages)
const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, mode: 'patient' },
  { href: '/consultation', label: 'Consultation', icon: <ChatIcon />, mode: 'patient' },
  { href: '/history', label: 'History', icon: <HistoryIcon />, mode: 'patient' },
  { href: '/recommendations', label: 'Recommendations', icon: <RecommendationsIcon />, mode: 'patient' },
  { href: '/knowledge-base', label: 'Knowledge Base', icon: <KnowledgeBaseIcon />, mode: 'admin' },
  { href: '/settings', label: 'Admin Settings', icon: <SettingsIcon />, mode: 'admin' },
];

/**
 * Navigation sidebar with app logo at top.
 * Shows different items based on current role.
 * Collapsible on mobile.
 * Uses design tokens for styling.
 * Active state indicator for current page.
 * Accessible with semantic HTML, ARIA attributes, and keyboard navigation.
 */
export const Sidebar: React.FC<SidebarProps> = ({
  className = '',
  collapsed = false,
  onCollapsedChange,
}) => {
  const pathname = usePathname();
  const { isAdmin, isPatient } = useRole();
  const navId = useId();

  // Filter nav items based on current role
  const visibleNavItems = navItems.filter((item) => {
    if (item.mode === 'both') return true;
    if (item.mode === 'admin' && isAdmin) return true;
    if (item.mode === 'patient' && isPatient) return true;
    return false;
  });

  const handleToggle = useCallback(() => {
    onCollapsedChange?.(!collapsed);
  }, [collapsed, onCollapsedChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleToggle();
      }
    },
    [handleToggle]
  );

  const sidebarClasses = [
    styles.sidebar,
    collapsed ? styles.collapsed : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <aside className={sidebarClasses} aria-label="Main navigation">
      {/* Logo Section */}
      <div className={styles.logoSection}>
        <Link
          href={isAdmin ? "/knowledge-base" : "/dashboard"}
          className={styles.logoLink}
          aria-label={`HospitALL Home - ${isAdmin ? 'Admin' : 'Patient'} Portal`}
        >
          {collapsed ? (
            <span className={styles.logoTextCollapsed}>H</span>
          ) : (
            <span className={styles.logoText}>HospitALL</span>
          )}
        </Link>

        {/* Mobile collapse toggle */}
        <button
          type="button"
          className={styles.collapseToggle}
          onClick={handleToggle}
          onKeyDown={handleKeyDown}
          aria-expanded={!collapsed}
          aria-controls={navId}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            className={`${styles.collapseIcon} ${collapsed ? styles.collapseIconRotated : ''}`}
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M12 4L6 10L12 16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav id={navId} className={styles.nav} aria-label="Primary">
        <ul className={styles.navList} role="list">
          {visibleNavItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                  {isActive && <span className={styles.activeIndicator} aria-hidden="true" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Role indicator at bottom */}
      <div className={styles.footer}>
        <div className={`${styles.roleIndicator} ${isAdmin ? styles.roleAdmin : styles.rolePatient}`}>
          <div className={styles.roleDot} aria-hidden="true" />
          {!collapsed && (
            <span className={styles.roleText}>
              {isAdmin ? 'Admin Mode' : 'Patient Mode'}
            </span>
          )}
        </div>
        {!collapsed && (
          <div className={styles.branding}>
            Powered by <span className={styles.brandingName}>Genaima AI</span>
          </div>
        )}
      </div>

      {/* Mobile overlay backdrop */}
      {!collapsed && (
        <div
          className={styles.backdrop}
          onClick={handleToggle}
          aria-hidden="true"
        />
      )}
    </aside>
  );
};

export default Sidebar;
