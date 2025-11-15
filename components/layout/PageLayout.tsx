'use client';

import React, { useState } from 'react';
import { NavigationItem } from '@/lib/payload/types';
import { Sidebar } from './Sidebar';
import { MobileMenu } from './MobileMenu';

interface PageLayoutProps {
  navigation: NavigationItem[];
  children: React.ReactNode;
}

/**
 * Main page layout with responsive sidebar and mobile menu
 * Manages mobile menu visibility state
 */
export function PageLayout({ navigation, children }: PageLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Mobile header with hamburger button */}
      <header className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Documentation</h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Mobile menu */}
      <MobileMenu navigation={navigation} isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Main layout grid */}
      <div className="flex">
        {/* Desktop sidebar */}
        <Sidebar navigation={navigation} />

        {/* Main content area */}
        <main className="flex-1 min-w-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
