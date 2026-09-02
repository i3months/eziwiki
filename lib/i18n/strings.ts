/**
 * The wiki's own words — everything the interface says that the author did not
 * write.
 *
 * A page's content is whatever language it was written in, but the furniture
 * around it — the search box, the contents rail, the link to the next page —
 * was in English regardless, so a Korean wiki read as half-translated. These
 * are resolved once on the server from `global.lang` and handed to the client
 * tree as plain data, so a visitor downloads one language rather than all of
 * them.
 *
 * A value may contain `{placeholders}`; see {@link format}.
 */
export interface Strings {
  /** Visible label on the search control */
  search: string;
  /** Accessible name of the search dialog */
  searchDialog: string;
  /** Placeholder inside the search field */
  searchPlaceholder: string;
  /** Accessible name of the search field */
  searchQuery: string;
  /** Shown before anything has been typed */
  searchHint: string;
  /** Shown when a query matches nothing. `{query}` */
  searchEmpty: string;
  /** Shown when the index could not be fetched */
  searchError: string;
  /** Read out when results arrive. `{count}` */
  searchResults: string;
  /** Footer hint after the arrow keys */
  searchNavigateHint: string;
  /** Footer hint after the enter key */
  searchSelectHint: string;
  /** Footer hint after the escape key */
  searchCloseHint: string;

  /** Link to the repository the wiki is kept in */
  sourceRepository: string;
  /** Collapses the sidebar to its rail */
  collapseSidebar: string;
  /** Restores the full sidebar */
  expandSidebar: string;
  /** Folds a navigation section. `{name}` */
  collapseSection: string;
  /** Unfolds a navigation section. `{name}` */
  expandSection: string;
  /** Opens the navigation on a narrow screen */
  toggleMenu: string;
  /** Dismisses the navigation on a narrow screen */
  closeMenu: string;
  /** Jumps past the navigation to the article */
  skipToContent: string;
  /** Accessible name of the site navigation */
  navigation: string;
  /** Heading on the home page before a page is chosen */
  homeEmptyTitle: string;
  /** What to do about it */
  homeEmptyBody: string;
  /** Accessible name of the breadcrumb trail */
  breadcrumb: string;
  /** Steps back through visited pages */
  goBack: string;
  /** Steps forward again */
  goForward: string;
  /** Switches to the light theme */
  switchToLight: string;
  /** Switches to the dark theme */
  switchToDark: string;

  /** Opens another tab */
  newTab: string;
  /** Name a tab carries before it holds a page */
  newTabTitle: string;
  /** Closes a tab */
  closeTab: string;
  /** Accessible name of the tab strip */
  tabs: string;
  /** Accessible name of a tab's context menu */
  tabActions: string;
  /** Closes every tab but this one */
  closeOtherTabs: string;
  /** Closes every tab after this one */
  closeTabsToRight: string;

  /** Heading above the contents rail */
  onThisPage: string;
  /** Accessible name of the previous/next pair */
  pageNavigation: string;
  /** Label above the preceding page */
  previous: string;
  /** Label above the following page */
  next: string;
  /** Accessible name of the tag row */
  tags: string;
  /** Heading above the pages linking here, when there is one. `{count}` */
  linkedFromOne: string;
  /** Heading above the pages linking here. `{count}` */
  linkedFromMany: string;
  /** Heading above the neighbourhood graph, when there is one. `{count}` */
  connectedToOne: string;
  /** Heading above the neighbourhood graph. `{count}` */
  connectedToMany: string;
  /** States when the page last changed. `{date}` */
  lastUpdated: string;
  /** Link to the page's source */
  editThisPage: string;
  /** Resting label on a code block's copy button */
  copy: string;
  /** Confirmation shown after copying */
  copied: string;
  /** Accessible name of a heading's own link. `{title}` */
  linkToSection: string;
  /** Precedes the source of included content */
  includedFrom: string;
  /** Accessible name of a diagram drawn from a fence */
  diagram: string;

