'use client';

import React, { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTabStore } from '@/lib/store/tabStore';
import { TabBarSkeleton } from './TabBarSkeleton';
import { useUrlMap } from '@/components/providers/UrlMapProvider';
import { useStrings } from '@/components/providers/StringsProvider';

export function TabBar() {
  const t = useStrings();
  const router = useRouter();
  const { href: urlFor } = useUrlMap();
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
  const tabRefs = useRef(new Map<string, HTMLDivElement>());
  const menuRef = useRef<HTMLDivElement>(null);
  // Set when a tab is closed from the keyboard or the menu: the focused tab
  // unmounts with it, and focus would drop to the body.
  const focusActiveTab = useRef(false);

  const handleNewTab = () => {
    addTab({ title: t.newTabTitle, path: '' });
    router.replace('/');
  };

  const handleTabClick = (tabId: string, path: string) => {
    setActiveTab(tabId);

    router.replace(path ? urlFor(path) : '/');
  };

  const closeTab = (tabId: string) => {
    const wasClosingActiveTab = tabId === activeTabId;
    const remainingTabs = tabs.filter((t) => t.id !== tabId);

    if (remainingTabs.length === 0) {
      removeTab(tabId);
      addTab({ title: t.newTabTitle, path: '' });

      router.replace('/');
    } else {
      removeTab(tabId);

      if (wasClosingActiveTab && remainingTabs.length > 0) {
        const index = tabs.findIndex((t) => t.id === tabId);
        const newActiveTab = remainingTabs[Math.min(index, remainingTabs.length - 1)];

        if (newActiveTab) {
          router.replace(newActiveTab.path ? urlFor(newActiveTab.path) : '/');
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

  // Closing tabs from the menu can make a different tab active — "Close
  // Others" on an inactive tab, "Close to the Right" past the active one —
  // and the page has to follow it, or the bar highlights one tab while the
  // article shows another's.
  const closeFromMenu = (close: (tabId: string) => void, tabId: string) => {
    close(tabId);
    const { activeTabId: nowActive, tabs: remaining } = useTabStore.getState();
    if (nowActive === activeTabId) return;

    const target = remaining.find((tab) => tab.id === nowActive);
    router.replace(target?.path ? urlFor(target.path) : '/');
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  /**
   * Keyboard handling for a tab, on the roving-tabindex pattern: the active
   * tab is the one stop in the strip, and the arrows move between tabs and
   * switch to them as they go. Until this the tabs were plain divs — a
   * keyboard reader could close the active tab and open a new one, and
   * nothing else.
   */
  const handleTabKeyDown = (event: React.KeyboardEvent, index: number) => {
    const tab = tabs[index];
    let target: number | null = null;

    switch (event.key) {
      case 'ArrowRight':
        target = (index + 1) % tabs.length;
        break;
      case 'ArrowLeft':
        target = (index - 1 + tabs.length) % tabs.length;
        break;
      case 'Home':
        target = 0;
        break;
      case 'End':
        target = tabs.length - 1;
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleTabClick(tab.id, tab.path);
        return;
      case 'Delete':
      case 'Backspace':
        event.preventDefault();
        focusActiveTab.current = true;
        closeTab(tab.id);
        return;
      case 'ContextMenu':
      case 'F10': {
        if (event.key === 'F10' && !event.shiftKey) return;
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        setContextMenu({ x: rect.left, y: rect.bottom, tabId: tab.id });
        return;
      }
      default:
        return;
    }

    event.preventDefault();
    const next = tabs[target];
    handleTabClick(next.id, next.path);
    tabRefs.current.get(next.id)?.focus();
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

    if (dropPosition === 'after') {
      targetIndex = dropIndex + 1;
    }

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

  React.useEffect(() => {
    if (contextMenu) {
      document.addEventListener('click', handleCloseContextMenu);
      return () => document.removeEventListener('click', handleCloseContextMenu);
    }
  }, [contextMenu]);

  // The menu takes focus while it is up and gives it back to the tab after,
  // so a keyboard reader who opened it is not left on the body. Only when
  // focus did fall to the body, though: the menu also closes on any click,
  // and a reader who dismissed it by clicking into the article must not have
  // their focus pulled back to the strip.
  React.useEffect(() => {
    if (!contextMenu) return;

    const { tabId } = contextMenu;
    const refs = tabRefs.current;
    menuRef.current?.querySelector('button')?.focus();

    return () => {
      if (document.activeElement !== document.body) return;
      const target = refs.get(tabId) ?? refs.get(useTabStore.getState().activeTabId ?? '');
      target?.focus();
    };
  }, [contextMenu]);

  // After a close from the keyboard or the menu, the tab that was focused is
  // gone; the one now active takes its place as the strip's stop.
  React.useEffect(() => {
    if (!focusActiveTab.current) return;
    focusActiveTab.current = false;
    if (activeTabId) tabRefs.current.get(activeTabId)?.focus();
  }, [tabs, activeTabId]);

  // Show skeleton while hydrating, and through the empty frame right after:
  // hydration can finish with no stored tabs, and the first tab only arrives
  // once TabInitializer's effect runs. Rendering the bar in between paints it
  // with zero tabs, which walks the "+" button left and back — a one-tab-wide
  // shift on every first visit. An empty list is always this transient state:
  // closing the last tab immediately opens a fresh one, and TabInitializer
  // recreates a tab whenever the list empties by any other route.
  if (!hasHydrated || tabs.length === 0) {
    return <TabBarSkeleton />;
  }

  return (
    <div
      ref={tabBarRef}
      className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-x-auto px-2 py-1 h-9 md:h-auto"
      style={{ scrollbarWidth: 'thin' }}
      role="tablist"
      aria-label={t.tabs}
    >
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        const isDragging = draggedIndex === index;
        const showDropIndicator = dragOverIndex === index && !isDragging;

        return (
          <div key={tab.id} className="relative flex items-center">
            {showDropIndicator && dropPosition === 'before' && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 w-0.5 bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/50" />
            )}

            <div
              ref={(element) => {
                if (element) tabRefs.current.set(tab.id, element);
                else tabRefs.current.delete(tab.id);
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onKeyDown={(e) => handleTabKeyDown(e, index)}
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
                  flex-shrink-0 w-5 h-5 min-w-[20px] min-h-[20px] max-md:w-6 max-md:h-6 max-md:min-w-[24px] max-md:min-h-[24px] flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-600
                  transition-opacity
                  ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-visible:opacity-100'}
                `}
                tabIndex={-1}
                aria-label={t.closeTab}
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

            {showDropIndicator && dropPosition === 'after' && (
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 w-0.5 bg-blue-500 rounded-full z-10 shadow-lg shadow-blue-500/50" />
            )}
          </div>
        );
      })}

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

      <button
        onClick={handleNewTab}
        className="flex-shrink-0 p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
        aria-label={t.newTab}
        title={t.newTab}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>

      {contextMenu && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={t.tabActions}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg py-1 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation();
              handleCloseContextMenu();
            }
          }}
        >
          <button
            onClick={() => {
              focusActiveTab.current = true;
              closeTab(contextMenu.tabId);
              handleCloseContextMenu();
            }}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {t.closeTab}
          </button>
          <button
            onClick={() => {
              focusActiveTab.current = true;
              closeFromMenu(closeOtherTabs, contextMenu.tabId);
              handleCloseContextMenu();
            }}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {t.closeOtherTabs}
          </button>
          <button
            onClick={() => {
              focusActiveTab.current = true;
              closeFromMenu(closeTabsToRight, contextMenu.tabId);
              handleCloseContextMenu();
            }}
            role="menuitem"
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
          >
            {t.closeTabsToRight}
          </button>
        </div>
      )}
    </div>
  );
}
