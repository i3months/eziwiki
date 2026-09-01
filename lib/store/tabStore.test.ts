import { beforeEach, describe, expect, it } from 'vitest';
import { migrateTabState, useTabStore } from './tabStore';

// The store persists to localStorage, which Node does not have; zustand
// warns once and carries on in memory, which is all these need.

function reset() {
  useTabStore.setState({ tabs: [], activeTabId: null });
}

function open(title: string, path = title.toLowerCase()): string {
  return useTabStore.getState().addTab({ title, path });
}

describe('tabs', () => {
  beforeEach(reset);

  it('activates the tab to the right of a closed active tab, else the left', () => {
    const a = open('A');
    const b = open('B');
    const c = open('C');
    const s = useTabStore.getState();

    s.setActiveTab(b);
    s.removeTab(b);
    expect(useTabStore.getState().activeTabId).toBe(c);

    useTabStore.getState().removeTab(c);
    expect(useTabStore.getState().activeTabId).toBe(a);
  });

  it('ignores a stale id rather than closing everything', () => {
    // Filtering by an id the list does not contain used to close every tab,
    // leaving the bar with nothing but its skeleton.
    open('A');
    open('B');
    useTabStore.getState().closeOtherTabs('gone');
    useTabStore.getState().closeTabsToRight('gone');

    expect(useTabStore.getState().tabs).toHaveLength(2);
  });

  it('moves the active tab left when the close reaches it', () => {
    const a = open('A');
    open('B');
    const c = open('C');
    const s = useTabStore.getState();

    s.setActiveTab(c);
    s.closeTabsToRight(a);

    expect(useTabStore.getState().tabs.map((t) => t.id)).toEqual([a]);
    expect(useTabStore.getState().activeTabId).toBe(a);
  });
});

describe('history', () => {
  beforeEach(reset);

  it('records visits after the current one and drops the forward part', () => {
    const id = open('Home', '');
    const s = useTabStore.getState();

    s.navigateInHistory(id, 'a', 'A');
    s.navigateInHistory(id, 'b', 'B');
    expect(s.goBack(id)).toEqual({ path: 'a', title: 'A' });
    expect(useTabStore.getState().canGoForward(id)).toBe(true);

    useTabStore.getState().navigateInHistory(id, 'c', 'C');
    const tab = useTabStore.getState().tabs[0];

    expect(tab.history.map((h) => h.path)).toEqual(['', 'a', 'c']);
    expect(useTabStore.getState().canGoForward(id)).toBe(false);
  });

  it('keeps the newest fifty entries', () => {
    const id = open('Home', '');
    for (let i = 0; i < 80; i++) useTabStore.getState().navigateInHistory(id, `p${i}`, `P${i}`);

    const tab = useTabStore.getState().tabs[0];
    expect(tab.history).toHaveLength(50);
    expect(tab.history[tab.history.length - 1].path).toBe('p79');
    expect(tab.historyIndex).toBe(49);
    expect(useTabStore.getState().canGoBack(id)).toBe(true);
  });

  it('answers the back button by what going back would find', () => {
    const id = open('Home', '');
    useTabStore.setState((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, historyIndex: 7 } : t)),
    }));

    // The index is stale; the history has one entry. Nothing to go back to.
    expect(useTabStore.getState().canGoBack(id)).toBe(false);
    expect(useTabStore.getState().goBack(id)).toBeNull();
  });
});

describe('migration from an earlier shape', () => {
  it('gives a tab without a history one, and clamps a stale index', () => {
    const migrated = migrateTabState({
      tabs: [
        { id: 't1', title: 'Old', path: 'old' },
        { id: 't2', title: 'Str', path: 'b', history: ['a', 'b'], historyIndex: 9 },
      ],
    }) as {
      tabs: Array<{ history: Array<{ path: string; title: string }>; historyIndex: number }>;
    };

    expect(migrated.tabs[0].history).toEqual([{ path: 'old', title: 'Old' }]);
    expect(migrated.tabs[0].historyIndex).toBe(0);
    expect(migrated.tabs[1].history).toEqual([
      { path: 'a', title: 'Str' },
      { path: 'b', title: 'Str' },
    ]);
    expect(migrated.tabs[1].historyIndex).toBe(1);
  });
});
