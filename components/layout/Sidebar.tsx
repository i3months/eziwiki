'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronsLeft, ChevronsRight, Github, Search, Share2 } from 'lucide-react';
import { NavigationItem } from '@/lib/payload/types';
import { useTabStore } from '@/lib/store/tabStore';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useUrlMap } from '@/components/providers/UrlMapProvider';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { useSearchStore } from '@/lib/store/searchStore';
import { filterHiddenItems } from '@/lib/navigation/builder';
import { useStrings } from '@/components/providers/StringsProvider';
import { format } from '@/lib/i18n/format';
import { isLightColor } from '@/lib/color';
import { Collapse } from './Collapse';
import { ACTIVE_ON_COLOR_CLASSES, ACTIVE_ON_COLOR_STYLE, pressOverlay } from './sectionSurface';

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** Array of top-level navigation items */
  navigation: NavigationItem[];
  /** Source repository, linked from the header when configured */
  repoUrl?: string;
}

/**
 * Links out to the site's source repository.
 *
 * Rendered only when the payload names one, so a wiki with no public source
 * does not show a dead control. A published site otherwise gives a reader no
 * way to reach the project it came from.
 */
function RepoLink({ href, collapsed }: { href: string; collapsed: boolean }) {
  const t = useStrings();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.sourceRepository}
      title={t.sourceRepository}
      className={`rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800 ${
        collapsed ? '' : 'flex-shrink-0'
      }`}
    >
      <Github className="h-4 w-4" />
    </a>
  );
}

/**
 * Props for the NavigationItemComponent
 */
interface NavigationItemComponentProps {
  /** Navigation item to render */
  item: NavigationItem;
  /** Nesting level for indentation (0 = top level) */
  level: number;
  /** Array of booleans indicating which levels should show vertical lines */
  parentLines?: boolean[];
  /** Background color inherited from parent */
  backgroundColor?: string;
}

/**
 * Renders a single navigation item with support for nested children.
 * Items with children can be expanded/collapsed. Items with paths are
 * rendered as links and highlighted when active.
 *
 * @param props - Component props
 * @param props.item - Navigation item to render
 * @param props.level - Nesting depth for indentation
 * @param props.isLast - Whether this is the last item in its parent's children
 * @param props.parentLines - Array indicating which levels should show vertical lines
 */
