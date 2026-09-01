import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Entries a tab's history keeps; older ones fall off the front. */
const MAX_HISTORY = 50;

export interface HistoryEntry {
  path: string;
  title: string;
}

export interface Tab {
  id: string;
  title: string;
  /** Content path, or a route such as '/graph/' — see `isRoutePath` */
  path: string;
  history: HistoryEntry[]; // History stack for this tab
  historyIndex: number; // Current position in history
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  addTab: (tab?: Omit<Tab, 'id' | 'history' | 'historyIndex'>) => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  navigateInHistory: (id: string, path: string, title: string) => void;
  goBack: (id: string) => { path: string; title: string } | null;
  goForward: (id: string) => { path: string; title: string } | null;
  canGoBack: (id: string) => boolean;
  canGoForward: (id: string) => boolean;
  updateTabHistoryIndex: (id: string, index: number) => void;
  closeOtherTabs: (id: string) => void;
  closeTabsToRight: (id: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

/**
 * Brings a persisted state written by an earlier version up to date.
 *
 * Exported so it can be tested: the persist middleware only calls it when
 * the stored version differs, and without a browser there is no storage to
 * rehydrate from at all.
 *
 * @param persistedState - Whatever was in storage
 * @returns The same state, with every tab carrying a history and an index inside it
 */
export function migrateTabState(persistedState: unknown): unknown {
  const state = persistedState as Record<string, unknown>;
  if (state?.tabs && Array.isArray(state.tabs)) {
    state.tabs = state.tabs.map((tab: Record<string, unknown>) => {
      // Handle old format (string array), or a missing or empty history
      let history = tab.history;
      if (!Array.isArray(history) || history.length === 0) {
        history = [{ path: tab.path || '', title: tab.title || 'New Tab' }];
      } else if (typeof history[0] === 'string') {
        // Migrate from old string array format to new object format
        history = history.map((path: string) => ({
          path,
          title: tab.title || 'New Tab',
        }));
      }

      // Clamped rather than defaulted: an index outside the history
      // enables a back button that finds nothing, and lets the next
      // navigation slice entries away.
      const rawIndex = typeof tab.historyIndex === 'number' ? tab.historyIndex : 0;
      const historyIndex = Math.min(Math.max(rawIndex, 0), (history as unknown[]).length - 1);

      return { ...tab, history, historyIndex };
    });
  }
  return state;
}

export const useTabStore = create<TabStore>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,
      sidebarWidth: 256, // Default 256px (w-64)
      sidebarCollapsed: false,
      hasHydrated: false,

      setHasHydrated: (hydrated) => {
        set({ hasHydrated: hydrated });

        // After hydration, ensure at least one tab exists
        if (hydrated) {
          const { tabs } = get();
          if (tabs.length === 0) {
            // No tabs in storage, will be created by PageLayout based on URL
            return;
          }
        }
      },

      addTab: (tab) => {
        const { tabs } = get();

        // Create new tab with default title "New Tab" and initial history
        const initialPath = tab?.path || '';
        const initialTitle = tab?.title || 'New Tab';
        const newTab: Tab = {
          title: initialTitle,
          path: initialPath,
          id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          history: [{ path: initialPath, title: initialTitle }],
          historyIndex: 0,
        };

        set({
          tabs: [...tabs, newTab],
          activeTabId: newTab.id,
        });

        return newTab.id;
      },

      removeTab: (id) => {
        const { tabs, activeTabId } = get();
        const index = tabs.findIndex((t) => t.id === id);

        if (index === -1) return;

        const newTabs = tabs.filter((t) => t.id !== id);

        // If closed tab was active, activate adjacent tab
        let newActiveTabId = activeTabId;
        if (activeTabId === id) {
          if (newTabs.length > 0) {
            // Activate right tab if exists, otherwise left
            newActiveTabId = newTabs[Math.min(index, newTabs.length - 1)]?.id || null;
          } else {
            newActiveTabId = null;
          }
        }

        set({
          tabs: newTabs,
          activeTabId: newActiveTabId,
        });
      },

      setActiveTab: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);

