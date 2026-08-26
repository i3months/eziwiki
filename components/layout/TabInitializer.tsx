'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { useTabStore } from '@/lib/store/tabStore';
import { NavigationItem } from '@/lib/payload/types';
import { useUrlMap } from '@/components/providers/UrlMapProvider';
import { normalizeSlug } from '@/lib/navigation/url';
import { useStrings } from '@/components/providers/StringsProvider';
import type { Strings } from '@/lib/i18n/strings';

interface TabInitializerProps {
  navigation: NavigationItem[];
}

/**
 * Helper function to find navigation item by path
 */
export function findNavigationItemByPath(
  items: NavigationItem[],
  path: string,
): NavigationItem | null {
  const normalizedPath = path.replace(/\/$/, '');

  for (const item of items) {
    if (!item.path) {
      if (item.children) {
        const found = findNavigationItemByPath(item.children, path);
        if (found) return found;
      }
      continue;
    }

    const normalizedItemPath = item.path.replace(/\/$/, '');
    if (normalizedItemPath === normalizedPath) {
      return item;
    }

    if (item.children) {
      const found = findNavigationItemByPath(item.children, path);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Routes that a tab can show but that have no content path behind them.
 *
 * They are recorded as the route itself (see `isRoutePath`), so that the back
 * button can return to the graph a reader clicked out of. Anything else that
 * resolves to no document — a former address on its way to a redirect, a 404 —
 * is left unrecorded: an entry for it would only forward the reader away again.
 */
const APP_ROUTES = ['/graph', '/tags'];

function isAppRoute(pathname: string): boolean {
  return APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/** The tab title for an app route: '/tags/deployment/' becomes 'Tags'. */
function routeTitle(pathname: string, t: Strings): string {
  const [segment = ''] = normalizeSlug(pathname).split('/');
  if (segment === 'graph') return t.graph;
  if (segment === 'tags') return t.tags;
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

/** What a tab records for a pathname, or null when it should record nothing. */
interface TabEntry {
  path: string;
  title: string;
}

/**
 * Initializes tabs on first load and handles URL changes
 */
export function TabInitializer({ navigation }: TabInitializerProps) {
  const pathname = usePathname();
  const { toPath } = useUrlMap();
  const t = useStrings();
  const { tabs, addTab, activeTabId, navigateInHistory, hasHydrated } = useTabStore();
  const isInitialMount = useRef(true);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    if (!hasHydrated) return;

    const resolve = (): TabEntry | null => {
      if (pathname === '/') return { path: '', title: t.newTabTitle };

      const docPath = toPath(pathname);
      if (docPath !== null) {
        const navItem = findNavigationItemByPath(navigation, docPath);
        return { path: docPath, title: navItem?.name || t.newTabTitle };
      }

      return isAppRoute(pathname) ? { path: pathname, title: routeTitle(pathname, t) } : null;
    };

    const entry = resolve();

    // No tabs — a first visit, or the list emptied after mount. Not gated on
    // the initial mount, because the tab bar shows only its skeleton while
    // the list is empty: this branch is what brings the bar back, whatever
    // emptied it. An unrecordable route still gets a tab, pointed home.
    if (tabs.length === 0) {
      addTab(entry ?? { title: t.newTabTitle, path: '' });

      isInitialMount.current = false;
      previousPathname.current = pathname;
      return;
    }

    // Initial mount with saved tabs. Recorded as a navigation rather than
    // written over the tab's current entry: reloading the page a tab already
    // shows then changes nothing, and loading another page directly keeps
    // the one the tab was on reachable behind it.
    if (isInitialMount.current) {
      if (activeTabId && entry) {
        navigateInHistory(activeTabId, entry.path, entry.title);
      }

      isInitialMount.current = false;
      previousPathname.current = pathname;
      return;
    }

    // URL changed - add to history
    if (pathname !== previousPathname.current) {
      previousPathname.current = pathname;

      if (activeTabId && entry) {
        navigateInHistory(activeTabId, entry.path, entry.title);
      }
    }
  }, [
    hasHydrated,
    tabs.length,
    pathname,
    navigation,
    toPath,
    addTab,
    activeTabId,
    navigateInHistory,
    t,
  ]);

  return null;
}