function NavigationItemComponent({
  item,
  level,
  parentLines = [],
  backgroundColor,
}: NavigationItemComponentProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const router = useRouter();
  const { href: urlFor } = useUrlMap();
  const { activeTabId, tabs } = useTabStore();
  const t = useStrings();
  const hasChildren = item.children && item.children.length > 0;

  const bgColor = item.color || backgroundColor;

  const isLight = bgColor ? isLightColor(bgColor) : true;

  const textColor = isLight ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)'; // gray-700 : gray-100
  const lineColor = isLight ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.3)';

  const getBgStyle = (isTopLevel: boolean) => {
    if (!bgColor) return undefined;

    return {
      backgroundColor: bgColor,
      ...(isTopLevel && { padding: '4px', paddingBottom: '8px', borderRadius: '6px' }),
    };
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activeTabPath = activeTab?.path || '';

  const isActive = item.path === activeTabPath;

  const handleToggle = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (item.path) {
      e.preventDefault();
      const { tabs, addTab: storeAddTab, navigateInHistory } = useTabStore.getState();

      if (activeTabId) {
        navigateInHistory(activeTabId, item.path, item.name);
      } else if (tabs.length === 0) {
        // No tabs at all, create a new one
        storeAddTab({ title: item.name, path: item.path });
      } else if (tabs.length > 0) {
        // Tabs exist but no active tab, update the first tab
        const firstTab = tabs[0];
        navigateInHistory(firstTab.id, item.path, item.name);
      }

      router.replace(urlFor(item.path));
    }
  };

  return (
    <div className="relative" style={level === 0 ? getBgStyle(true) : undefined}>
      <div className="flex items-center relative" style={level > 0 ? getBgStyle(false) : undefined}>
        {level > 0 && (
          <div className="absolute left-0 top-0 bottom-0 flex">
            {parentLines.map((showLine, idx) => (
              <div key={idx} className="relative" style={{ width: '20px' }}>
                {showLine && (
                  <div
                    className={`absolute left-1/2 top-0 bottom-0 w-px ${!bgColor ? 'bg-gray-300 dark:bg-gray-700' : ''}`}
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
                  ? 'text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20'
                  : pressOverlay(isLight)
              }`}
              style={bgColor ? { color: textColor } : undefined}
              // The button is a bare chevron, so it needs a name of its own —
              // and it has to name the section, or a screen reader announces
              // one indistinguishable "Expand" per section.
              aria-label={format(isExpanded ? t.collapseSection : t.expandSection, {
                name: item.name,
              })}
              aria-expanded={isExpanded}
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform duration-[120ms] ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          )}
          {item.path ? (
            <Link
              href={urlFor(item.path)}
              onClick={handleLinkClick}
              aria-current={isActive ? 'page' : undefined}
              // The page you are on is marked by lifting it off the section
              // rather than by colouring it. A fixed blue used to do the job,
              // which worked until a section carried a colour of its own —
              // and sections carry whatever colour their `_meta.json` names,
              // so there was no blue that could not clash with one. Brightness
              // has no such problem: a pale surface reads as "raised" over
              // yellow, green or pink alike.
              className={`flex-1 px-2 py-1 rounded-md text-sm transition-colors touch-manipulation ${
                isActive
                  ? bgColor
                    ? ACTIVE_ON_COLOR_CLASSES
                    : 'font-medium shadow-sm bg-white text-gray-900 ring-1 ring-black/5 dark:bg-white/15 dark:text-gray-50 dark:ring-white/10'
                  : bgColor
                    ? pressOverlay(isLight)
                    : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 active:bg-black/10 dark:active:bg-white/20'
              } ${!hasChildren ? 'ml-5' : ''}`}
              // A section keeps its colour in both themes, so the raised
              // surface over one does too and needs no dark variant. Only the
              // uncoloured case has a background that changes underneath it,
              // and that is handled by the classes above.
              style={
                isActive && bgColor
                  ? ACTIVE_ON_COLOR_STYLE
                  : bgColor
                    ? { color: textColor }
                    : undefined
              }
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
        <Collapse expanded={isExpanded} style={getBgStyle(false)}>
          {item.children!.map((child, index) => {
            const newParentLines = [...parentLines, true];

            return (
              <NavigationItemComponent
                key={`${child.name}-${index}`}
                item={child}
                level={level + 1}
                parentLines={newParentLines}
                backgroundColor={bgColor}
              />
            );
          })}
        </Collapse>
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
 */
export function Sidebar({ navigation, repoUrl }: SidebarProps) {
  const { sidebarWidth, sidebarCollapsed, setSidebarWidth, setSidebarCollapsed } = useTabStore();
  const t = useStrings();

  const visibleNavigation = filterHiddenItems(navigation);

  const openSearch = useSearchStore((state) => state.open);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);

  const MIN_WIDTH = 200;
  const MAX_WIDTH = 600;
  const COLLAPSE_THRESHOLD = 150; // Auto-collapse when dragged below this width

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;

      if (newWidth < COLLAPSE_THRESHOLD) {
        setSidebarCollapsed(true);
        setIsResizing(false);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        return;
      }

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

  return (
    <aside
      aria-label={t.navigation}
      ref={sidebarRef}
      className="hidden md:block print:hidden h-screen sticky top-0 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto relative"
      style={{
        width: sidebarCollapsed ? '64px' : `${sidebarWidth}px`,
        transition: isResizing ? 'none' : 'width 0.3s ease',
      }}
    >
      <div className="flex items-center gap-2 px-2 py-1 border-b border-gray-200 dark:border-gray-800">
        {!sidebarCollapsed ? (
          <>
            <SearchTrigger className="min-w-0 flex-1" />
            <ThemeToggle className="w-4 h-4" />
            {repoUrl && <RepoLink href={repoUrl} collapsed={false} />}
            <button
              onClick={handleToggle}
              className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-md transition-colors flex-shrink-0"
              aria-label={t.collapseSidebar}
              title={t.collapseSidebar}
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="mx-auto flex flex-col items-center gap-1">
            <button
              onClick={openSearch}
              className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={t.searchDialog}
              title={t.searchDialog}
            >
              <Search className="h-4 w-4" />
            </button>
            {repoUrl && <RepoLink href={repoUrl} collapsed />}
            <button
              onClick={handleToggle}
              className="rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label={t.expandSidebar}
              title={t.expandSidebar}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {!sidebarCollapsed && (
        <nav className="p-2 space-y-1" aria-label={t.navigation}>
          {visibleNavigation.map((item, index) => (
            <div key={`${item.name}-${index}`} className="rounded-md overflow-hidden">
              <NavigationItemComponent item={item} level={0} parentLines={[]} />
            </div>
          ))}

          <Link
            href="/graph"
            className="mt-2 flex items-center gap-2 rounded-md px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-black/5 dark:text-gray-400 dark:hover:bg-white/10"
          >
            <Share2 className="h-4 w-4 flex-shrink-0" />
            {t.graph}
          </Link>
        </nav>
      )}

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
