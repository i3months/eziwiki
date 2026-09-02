'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Hash, Loader2, Search as SearchIcon } from 'lucide-react';
import { useSearchStore } from '@/lib/store/searchStore';
import { search, type SearchResult } from '@/lib/search/client';
import { useStrings } from '@/components/providers/StringsProvider';
import { format } from '@/lib/i18n/format';

/**
 * Full-text search dialog, opened with ⌘K or from the sidebar.
 *
 * The index is fetched the first time the dialog opens, so search costs nothing
 * until it is used. All matching happens in the browser against a static JSON
 * file, which keeps it working on any static host.
 */

/** Debounce applied to keystrokes before querying. */
const DEBOUNCE_MS = 120;

/**
 * Renders text with the query terms highlighted.
 *
 * Terms are matched case-insensitively and escaped before being put into a
 * pattern, so a query containing regex metacharacters cannot break the match.
 */
function Highlighted({
  text,
  query,
  matched = [],
}: {
  text: string;
  query: string;
  /** The document terms the search matched; see `SearchResult.terms` */
  matched?: string[];
}) {
  // What the reader typed and what actually matched, longest first so that
  // `배포하기` is marked whole rather than as `배포` and `하기`. Marking only
  // the typed words left `설치를` — which never appears — unmarked, and a
  // typo'd `linkz` with nothing marked at all.
  const terms = [...new Set([...query.trim().split(/\s+/), ...matched])]
    .filter((term) => term.length > 1 || /[가-힣]/.test(term))
    .sort((a, b) => b.length - a.length)
    .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  if (terms.length === 0) return <>{text}</>;

  // nosemgrep -- every term was regex-escaped four lines up
  const parts = text.split(new RegExp(`(${terms.join('|')})`, 'gi'));
  const lowered = terms.map((term) => term.toLowerCase().replace(/\\(.)/g, '$1'));

  return (
    <>
      {parts.map((part, index) =>
        lowered.includes(part.toLowerCase()) ? (
          <mark
            key={index}
            className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={index}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

export function SearchDialog() {
  const t = useStrings();
  const router = useRouter();
  const { isOpen, close, toggle } = useSearchStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selected, setSelected] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Global shortcut. Bound on the document so it works regardless of focus.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.isComposing) return;

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
        return;
      }

      // Escape is bound here as well as on the dialog, for the moment focus
      // is somewhere the dialog's own handler cannot hear.
      if (event.key === 'Escape' && useSearchStore.getState().isOpen) {
        close();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [toggle, close]);

  // Reset each time the dialog opens — during render, as React advises for
  // state that follows another piece of state, so the stale query is never
  // painted at all.
  const [wasOpen, setWasOpen] = useState(false);
  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);
    if (isOpen) {
      setQuery('');
      setResults([]);
      setSelected(0);
      setError(null);
      setIsLoading(false);
    }
  }

  // Focus the field on open, and give focus back on close.
  useEffect(() => {
    if (!isOpen) return;

    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    // Focus after paint, or the input is not yet mounted.
    const raf = requestAnimationFrame(() => inputRef.current?.focus());

    return () => {
      cancelAnimationFrame(raf);
      // Back to whatever opened the dialog — for a keyboard user the trigger
      // they pressed. Left alone, focus drops to the body on close.
      opener?.focus();
    };
  }, [isOpen]);

  // Prevent the page behind the dialog from scrolling.
  useEffect(() => {
    if (!isOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  // Run the query, debounced, discarding responses that arrive out of order.
  // The loading flag is set where the query is typed, so this effect only
  // owns the asynchronous part.
  useEffect(() => {
    if (!isOpen) return;

    const trimmed = query.trim();
    if (!trimmed) return;

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const found = await search(trimmed);
        if (cancelled) return;

        setResults(found);
        setSelected(0);
        setError(null);
      } catch {
        if (cancelled) return;
        setError(t.searchError);
        setResults([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query, isOpen, t.searchError]);

  const go = useCallback(
    (result: SearchResult) => {
      close();
      router.push(result.url);
    },
    [close, router],
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    // Enter, Escape and the arrows all have a meaning to an IME while a
    // syllable is being composed; acting on them here would open the top hit
    // for a Korean query the reader had not finished typing.
    if (event.nativeEvent.isComposing) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }

    // Focus stays inside. The dialog says `aria-modal`, which tells assistive
    // technology the page behind is inert; letting Tab walk out onto it put
    // the reader on content they had been told was not there.
    if (event.key === 'Tab' && dialogRef.current) {
      const focusable = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'input, button, [href], [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (results.length === 0) return;

      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = (selected + delta + results.length) % results.length;

      setSelected(next);
      listRef.current?.children[next]?.scrollIntoView({ block: 'nearest' });
      return;
    }

    if (event.key === 'Enter' && results[selected]) {
      event.preventDefault();
      go(results[selected]);
    }
  };

  if (!isOpen) return null;

  const trimmed = query.trim();
  // What a screen reader is told as the list changes: the arrows move the
  // selection without moving focus, so nothing else would announce it.
  const status = error
    ? error
    : trimmed && !isLoading
      ? results.length > 0
        ? format(t.searchResults, { count: results.length })
        : format(t.searchEmpty, { query: trimmed })
      : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh]"
      role="presentation"
      onMouseDown={close}
    >
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px]" aria-hidden="true" />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t.searchDialog}
        className="relative w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-black/10 dark:bg-gray-900 dark:ring-white/10"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 dark:border-gray-800">
          <SearchIcon className="h-4 w-4 flex-shrink-0 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              const value = event.target.value;
              setQuery(value);
              // Owned here rather than by the effect: synchronous state
              // belongs to the event, the effect keeps only the timer.
              setIsLoading(Boolean(value.trim()));
              if (!value.trim()) {
                setResults([]);
                setSelected(0);
              }
            }}
            placeholder={t.searchPlaceholder}
            aria-label={t.searchQuery}
            role="combobox"
            aria-expanded={results.length > 0}
            aria-autocomplete="list"
            aria-controls={results.length > 0 ? 'search-results' : undefined}
            aria-activedescendant={results.length > 0 ? `search-result-${selected}` : undefined}
            className="flex-1 bg-transparent py-3.5 text-sm text-gray-900 outline-none placeholder:text-gray-500 dark:text-gray-100 dark:placeholder:text-gray-400"
          />
          {isLoading && <Loader2 className="h-4 w-4 flex-shrink-0 animate-spin text-gray-400" />}
          <kbd className="hidden flex-shrink-0 rounded border border-gray-300 px-1.5 py-0.5 text-[10px] text-gray-500 sm:block dark:border-gray-700 dark:text-gray-400">
            ESC
          </kbd>
        </div>

        <div aria-live="polite" className="sr-only">
          {status}
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {error && (
            <p className="px-4 py-8 text-center text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {!error && query.trim() && !isLoading && results.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {format(t.searchEmpty, { query: query.trim() })}
            </p>
          )}

          {!error && !query.trim() && (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t.searchHint}
            </p>
          )}

          {results.length > 0 && (
            <ul ref={listRef} id="search-results" role="listbox" className="py-2">
              {results.map((result, index) => (
                // The option is the row itself rather than a button inside it:
                // an option may not contain a control, and the input's
                // `aria-activedescendant` has to name the row.
                <li
                  key={result.id}
                  id={`search-result-${index}`}
                  role="option"
                  aria-selected={index === selected}
                  onClick={() => go(result)}
                  onMouseEnter={() => setSelected(index)}
                  className={`flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                    index === selected ? 'bg-blue-50 dark:bg-blue-950/40' : ''
                  }`}
                >
                  {result.section ? (
                    <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  ) : (
                    <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  )}

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                      <Highlighted
                        text={result.section ?? result.title}
                        query={query}
                        matched={result.terms}
                      />
                    </span>

                    {result.section && (
                      <span className="block truncate text-xs text-gray-500 dark:text-gray-400">
                        {result.title}
                      </span>
                    )}

                    {result.excerpt && (
                      <span className="mt-0.5 block line-clamp-2 text-xs text-gray-600 dark:text-gray-400">
                        <Highlighted text={result.excerpt} query={query} matched={result.terms} />
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden items-center gap-4 border-t border-gray-200 px-4 py-2 text-[11px] text-gray-500 sm:flex dark:border-gray-800 dark:text-gray-400">
          <span>
            <kbd className="font-sans">↑↓</kbd> {t.searchNavigateHint}
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> {t.searchSelectHint}
          </span>
          <span>
            <kbd className="font-sans">esc</kbd> {t.searchCloseHint}
          </span>
        </div>
      </div>
    </div>
  );
}
