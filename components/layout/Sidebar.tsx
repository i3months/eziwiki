'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronRight, ChevronsLeft, ChevronsRight, Search } from 'lucide-react';
import { NavigationItem } from '@/lib/payload/types';
import { useTabStore } from '@/lib/store/tabStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { resolvePathToHash } from '@/lib/navigation/hash';
import { filterHiddenItems } from '@/lib/navigation/builder';

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** Array of top-level navigation items */
  navigation: NavigationItem[];
}

/**
 * Props for the NavigationItemComponent
 */
interface NavigationItemComponentProps {
  /** Navigation item to render */
  item: NavigationItem;
  /** Current page path for highlighting active item */
  currentPath: string;
  /** Nesting level for indentation (0 = top level) */
  level: number;
  /** Array of booleans indicating which levels should show vertical lines */
  parentLines?: boolean[];
  /** Background color inherited from parent */
  backgroundColor?: string;
  /** Full navigation tree for hash resolution */
  navigation: NavigationItem[];
}

/**
 * Calculate luminance of a color to determine if it's light or dark
 * Returns true if the color is light (needs dark text)
 */
function isLightColor(hexColor: string): boolean {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if light (luminance > 0.5)
  return luminance > 0.5;
}

/**
 * Recursive navigation item component with expand/collapse functionality
 *
 * Renders a single navigation item with support for nested children.
 * Items with children can be expanded/collapsed. Items with paths are
 * rendered as links and highlighted when active.
 *
 * @param props - Component props
 * @param props.item - Navigation item to render
 * @param props.currentPath - Current page path for active state
 * @param props.level - Nesting depth for indentation
 * @param props.isLast - Whether this is the last item in its parent's children
 * @param props.parentLines - Array indicating which levels should show vertical lines
 */
