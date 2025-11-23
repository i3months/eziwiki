'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTabStore } from '@/lib/store/tabStore';
import { TabBarSkeleton } from './TabBarSkeleton';
import { resolvePathToHash } from '@/lib/navigation/hash';
import { payload } from '@/payload/config';

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
    reorderTabs,
    hasHydrated,
  } = useTabStore();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; tabId: string } | null>(
    null,
  );
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [dropPosition, setDropPosition] = useState<'before' | 'after' | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleNewTab = () => {
    addTab({ title: 'New Tab', path: '' });
    router.replace('/');
  };

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId);
    // Navigate to the tab's current path (convert to hash)
    const hash = path ? resolvePathToHash(path, payload.navigation) : '';
    router.replace(`/${hash}`);
  };

  const closeTab = (tabId: string) => {
    const wasClosingActiveTab = tabId === activeTabId;
    const remainingTabs = tabs.filter((t) => t.id !== tabId);

    // If this was the last tab, create a new "New Tab" first, then remove the old one
    if (remainingTabs.length === 0) {
      removeTab(tabId);
      addTab({ title: 'New Tab', path: '' });
      // Use replace to avoid adding to history when closing last tab
      router.replace('/');
    } else {
      removeTab(tabId);

      if (wasClosingActiveTab && remainingTabs.length > 0) {
        // If we closed the active tab, navigate to the new active tab
        const index = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = remainingTabs[Math.min(index, remainingTabs.length - 1)];
        if (newActiveTab) {
          // Use replace to avoid polluting history when closing tabs
          const hash = newActiveTab.path
            ? resolvePathToHash(newActiveTab.path, payload.navigation)
            : '';
          router.replace(`/${hash}`);
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

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    setDragPosition({ x: e.clientX, y: e.clientY });
    e.dataTransfer.effectAllowed = 'move';
    // Create a custom drag image that's invisible
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    if (e.clientX !== 0 && e.clientY !== 0) {
      setDragPosition({ x: e.clientX, y: e.clientY });
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === index) {
      setDragOverIndex(null);
      setDropPosition(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const midPoint = rect.left + rect.width / 2;
    const position = e.clientX < midPoint ? 'before' : 'after';

    setDragOverIndex(index);
    setDropPosition(position);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      setDropPosition(null);
      setDragPosition(null);
      return;
    }

    let targetIndex = dropIndex;

    // Adjust target index based on drop position
    if (dropPosition === 'after') {
      targetIndex = dropIndex + 1;
    }

    // Adjust for the removed item
    if (draggedIndex < targetIndex) {
      targetIndex -= 1;
    }

    reorderTabs(draggedIndex, targetIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
    setDragPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    setDropPosition(null);
    setDragPosition(null);
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
      className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto px-2 py-1 h-9 md:h-auto"
      style={{ scrollbarWidth: 'thin' }}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isDragging = draggedIndex === index;
        const showDropIndicator = dragOverIndex === index && !isDragging;

        return (
          <div key={tab.id} className="relative flex items-center">
            {/* Drop indicator - before */}
            {showDropIndicator && dropPosition === 'before' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-0.5 bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/50" />
            )}

            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDrag={handleDrag}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => handleTabClick(tab.id, tab.path)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              style={{
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
              className={`
                group flex items-center gap-3 px-3 py-1.5 rounded-md
                transition-all duration-150 w-[180px] flex-shrink-0 relative h-8 md:h-auto
                ${
                  isActive
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm'
                    : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }
                ${isDragging ? 'opacity-20' : 'opacity-100'}
              `}
            >
              <span className="flex-1 truncate text-sm font-medium min-w-0 pointer-events-none select-none pr-2">
                {tab.title}
              </span>
              <button
                onClick={(e) => handleTabClose(e, tab.id)}
                className={`
                  flex-shrink-0 w-5 h-5 min-w-[20px] min-h-[20px] flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600
                  transition-opacity
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                `}
                aria-label="Close tab"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Drop indicator - after */}
            {showDropIndicator && dropPosition === 'after' && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-0.5 bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/50" />
            )}
          </div>
        );
      })}

      {/* Floating dragged tab */}
      {draggedIndex !== null && dragPosition && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md w-[180px]
              shadow-2xl scale-105 opacity-80
              ${
                tabs[draggedIndex]?.id === activeTabId
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                  : 'bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400'
              }
            `}
          >
            <span className="flex-1 truncate text-sm font-medium min-w-0 select-none">
              {tabs[draggedIndex]?.title}
            </span>
            <div className="flex-shrink-0 w-4 h-4" />
          </div>
        </div>
      )}

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