  /** Opens the viewer from the first-page preview. `{name}` */
  pdfOpen: string;
  /** The same, on the button itself, where the name is already beside it */
  pdfOpenShort: string;
  /** Shown while an embedded document is being opened */
  pdfLoading: string;
  /** Shown when an embedded document cannot be opened */
  pdfError: string;
  /** Accessible name of the document viewer. `{name}` */
  pdfDocument: string;
  /** Where the reader is in the document. `{page}`, `{pages}` */
  pdfPageOf: string;
  /** Goes back one page */
  pdfPrevious: string;
  /** Goes forward one page */
  pdfNext: string;
  /** Makes the pages larger */
  pdfZoomIn: string;
  /** Makes the pages smaller */
  pdfZoomOut: string;
  /** Saves the document */
  pdfDownload: string;
  /** Fills the screen with the viewer */
  pdfFullscreen: string;
  /** Returns the viewer to the page */
  pdfExitFullscreen: string;

  /** Heading on a former address */
  pageMoved: string;
  /** Explains the forwarding on a former address */
  pageMovedBody: string;
  /** Link to the page that superseded the address. `{title}` */
  continueTo: string;

  /** Heading on the 404 page */
  notFound: string;
  /** What went wrong, on the 404 page */
  notFoundBody: string;
  /** What to do about it, on the 404 page */
  notFoundHint: string;
  /** Link back to the front page */
  goHome: string;

  /** Heading when something went wrong rendering a page */
  error: string;
  /** What to do about an ordinary error */
  errorBody: string;
  /** Heading when the page could not be rendered at all */
  criticalError: string;
  /** What to do about a critical error */
  criticalErrorBody: string;
  /** Retries rendering */
  tryAgain: string;

  /** Heading on the whole-site graph */
  graph: string;
  /** What the whole-site graph shows */
  graphDescription: string;
  /** Accessible name of the drawn graph. `{pages}`, `{links}` */
  graphLabel: string;
  /** Shown in place of a graph with nothing in it */
  graphEmpty: string;
  /** Sizes up the graph. `{pages}`, `{links}`, `{connected}` */
  graphSummary: string;
  /** How to read the graph */
  graphHint: string;
  /** Heading above the links that resolve to nothing. `{count}` */
  unresolvedLinks: string;
  /** One unresolved link. `{target}`, `{page}` */
  unresolvedLink: string;
  /** Why an unresolved link is ambiguous. `{candidates}` */
  unresolvedAmbiguous: string;
  /** Heading above the pages the wiki refers to but does not have. `{count}` */
  wantedPages: string;
  /** How many pages are asking for a wanted page. `{count}` */
  wantedBy: string;
}

/**
 * The default language, and the fallback for every other.
 *
 * A missing translation shows English rather than the key itself: a reader who
 * meets one unexpected English word can still use the control, and one who
 * meets `searchPlaceholder` cannot.
 */
