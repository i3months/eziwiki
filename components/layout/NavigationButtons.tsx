'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useTabStore } from '@/lib/store/tabStore';
import { NavigationItem } from '@/lib/payload/types';
import { Breadcrumb } from './Breadcrumb';
import { resolvePathToHash } from '@/lib/navigation/hash';

interface NavigationButtonsProps {
  navigation: NavigationItem[];
}

/**
 * Navigation buttons for back/forward history within tabs, combined with breadcrumb
 */
export function NavigationButtons({ navigation }: NavigationButtonsProps) {
  const router = useRouter();
  const { activeTabId, goBack, goForward, canGoBack, canGoForward } = useTabStore();

  const canNavigateBack = activeTabId ? canGoBack(activeTabId) : false;
  const canNavigateForward = activeTabId ? canGoForward(activeTabId) : false;

  const handleBack = () => {
    if (!activeTabId) return;

    const result = goBack(activeTabId);
    if (result) {
      // If path is empty, go to home
      if (!result.path) {
        router.replace('/');
        return;
      }
      const hash = resolvePathToHash(result.path, navigation);
      router.replace(`/${hash || ''}`);
    }
  };

  const handleForward = () => {
    if (!activeTabId) return;

    const result = goForward(activeTabId);
    if (result) {
      // If path is empty, go to home
      if (!result.path) {
        router.replace('/');
        return;
      }
      const hash = resolvePathToHash(result.path, navigation);
      router.replace(`/${hash || ''}`);
    }
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 h-9 md:h-auto bg-white dark:bg-gray-950">
      {/* Navigation buttons - left side */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleBack}
          disabled={!canNavigateBack}
          className={`
            p-1 rounded-md transition-colors
            ${
              canNavigateBack
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
            }
          `}
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={handleForward}
          disabled={!canNavigateForward}
          className={`
            p-1 rounded-md transition-colors
            ${
              canNavigateForward
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
            }
          `}
          aria-label="Go forward"
          title="Go forward"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Breadcrumb - center */}
      <div className="flex-1 flex justify-center min-w-0">
        <Breadcrumb navigation={navigation} />
      </div>
    </div>
  );
}
