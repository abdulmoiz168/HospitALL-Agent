'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Sidebar, Header } from '@/app/components/layout';
import styles from './layout.module.css';

export interface PortalLayoutProps {
  children: React.ReactNode;
}

/**
 * Portal Layout Component
 *
 * Shared layout for all portal pages (dashboard, chat, history, etc.)
 * Features:
 * - Sidebar navigation on the left (role-aware)
 * - Header at the top with patient/admin info
 * - Main content area with independent scrolling
 * - Mobile responsive with drawer-style sidebar
 * - Full height layout (100vh)
 */
export default function PortalLayout({ children }: PortalLayoutProps) {
  // Sidebar collapse state - true means collapsed/hidden on mobile
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);

  // Track if we're on mobile for responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  // Handle window resize to detect mobile/desktop and manage sidebar state
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // Close sidebar when switching from mobile to desktop
      if (!mobile) {
        setSidebarCollapsed(true);
      }
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Handle sidebar collapse state change
  const handleSidebarCollapsedChange = useCallback((collapsed: boolean) => {
    setSidebarCollapsed(collapsed);
  }, []);

  // Toggle sidebar for mobile menu button
  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  // Handle overlay click to close sidebar
  const handleOverlayClick = useCallback(() => {
    setSidebarCollapsed(true);
  }, []);

  // Handle escape key to close sidebar on mobile
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobile && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobile, sidebarCollapsed]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, sidebarCollapsed]);

  // Determine main wrapper class based on sidebar state
  const getMainWrapperClass = () => {
    const classes = [styles.mainWrapper];

    if (isMobile) {
      // On mobile, sidebar is a drawer, no margin needed
      return classes.join(' ');
    }

    if (sidebarCollapsed) {
      classes.push(styles.mainWrapperCollapsed);
    } else {
      classes.push(styles.mainWrapperExpanded);
    }

    return classes.join(' ');
  };

  return (
    <div className={styles.portalLayout}>
      {/* Sidebar Navigation */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onCollapsedChange={handleSidebarCollapsedChange}
      />

      {/* Mobile Overlay */}
      <div
        className={`${styles.overlay} ${!sidebarCollapsed && isMobile ? styles.overlayVisible : ''}`}
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Main Content Wrapper */}
      <div className={getMainWrapperClass()}>
        {/* Header */}
        <div className={styles.headerArea}>
          <Header />
        </div>

        {/* Page Content Area */}
        <main className={styles.contentArea} role="main">
          <div className={styles.contentInner}>
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Menu Toggle Button */}
      <button
        type="button"
        className={styles.mobileMenuToggle}
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
        aria-expanded={!sidebarCollapsed}
      >
        {sidebarCollapsed ? (
          // Hamburger icon
          <svg
            className={styles.menuIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M3 6H21M3 12H21M3 18H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          // Close icon
          <svg
            className={styles.menuIcon}
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M6 6L18 18M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>
    </div>
  );
}
