'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NavigationItem } from '@/lib/payload/types';
import { useTabStore } from '@/lib/store/tabStore';
import { useUrlMap } from '@/components/providers/UrlMapProvider';
import { filterHiddenItems } from '@/lib/navigation/builder';
import { Github } from 'lucide-react';
import { useStrings } from '@/components/providers/StringsProvider';
import { isLightColor } from '@/lib/color';
import { Collapse } from './Collapse';
import { ACTIVE_ON_COLOR_CLASSES, ACTIVE_ON_COLOR_STYLE, pressOverlay } from './sectionSurface';

/**
 * Props for the MobileMenu component
 */
interface MobileMenuProps {
  /** Array of top-level navigation items */
  navigation: NavigationItem[];
  /** Whether the mobile menu is currently open */
  isOpen: boolean;
  /** Callback function to close the menu */
  onClose: () => void;
  /** Source repository, linked from the drawer header when configured */
  repoUrl?: string;
}

/**
 * Props for the MobileNavigationItem component
 */
interface MobileNavigationItemProps {
  /** Navigation item to render */
  item: NavigationItem;
  /** Current page path for highlighting active item */
  currentPath: string;
  /** Nesting level for indentation (0 = top level) */
  level: number;
  /** Callback function when navigation occurs */
  onNavigate: () => void;
  /** Background color inherited from parent */
  backgroundColor?: string;
}

/**
 * Renders a single navigation item optimized for mobile with touch-friendly
 * targets and automatic menu closing on navigation.
 *
 * @param props - Component props
 */
