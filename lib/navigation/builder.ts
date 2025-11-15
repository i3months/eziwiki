import { NavigationItem } from '../payload/types';

/**
 * Flattens navigation tree to extract all paths
 * @param items - Navigation items array
 * @returns Array of all paths in the navigation
 */
export function extractAllPaths(items: NavigationItem[]): string[] {
  const paths: string[] = [];

  function traverse(items: NavigationItem[]) {
    for (const item of items) {
      if (item.path) {
        paths.push(item.path);
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(items);
  return paths;
}

/**
 * Finds the active navigation item based on current path
 * @param items - Navigation items array
 * @param currentPath - Current page path
 * @returns Active navigation item or null
 */
export function findActiveItem(
  items: NavigationItem[],
  currentPath: string,
): NavigationItem | null {
  for (const item of items) {
    if (item.path === currentPath) {
      return item;
    }
    if (item.children) {
      const found = findActiveItem(item.children, currentPath);
      if (found) return found;
    }
  }
  return null;
}
