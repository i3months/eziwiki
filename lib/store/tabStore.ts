import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryEntry {
  path: string;
  title: string;
}

export interface Tab {
  id: string;
  title: string;
  path: string;
  scrollPosition?: number;
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
  updateTabPath: (id: string, path: string, title: string) => void;
  navigateInHistory: (id: string, path: string, title: string) => void;
  goBack: (id: string) => { path: string; title: string } | null;
  goForward: (id: string) => { path: string; title: string } | null;
  canGoBack: (id: string) => boolean;
  canGoForward: (id: string) => boolean;
  updateTabHistoryIndex: (id: string, index: number) => void;
  updateTabScroll: (id: string, scrollPosition: number) => void;
  closeOtherTabs: (id: string) => void;
  closeTabsToRight: (id: string) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  setSidebarWidth: (width: number) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
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

      updateTabPath: (id, path, title) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, path, title } : tab)),
        }));
      },

      navigateInHistory: (id, path, title) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => {
            if (tab.id !== id) return tab;

            // If navigating to a new page (not back/forward), add to history
            const currentEntry = tab.history[tab.historyIndex];
            if (currentEntry.path === path) {
              // Same page, just update title if needed
              const updatedHistory = [...tab.history];
              updatedHistory[tab.historyIndex] = { path, title };
              return { ...tab, title, history: updatedHistory };
            }

            // Remove any forward history and add new entry
            const newHistory = tab.history.slice(0, tab.historyIndex + 1);
            newHistory.push({ path, title });

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

      canGoBack: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);
        return tab && tab.history ? tab.historyIndex > 0 : false;
      },

      canGoForward: (id) => {
        const { tabs } = get();
        const tab = tabs.find((t) => t.id === id);
        return tab && tab.history ? tab.historyIndex < tab.history.length - 1 : false;
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

      updateTabScroll: (id, scrollPosition) => {
        set((state) => ({
          tabs: state.tabs.map((tab) => (tab.id === id ? { ...tab, scrollPosition } : tab)),
        }));
      },

      closeOtherTabs: (id) => {
        set((state) => ({
          tabs: state.tabs.filter((tab) => tab.id === id),
          activeTabId: id,
        }));
      },

      closeTabsToRight: (id) => {
        set((state) => {
          const index = state.tabs.findIndex((tab) => tab.id === id);
          return {
            tabs: state.tabs.slice(0, index + 1),
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
      // Exclude scroll position when saving to localStorage
      partialize: (state) => ({
        tabs: state.tabs.map((tab) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { scrollPosition, ...rest } = tab;
          return rest;
        }),
        activeTabId: state.activeTabId,
        sidebarWidth: state.sidebarWidth,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
      // Migrate old tabs without history
      migrate: (persistedState: unknown) => {
        const state = persistedState as Record<string, unknown>;
        if (state?.tabs && Array.isArray(state.tabs)) {
          state.tabs = state.tabs.map((tab: Record<string, unknown>) => {
            // Handle old format (string array) or missing history
            let history = tab.history;
            if (!history) {
              history = [{ path: tab.path || '', title: tab.title || 'New Tab' }];
            } else if (Array.isArray(history) && typeof history[0] === 'string') {
              // Migrate from old string array format to new object format
              history = history.map((path: string) => ({
                path,
                title: tab.title || 'New Tab',
              }));
            }

            return {
              ...tab,
              history,
              historyIndex: tab.historyIndex ?? 0,
            };
          });
        }
        return state;
      },
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