function MobileNavigationItem({
  item,
  currentPath,
  level,
  onNavigate,
  backgroundColor,
}: MobileNavigationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const router = useRouter();
  const { href: urlFor } = useUrlMap();
  const { activeTabId, tabs, addTab } = useTabStore();
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path === currentPath;

  // Calculate left margin based on level using inline styles
  const getLeftMarginStyle = () => {
    if (level === 0) return {};
    const baseMargin = level * 24; // 24px per level
    const extraMargin = hasChildren ? 0 : 4; // Extra 4px for documents
    return { marginLeft: `${baseMargin + extraMargin}px` };
  };

  // Use item's color if defined, otherwise inherit from parent
  const bgColor = item.color || backgroundColor;

  // Determine if background is light or dark
  const isLight = bgColor ? isLightColor(bgColor) : true;

  // Get text colors based on background
  const textColor = isLight ? 'rgb(55, 65, 81)' : 'rgb(243, 244, 246)';

  // Get background style
  const getBgStyle = (isTopLevel: boolean) => {
    if (!bgColor) return undefined;
    return {
      backgroundColor: bgColor,
      ...(isTopLevel && { padding: '4px', borderRadius: '6px' }),
    };
  };

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleLinkClick = (e: React.MouseEvent) => {
    if (item.path) {
      e.preventDefault();
      const { navigateInHistory } = useTabStore.getState();

      if (activeTabId) {
        // Add to history and update the active tab's path
        navigateInHistory(activeTabId, item.path, item.name);
      } else if (tabs.length === 0) {
        // No tabs at all, create a new one
        addTab({ title: item.name, path: item.path });
      }

      router.replace(urlFor(item.path));
      onNavigate();
    }
  };

  return (
    <div className={level === 0 ? 'mb-0.5' : ''} style={level === 0 ? getBgStyle(true) : undefined}>
      <div className="flex items-center" style={level > 0 ? getBgStyle(false) : undefined}>
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className={`flex items-center flex-1 px-2 py-1 rounded-md text-sm transition-colors touch-manipulation ${
              !bgColor
                ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
                : pressOverlay(isLight)
            }`}
            style={bgColor ? { color: textColor, ...getLeftMarginStyle() } : getLeftMarginStyle()}
            // No aria-label: this button already contains the section name, and
            // labelling it "Expand" replaced that name rather than adding to it,
            // leaving every section announced identically. `aria-expanded`
            // carries the state on its own.
            aria-expanded={isExpanded}
          >
            <svg
              className={`w-4 h-4 mr-2 -ml-1 flex-shrink-0 transition-transform duration-[120ms] ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-semibold">
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.name}
            </span>
          </button>
        ) : item.path ? (
          <Link
            href={urlFor(item.path)}
            onClick={handleLinkClick}
            aria-current={isActive ? 'page' : undefined}
            // Over a coloured section the active page is lifted off on a
            // white surface, as the desktop sidebar does: the fixed blue
            // clashes with whatever colour the section's `_meta.json` names,
            // and there is no blue that cannot. The blue stays for the
            // uncoloured case, where it has nothing to clash with.
            className={`flex-1 px-2 py-1 rounded-md text-sm transition-colors touch-manipulation ${
              isActive
                ? bgColor
                  ? ACTIVE_ON_COLOR_CLASSES
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium'
                : !bgColor
                  ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700'
                  : pressOverlay(isLight)
            }`}
            style={
              bgColor
                ? isActive
                  ? { ...ACTIVE_ON_COLOR_STYLE, ...getLeftMarginStyle() }
                  : { color: textColor, ...getLeftMarginStyle() }
                : getLeftMarginStyle()
            }
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.name}
          </Link>
        ) : (
          <div
            className={`flex-1 px-2 py-1 text-sm font-semibold ${
              !bgColor ? 'text-gray-900 dark:text-gray-100' : ''
            }`}
            style={bgColor ? { color: textColor, ...getLeftMarginStyle() } : getLeftMarginStyle()}
          >
            {item.icon && <span className="mr-2">{item.icon}</span>}
            {item.name}
          </div>
        )}
      </div>
      {hasChildren && (
        <Collapse expanded={isExpanded} style={getBgStyle(false)}>
          {item.children!.map((child, index) => (
            <MobileNavigationItem
              key={`${child.name}-${index}`}
              item={child}
              currentPath={currentPath}
              level={level + 1}
              onNavigate={onNavigate}
              backgroundColor={bgColor}
            />
          ))}
        </Collapse>
      )}
    </div>
  );
}

/**
 * Displays a full-screen overlay menu for mobile devices. The menu slides
 * in from the left and includes a backdrop overlay. Automatically prevents
 * body scrolling when open and closes when a navigation link is clicked.
 *
 * Visible only on mobile viewports (< 768px). On desktop, the Sidebar
 * component is used instead.
 *
 * @param props - Component props
 * @param props.navigation - Array of top-level navigation items to display
 * @param props.isOpen - Whether the menu is currently open
 * @param props.onClose - Callback function to close the menu
 *
 */
export function MobileMenu({ navigation, isOpen, onClose, repoUrl }: MobileMenuProps) {
  const t = useStrings();
  const pathname = usePathname();
  const { toPath } = useUrlMap();

  // Resolve through the URL map rather than trimming the pathname: the URL is
  // a hash under one strategy and carries a trailing slash under the other, and
  // neither form would ever equal a content path.
  const currentPath = toPath(pathname) ?? '';

  // Filter out hidden items
  const visibleNavigation = filterHiddenItems(navigation);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const drawerRef = useRef<HTMLDivElement>(null);

  // The tree is rendered the first time the drawer opens, and kept after.
  // Rendered from the start it was in every page's HTML — the whole
  // navigation a second time, behind a drawer that is closed and, from `md`
  // up, does not exist — which at a thousand pages was half the page.
  const [hasOpened, setHasOpened] = useState(false);
  useEffect(() => {
    if (isOpen) setHasOpened(true);
  }, [isOpen]);

  // Focus follows the drawer: into it when it opens, back to whatever opened
  // it when it closes, and Escape closes it. Without this a keyboard or
  // screen-reader user opened the menu and was left where they were, with
  // the menu somewhere behind them in the tab order.
  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const raf = requestAnimationFrame(() => {
      drawerRef.current?.querySelector<HTMLElement>('button, a')?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus();
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden touch-manipulation"
          onClick={onClose}
          onTouchEnd={onClose}
          aria-hidden="true"
        />
      )}

      <div
        ref={drawerRef}
        id="mobile-menu"
        role="dialog"
        aria-modal={isOpen}
        aria-label={t.navigation}
        // Slid off-screen is not gone: closed, the drawer stayed in the tab
        // order, and focus walked through every link off the left edge of
        // the screen before reaching the article. `inert` takes it out of
        // both the tab order and the accessibility tree. React 18 knows the
        // attribute only as a string — `true` would be dropped with a warning
        // — while its types know it only as a boolean, hence the cast.
        {...((isOpen ? {} : { inert: '' }) as React.HTMLAttributes<HTMLDivElement>)}
        className={`fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 transform transition-transform duration-300 ease-in-out md:hidden print:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } overflow-y-auto`}
      >
        <div className="p-4">
          <nav>
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1" />
              {repoUrl && (
                <a
                  href={repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t.sourceRepository}
                  title={t.sourceRepository}
                  className="rounded-md p-2 text-gray-500 transition-colors hover:text-gray-700 active:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:active:bg-gray-800"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 active:bg-gray-100 dark:active:bg-gray-800 rounded-md transition-colors touch-manipulation"
                aria-label={t.closeMenu}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            {hasOpened &&
              visibleNavigation.map((item, index) => (
                <MobileNavigationItem
                  key={`${item.name}-${index}`}
                  item={item}
                  currentPath={currentPath}
                  level={0}
                  onNavigate={onClose}
                />
              ))}
          </nav>
        </div>
      </div>
    </>
  );
}