const EN: Strings = {
  search: 'Search…',
  searchDialog: 'Search documentation',
  searchPlaceholder: 'Search documentation…',
  searchQuery: 'Search query',
  searchHint: 'Search titles, headings, and page contents.',
  searchEmpty: 'No results for “{query}”',
  searchError: 'Search is unavailable. Try reloading the page.',
  searchResults: '{count} results',
  searchNavigateHint: 'to navigate',
  searchSelectHint: 'to select',
  searchCloseHint: 'to close',

  sourceRepository: 'Source repository',
  collapseSidebar: 'Collapse sidebar',
  expandSidebar: 'Expand sidebar',
  collapseSection: 'Collapse {name}',
  expandSection: 'Expand {name}',
  toggleMenu: 'Toggle menu',
  closeMenu: 'Close menu',
  skipToContent: 'Skip to content',
  navigation: 'Navigation',
  homeEmptyTitle: 'Welcome',
  homeEmptyBody: 'Pick a page from the sidebar, or press ⌘K to search.',
  breadcrumb: 'Breadcrumb',
  goBack: 'Go back',
  goForward: 'Go forward',
  switchToLight: 'Switch to light mode',
  switchToDark: 'Switch to dark mode',

  newTab: 'New tab',
  newTabTitle: 'New Tab',
  closeTab: 'Close tab',
  tabs: 'Tabs',
  tabActions: 'Tab actions',
  closeOtherTabs: 'Close others',
  closeTabsToRight: 'Close to the right',

  onThisPage: 'On this page',
  pageNavigation: 'Page navigation',
  previous: 'Previous',
  next: 'Next',
  tags: 'Tags',
  linkedFromOne: 'Linked from {count} page',
  linkedFromMany: 'Linked from {count} pages',
  connectedToOne: 'Connected to {count} page',
  connectedToMany: 'Connected to {count} pages',
  lastUpdated: 'Last updated on {date}',
  editThisPage: 'Edit this page',
  copy: 'Copy',
  copied: 'Copied',
  linkToSection: 'Link to this section: {title}',
  includedFrom: 'From ',
  diagram: 'Diagram',

  pdfOpen: 'Open {name}',
  pdfOpenShort: 'Open',
  pdfLoading: 'Opening document…',
  pdfError: 'This document could not be shown.',
  pdfDocument: '{name}, document viewer',
  pdfPageOf: 'Page {page} of {pages}',
  pdfPrevious: 'Previous page',
  pdfNext: 'Next page',
  pdfZoomIn: 'Zoom in',
  pdfZoomOut: 'Zoom out',
  pdfDownload: 'Download',
  pdfFullscreen: 'Full screen',
  pdfExitFullscreen: 'Exit full screen',

  pageMoved: 'This page moved',
  pageMovedBody: 'You are being taken there now. If nothing happens, follow the link.',
  continueTo: 'Continue to {title}',

  notFound: 'Page not found',
  notFoundBody: 'The page you’re looking for doesn’t exist or has been moved.',
  notFoundHint: 'Try using the navigation sidebar to find what you’re looking for.',
  goHome: 'Go back home',

  error: 'Something went wrong',
  errorBody: 'This page could not be shown. Trying again may be enough.',
  criticalError: 'Critical error',
  criticalErrorBody: 'The page could not be loaded at all. Refreshing may be enough.',
  tryAgain: 'Try again',

  graph: 'Graph',
  graphDescription: 'How the pages in this wiki link to one another.',
  graphLabel: 'Link graph of {pages} pages and {links} links',
  graphEmpty: 'No pages to graph yet.',
  graphSummary:
    '{pages} pages, {links} links. {connected} pages are connected to at least one other.',
  graphHint: 'Hover a node to isolate its neighbours; click to open the page.',
  unresolvedLinks: 'Unresolved links ({count})',
  unresolvedLink: '{target} in {page}',
  unresolvedAmbiguous: 'matches {candidates}',
  wantedPages: 'Wanted pages ({count})',
  wantedBy: 'wanted by {count}',
};