        // Only update if the tab exists
        if (tab) {
          set({ activeTabId: id });
        }
      },

      navigateInHistory: (id, path, title) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id !== id) return tab;

            // Both values are rehydrated from localStorage, where a missing
            // history or an index outside it is only a stale or hand-edited
            // entry away — so they are re-anchored before being trusted. A
            // negative index handed straight to `slice` below would not crash;
            // it would silently discard the tab's entire history.
            const history = tab.history?.length
              ? tab.history
              : [{ path: tab.path, title: tab.title }];
            const index = Math.min(Math.max(tab.historyIndex ?? 0, 0), history.length - 1);

            // If navigating to a new page (not back/forward), add to history
            const currentEntry = history[index];
            if (currentEntry.path === path) {
              // Same page, just update title if needed
              const updatedHistory = [...history];
              updatedHistory[index] = { path, title };
              return { ...tab, title, history: updatedHistory, historyIndex: index };
            }

            // Remove any forward history and add new entry. Capped: the
            // history is persisted, and a tab that has lived for months
            // otherwise carries every page it ever showed.
            const newHistory = history.slice(0, index + 1);
            newHistory.push({ path, title });
            if (newHistory.length > MAX_HISTORY)
              newHistory.splice(0, newHistory.length - MAX_HISTORY);

            return {
              ...tab,
              path,
              title,
              history: newHistory,
              historyIndex: newHistory.length - 1,
            };
          }),
        }));
      },

      goBack: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);

        if (!tab || !tab.history || tab.historyIndex <= 0) return null;

        const newIndex = tab.historyIndex - 1;
        const newEntry = tab.history[newIndex];

        if (!newEntry) return null;

        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id
              ? { ...t, path: newEntry.path, title: newEntry.title, historyIndex: newIndex }
              : t,
          ),
        }));

        return { path: newEntry.path, title: newEntry.title };
      },

      goForward: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);

        if (!tab || !tab.history || tab.historyIndex >= tab.history.length - 1) return null;

        const newIndex = tab.historyIndex + 1;
        const newEntry = tab.history[newIndex];

        if (!newEntry) return null;

        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id
              ? { ...t, path: newEntry.path, title: newEntry.title, historyIndex: newIndex }
              : t,
          ),
        }));

        return { path: newEntry.path, title: newEntry.title };
      },

      // Both mirror what goBack/goForward would actually find, not just the
      // index bounds: a stale persisted index otherwise renders the button
      // enabled while clicking it does nothing.
      canGoBack: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);
        return Boolean(tab?.history?.[tab.historyIndex - 1]);
      },

      canGoForward: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);
        return Boolean(tab?.history?.[tab.historyIndex + 1]);
      },

      updateTabHistoryIndex: (id, index) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);

        if (!tab || !tab.history || index < 0 || index >= tab.history.length) return;

        const entry = tab.history[index];

        if (!entry) return;

        set((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === id ? { ...t, path: entry.path, title: entry.title, historyIndex: index } : t,
          ),
        }));
      },

      // Both bail out on an id the list does not contain: filtering by a stale
      // id would close every tab including the one it meant to keep, and
      // findIndex's -1 fed to slice would empty the list — leaving the tab bar
      // with nothing to show but its loading skeleton.
      closeOtherTabs: (id) => {
        set((state) => {
          if (!state.tabs.some((tab) => tab.id === id)) return state;
          return {
            tabs: state.tabs.filter((tab) => tab.id === id),
            activeTabId: id,
          };
        });
      },

      closeTabsToRight: (id) => {
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === id);
          if (index === -1) return state;

          // The active tab may be among those closed; the one the menu was
          // opened on becomes active then, since it is the rightmost left.
          const activeIndex = state.tabs.findIndex((tab) => tab.id === state.activeTabId);
          return {
            tabs: state.tabs.slice(0, index + 1),
            activeTabId: activeIndex > index ? id : state.activeTabId,
          };
        });
      },

      reorderTabs: (fromIndex, toIndex) => {
        set((state) => {
          const newTabs = [...state.tabs];
          const [movedTab] = newTabs.splice(fromIndex, 1);
          newTabs.splice(toIndex, 0, movedTab);
          return { tabs: newTabs };
        });
      },

      setSidebarWidth: (width) => {
        set({ sidebarWidth: width });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },
    }),
    {
      name: 'tab-storage',
      // Without an explicit version the migration below never ran: zustand
      // only calls `migrate` when the persisted version differs from this one,
      // and both defaulted to 0 — so blobs written before tabs carried a
      // history were rehydrated unmigrated, and the first navigation read
      // `history[0]` off undefined.
      version: 1,
      partialize: (state) => ({
        tabs: state.tabs,
        activeTabId: state.activeTabId,
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      migrate: migrateTabState,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
