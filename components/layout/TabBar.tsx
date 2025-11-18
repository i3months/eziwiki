'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTabStore } from '@/lib/store/tabStore';
import { TabBarSkeleton } from './TabBarSkeleton';

export function TabBar() {
  const router = useRouter();
  const {
    tabs,
    activeTabId,
    addTab,
    setActiveTab,
    removeTab,
    closeOtherTabs,
    closeTabsToRight,
    hasHydrated,
  } = useTabStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(
    null,
  );
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleNewTab = () => {
    addTab({ title: 'New Tab', path: '' });
    router.push('/');
  };

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId);
    router.push(`/${path}`);
  };

  const closeTab = (tabId: string) => {
    const wasClosingActiveTab = tabId === activeTabId;
    const remainingTabs = tabs.filter((t) => t.id !== tabId);

    // If this was the last tab, create a new "New Tab" first, then remove the old one
    if (remainingTabs.length === 0) {
      // First remove the old tab
      removeTab(tabId);
      // Then create a new tab with explicit default values
      addTab({ title: 'New Tab', path: '' });
      router.replace('/');
    } else {
      removeTab(tabId);

      if (wasClosingActiveTab && remainingTabs.length > 0) {
        // If we closed the active tab, navigate to the new active tab
        const index = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = remainingTabs[Math.min(index, remainingTabs.length - 1)];
        if (newActiveTab) {
          router.push(`/${newActiveTab.path}`);
        }
      }
    }
  };

  const handleTabClose = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  const handleContextMenu = (e: React.MouseEvent, tabId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, tabId });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  // Detect clicks outside context menu
  React.useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', handleCloseContextMenu);
      return () => document.removeEventListener('click', handleCloseContextMenu);
    }
  }, [contextMenu]);

  // Show skeleton while hydrating
  if (!hasHydrated) {
    return <TabBarSkeleton />;
  }

  return (
    <div
      ref={tabBarRef}
      className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto px-2 py-1"
      style={{ scrollbarWidth: 'thin' }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;

        return (
          <div
            key={tab.id}
            onClick={() => handleTabClick(tab.id, tab.path)}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`
                group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer
                transition-colors w-[180px] flex-shrink-0
                ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
              `}
          >
            <span className="flex-1 truncate text-sm font-medium min-w-0">{tab.title}</span>
            <button
              onClick={(e) => handleTabClose(e, tab.id)}
              className={`
                  flex-shrink-0 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600
                  transition-opacity
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
              aria-label="Close tab"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        );
      })}

      {/* New Tab Button */}
      <button
        onClick={handleNewTab}
        className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        aria-label="New tab"
        title="New tab"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => {
              closeTab(contextMenu.tabId);
              handleCloseContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Close
          </button>
          <button
            onClick={() => {
              closeOtherTabs(contextMenu.tabId);
              handleCloseContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Close Others
          </button>
          <button
            onClick={() => {
              closeTabsToRight(contextMenu.tabId);
              handleCloseContextMenu();
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            Close to the Right
          </button>
        </div>
      )}
    </div>
  );
}