const KO: Strings = {
  search: '검색…',
  searchDialog: '문서 검색',
  searchPlaceholder: '문서 검색…',
  searchQuery: '검색어',
  searchHint: '제목, 소제목, 본문에서 찾습니다.',
  searchEmpty: '“{query}” 검색 결과가 없습니다',
  searchError: '검색을 사용할 수 없습니다. 페이지를 새로고침해 보세요.',
  searchResults: '검색 결과 {count}개',
  searchNavigateHint: '이동',
  searchSelectHint: '선택',
  searchCloseHint: '닫기',

  sourceRepository: '소스 저장소',
  collapseSidebar: '사이드바 접기',
  expandSidebar: '사이드바 펼치기',
  collapseSection: '{name} 접기',
  expandSection: '{name} 펼치기',
  toggleMenu: '메뉴 열고 닫기',
  closeMenu: '메뉴 닫기',
  skipToContent: '본문으로 건너뛰기',
  navigation: '탐색',
  homeEmptyTitle: '환영합니다',
  homeEmptyBody: '사이드바에서 페이지를 고르거나 ⌘K로 검색하세요.',
  breadcrumb: '현재 위치',
  goBack: '뒤로 가기',
  goForward: '앞으로 가기',
  switchToLight: '밝은 화면으로 전환',
  switchToDark: '어두운 화면으로 전환',

  newTab: '새 탭',
  newTabTitle: '새 탭',
  closeTab: '탭 닫기',
  tabs: '탭',
  tabActions: '탭 메뉴',
  closeOtherTabs: '다른 탭 닫기',
  closeTabsToRight: '오른쪽 탭 닫기',

  onThisPage: '이 페이지의 목차',
  pageNavigation: '페이지 이동',
  previous: '이전',
  next: '다음',
  tags: '태그',
  // Korean does not inflect for number, so both forms are the same sentence.
  linkedFromOne: '이 페이지를 가리키는 문서 {count}개',
  linkedFromMany: '이 페이지를 가리키는 문서 {count}개',
  connectedToOne: '연결된 문서 {count}개',
  connectedToMany: '연결된 문서 {count}개',
  lastUpdated: '마지막 수정: {date}',
  editThisPage: '이 페이지 편집',
  copy: '복사',
  copied: '복사됨',
  linkToSection: '이 절로 가는 링크: {title}',
  includedFrom: '출처: ',
  diagram: '다이어그램',

  pdfOpen: '{name} 열기',
  pdfOpenShort: '열기',
  pdfLoading: '문서를 여는 중…',
  pdfError: '이 문서를 표시하지 못했습니다.',
  pdfDocument: '{name} 문서 뷰어',
  pdfPageOf: '{pages}쪽 중 {page}쪽',
  pdfPrevious: '이전 쪽',
  pdfNext: '다음 쪽',
  pdfZoomIn: '확대',
  pdfZoomOut: '축소',
  pdfDownload: '내려받기',
  pdfFullscreen: '전체 화면',
  pdfExitFullscreen: '전체 화면 끝내기',

  pageMoved: '이 페이지는 옮겨졌습니다',
  pageMovedBody: '곧 새 주소로 이동합니다. 이동하지 않으면 아래 링크를 눌러 주세요.',
  continueTo: '{title}(으)로 이동',

  notFound: '페이지를 찾을 수 없습니다',
  notFoundBody: '찾으시는 페이지가 없거나 다른 주소로 옮겨졌습니다.',
  notFoundHint: '왼쪽 사이드바에서 찾아보세요.',
  goHome: '첫 페이지로',

  error: '문제가 발생했습니다',
  errorBody: '이 페이지를 표시하지 못했습니다. 다시 시도해 보세요.',
  criticalError: '심각한 오류',
  criticalErrorBody: '페이지를 불러오지 못했습니다. 새로고침해 보세요.',
  tryAgain: '다시 시도',

  graph: '그래프',
  graphDescription: '이 위키의 문서들이 서로 어떻게 이어져 있는지 보여줍니다.',
  graphLabel: '문서 {pages}개와 링크 {links}개의 연결 그래프',
  graphEmpty: '아직 그릴 문서가 없습니다.',
  graphSummary: '문서 {pages}개, 링크 {links}개. 그중 {connected}개가 다른 문서와 이어져 있습니다.',
  graphHint: '노드에 마우스를 올리면 이웃만 남고, 클릭하면 해당 문서로 이동합니다.',
  unresolvedLinks: '연결되지 않은 링크 ({count})',
  unresolvedLink: '{page}의 {target}',
  unresolvedAmbiguous: '{candidates}에 모두 해당',
  wantedPages: '아직 없는 문서 ({count})',
  wantedBy: '{count}개 문서가 참조',
};

/**
 * Every language the interface is translated into.
 *
 * Keyed by primary subtag. A wiki in a language not listed here writes its own
 * words through `global.strings` rather than waiting for a translation to be
 * contributed — see {@link resolveStrings}.
 */
const TABLES: Record<string, Strings> = { en: EN, ko: KO };

/**
 * Chooses the interface language and applies any per-wiki wording.
 *
 * `lang` is a BCP 47 tag, so it may carry a region — `ko-KR` and `ko` want the
 * same table. Anything unrecognised falls back to English, which is wrong but
 * usable, unlike a half-resolved interface.
 *
 * @param lang - BCP 47 tag from `global.lang`
 * @param overrides - Individual replacements from `global.strings`
 * @returns A complete set of strings
 *
 * @example
 * ```typescript
 * resolveStrings('ko-KR').onThisPage; // '이 페이지의 목차'
 * resolveStrings('de', { search: 'Suchen…' }).search; // 'Suchen…'
 * ```
 */
export function resolveStrings(lang?: string, overrides?: Partial<Strings>): Strings {
  const tag = (lang || 'en').toLowerCase();
  const table = TABLES[tag] || TABLES[tag.split('-')[0]] || EN;

  return overrides ? { ...table, ...overrides } : table;
}

export { EN as DEFAULT_STRINGS };
export { format } from './format';
