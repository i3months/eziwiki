import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Tab {
  id: string;
  title: string;
  path: string;
  scrollPosition?: number;
}

interface TabStore {
  tabs: Tab[];
  activeTabId: string | null;
  sidebarWidth: number;
  sidebarCollapsed: boolean;
  hasHydrated: boolean;
  setHasHydrated: (hydrated: boolean) => void;
  addTab: (tab?: Omit<Tab, 'id'>) => string;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabPath: (id: string, path: string, title: string) => void;
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
      },

      addTab: (tab) => {
        const { tabs } = get();

        // Create new tab with default title "New Tab"
        const newTab: Tab = {
          title: tab?.title || 'New Tab',
          path: tab?.path || '',
          id: `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
