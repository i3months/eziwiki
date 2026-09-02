'use client';

import { useSyncExternalStore } from 'react';
import { Search } from 'lucide-react';
import { useSearchStore } from '@/lib/store/searchStore';
import { useStrings } from '@/components/providers/StringsProvider';

/**
 * Opens the search dialog.
 *
 * Rendered as a fake input rather than a button-looking control because that is
 * what readers expect to click to search; the real input lives in the dialog.
 */
export function SearchTrigger({ className = '' }: { className?: string }) {
  const t = useStrings();
  const open = useSearchStore((state) => state.open);

  // The modifier differs by platform, and the platform is only known in the
  // browser — rendering a guess on the server would hydrate mismatched.
  // `useSyncExternalStore` gives the server snapshot (nothing) and the
  // client one without an effect-and-setState round trip.
  const shortcut = useSyncExternalStore(
    () => () => {},
    () => (/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘K' : 'Ctrl K'),
    () => null,
  );

  return (
    // No aria-label: it read "Search documentation" while the control visibly
    // says "Search…", so the spoken name did not contain the written one and
    // voice control had nothing to match. The text names the button instead;
    // the icon and the shortcut are hidden from the name, the latter because
    // `aria-keyshortcuts` already announces it.
    <button
      type="button"
      onClick={open}
      aria-keyshortcuts="Meta+K Control+K"
      className={`flex items-center gap-2 rounded-md border border-gray-300 bg-white px-2 py-1 text-sm text-gray-500 transition-colors hover:border-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-600 ${className}`}
    >
      <Search className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-left">{t.search}</span>
      {shortcut && (
        <kbd
          aria-hidden="true"
          className="hidden flex-shrink-0 rounded border border-gray-300 px-1 py-0.5 text-[10px] text-gray-500 sm:block dark:border-gray-600 dark:text-gray-300"
        >
          {shortcut}
        </kbd>
      )}
    </button>
  );
}
