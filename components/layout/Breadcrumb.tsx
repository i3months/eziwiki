'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { NavigationItem } from '@/lib/payload/types';
import { resolvePathToHash, resolveHashToPath } from '@/lib/navigation/hash';

interface BreadcrumbProps {
  navigation: NavigationItem[];
}

/**
 * Build breadcrumb trail by finding the path through navigation tree
 */
function buildBreadcrumbTrail(
  items: NavigationItem[],
  targetPath: string,
  trail: Array<{ name: string; path?: string }> = [],
): Array<{ name: string; path?: string }> | null {
  for (const item of items) {
    // Found the target
    if (item.path === targetPath) {
      return [...trail, { name: item.name, path: item.path }];
    }

    // Search in children - include parent in trail only if it has children
    if (item.children) {
      const found = buildBreadcrumbTrail(item.children, targetPath, [
        ...trail,
        { name: item.name, path: item.path },
      ]);
      if (found) return found;
    }
  }

  return null;
}

export function Breadcrumb({ navigation }: BreadcrumbProps) {
  const pathname = usePathname();

  // Remove leading and trailing slashes
  let currentHash = pathname.startsWith('/') ? pathname.slice(1) : pathname;
  currentHash = currentHash.endsWith('/') ? currentHash.slice(0, -1) : currentHash;

  // Home page - don't show breadcrumb
  if (!currentHash) {
    return null;
  }

  // Resolve hash to actual path
  const currentPath = resolveHashToPath(currentHash, navigation);

  if (!currentPath) {
    return null;
  }

  // Build breadcrumb trail from navigation structure
  const trail = buildBreadcrumbTrail(navigation, currentPath);

  // If no trail found, don't show breadcrumb
  if (!trail || trail.length === 0) {
    return null;
  }

  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
      {trail.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <svg
              className="w-3.5 h-3.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}

          {index === trail.length - 1 || !item.path ? (
            <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
          ) : (
            <Link
              href={`/${resolvePathToHash(item.path, navigation)}`}
              className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