function NavigationItemComponent({
  item,
  currentPath,
  level,
  parentLines = [],
  backgroundColor,
  navigation,
}: NavigationItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();
  const { activeTabId, tabs } = useTabStore();
  const hasChildren = item.children && item.children.length > 0;

  // Use item's color if defined, otherwise inherit from parent
  const bgColor = item.color || backgroundColor;

  // Determine if background is light or dark
  const isLight = bgColor ? isLightColor(bgColor) : true;

  // Get text colors based on background
  const textColor = isLight ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'; // gray-700 : gray-100
  const lineColor = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';

  // Adjust opacity for dark mode
  const getBgStyle = (isTopLevel: boolean) => {
    if (!bgColor) return undefined;

    return {
      backgroundColor: bgColor,
      ...(isTopLevel && { padding: '8px', borderRadius: '6px' }),
    };
  };

  // Get the active tab's path
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activeTabPath = activeTab?.path || '';

  // Check if this item matches the active tab's path
  const isActive = item.path === activeTabPath;

  const handleToggle = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const handleLinkClick = (e: React.MouseEvent, navigation: NavigationItem[]) => {
    if (item.path) {
      e.preventDefault();
      const { tabs, addTab: storeAddTab, navigateInHistory } = useTabStore.getState();

      if (activeTabId) {
        // Add to history and update the active tab's path and title
        navigateInHistory(activeTabId, item.path, item.name);
      } else if (tabs.length === 0) {
        // No tabs at all, create a new one
        storeAddTab({ title: item.name, path: item.path });
      } else if (tabs.length > 0) {
        // Tabs exist but no active tab, update the first tab
        const firstTab = tabs[0];
        navigateInHistory(firstTab.id, item.path, item.name);
      }

      // Convert path to hash for URL
      const hash = resolvePathToHash(item.path, navigation);
      router.replace(`/${hash}`);
    }
  };

  return (
    <div className="relative" style={level === 0 ? getBgStyle(true) : undefined}>
      <div className="flex items-center relative" style={level > 0 ? getBgStyle(false) : undefined}>
        {/* Vertical lines for tree structure */}
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex">
            {parentLines.map((showLine, idx) => (
              <div key={idx} className="relative" style={{ width: '20px' }}>
                {showLine && (
                  <div
                    className="absolute left-1/2 top-0 bottom-0 w-px"
                    style={{ backgroundColor: bgColor ? lineColor : undefined }}
                  />
                )}
              </div>
            ))}
          </div>
        )}

        <div
          className="flex items-center"
          style={{ marginLeft: level > 0 ? `${parentLines.length * 20}px` : '0' }}
        >
          {hasChildren && (
            <button
              onClick={handleToggle}
              className={`mr-1 p-1 rounded transition-colors touch-manipulation flex-shrink-0 ${
                !bgColor
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-800 dark:hover:text-gray-600 hover:bg-black/5 dark:hover:bg-white/10'
                  : ''
              }`}
              style={bgColor ? { color: textColor } : undefined}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              aria-expanded={isExpanded}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-[120ms] ${isExpanded ? 'rotate-90' : ''}`}
                style={{ transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)' }}
              />
            </button>
          )}
          {item.path ? (
            <Link
              href={`/${resolvePathToHash(item.path, navigation)}`}
              onClick={(e) => handleLinkClick(e, navigation)}
              className={`flex-1 px-2 py-1 rounded-md text-sm transition-colors touch-manipulation ${
                isActive
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                  : !bgColor
                    ? 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20'
                    : ''
              } ${!hasChildren ? 'ml-5' : ''}`}
              style={bgColor && !isActive ? { color: textColor } : undefined}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </Link>
          ) : (
            <div
              className={`flex-1 px-2 py-1 text-sm font-semibold ${
                !bgColor ? 'text-gray-900 dark:text-gray-100' : ''
              } ${!hasChildren ? 'ml-5' : ''}`}
              style={bgColor ? { color: textColor } : undefined}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </div>
          )}
        </div>
      </div>
      {hasChildren && (
        <div
          className="overflow-hidden transition-all duration-[120ms]"
          style={{
            maxHeight: isExpanded ? '1000px' : '0',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            ...getBgStyle(false),
          }}
        >
          {item.children!.map((child, index) => {
            const newParentLines = [...parentLines, true];

            return (
              <NavigationItemComponent
                key={`${child.name}-${index}`}
                item={child}
                currentPath={currentPath}
                level={level + 1}
                parentLines={newParentLines}
                backgroundColor={bgColor}
                navigation={navigation}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Desktop sidebar component displaying hierarchical navigation
 *
 * Renders a fixed sidebar on the left side of the page with the full
 * navigation tree. Supports unlimited nesting with expand/collapse
 * functionality. Automatically highlights the active page.
 *
 * Hidden on mobile viewports (< 768px), where the MobileMenu component
 * is used instead.
 *
 * @param props - Component props
 * @param props.navigation - Array of top-level navigation items to display
 *
 * @example
 * ```tsx
 * const navigation = [
 *   { name: 'Home', path: 'home' },
 *   {
 *     name: 'Guides',
 *     children: [
 *       { name: 'Quick Start', path: 'guides/quick-start' }
 *     ]
 *   }
 * ];
 *
 * <Sidebar navigation={navigation} />
 * ```
 */
export function Sidebar({ navigation }: SidebarProps) {
  const pathname = usePathname();
  const currentPath = pathname === '/' ? '' : pathname.slice(1);
  const { sidebarWidth, sidebarCollapsed, setSidebarWidth, setSidebarCollapsed } = useTabStore();

  // Filter out hidden items
  const visibleNavigation = filterHiddenItems(navigation);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;
  const COLLAPSE_THRESHOLD = 150; // Auto-collapse when dragged below this width

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;

      // Collapse sidebar when width goes below threshold
      if (newWidth < COLLAPSE_THRESHOLD) {
        setSidebarCollapsed(true);
        setIsResizing(false);
        // Reset cursor and userSelect immediately
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        return;
      }

      // Enforce min/max width constraints
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
        setSidebarCollapsed(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    if (isResizing) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Reset on cleanup as well
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, setSidebarWidth, setSidebarCollapsed]);

  const handleToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  // Filter navigation items based on search query
  const filterNavigation = (items: NavigationItem[], query: string): NavigationItem[] => {
    if (!query.trim()) return items;

    const lowerQuery = query.toLowerCase();

    return items.reduce<NavigationItem[]>((acc, item) => {
      const matchesName = item.name.toLowerCase().includes(lowerQuery);
      const filteredChildren = item.children ? filterNavigation(item.children, query) : [];

      if (matchesName || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children,
        });
      }

      return acc;
    }, []);
  };

  const filteredNavigation = filterNavigation(visibleNavigation, searchQuery);

  return (
    <aside
      ref={sidebarRef}
      className="hidden md:block h-screen sticky top-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto relative"
      style={{
        width: sidebarCollapsed ? '64px' : `${sidebarWidth}px`,
        transition: isResizing ? 'none' : 'width 0.3s ease',
      }}
    >
      {/* Search and Toggle */}
      <div className="flex items-center gap-2 px-2 py-1 border-b border-gray-200 dark:border-gray-800">
        {!sidebarCollapsed ? (
          <>
            <div className="flex-1 flex items-center gap-2 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md min-w-0">
              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search titles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none min-w-0"
              />
            </div>
            <ThemeToggle className="w-4 h-4" />
            <button
              onClick={handleToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors flex-shrink-0"
              aria-label="Collapse sidebar"
              title="Collapse sidebar"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <button
            onClick={handleToggle}
            className="p-2 mx-auto text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors"
            aria-label="Expand sidebar"
            title="Expand sidebar"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      {!sidebarCollapsed && (
        <nav className="p-2 space-y-2">
          {filteredNavigation.length > 0 ? (
            filteredNavigation.map((item, index) => (
              <div key={`${item.name}-${index}`} className="rounded-md overflow-hidden">
                <NavigationItemComponent
                  item={item}
                  currentPath={currentPath}
                  level={0}
                  parentLines={[]}
                  navigation={navigation}
                />
              </div>
            ))
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No results found
            </div>
          )}
        </nav>
      )}

      {/* Resize handle */}
      {!sidebarCollapsed && (
        <div
          className="absolute top-0 right-0 w-1 h-full bg-transparent hover:bg-blue-500 transition-colors cursor-col-resize z-50"
          onMouseDown={handleResizeStart}
          style={{
            right: '-2px',
            width: '5px',
          }}
        />
      )}
    </aside>
  );
}
