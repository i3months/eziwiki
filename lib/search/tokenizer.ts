/**
 * Tokenisation shared by the index builder and the browser-side searcher.
 *
 * Both sides must tokenise identically or a query will never match the terms
 * stored for a document.
 */

/** Latin, digit, and other non-CJK word characters. */
const WORD = /[^\p{L}\p{N}]+/u;

/**
 * Characters that CJK scripts write without spaces between words.
 * Covers Hangul syllables and jamo, CJK ideographs, and kana.
 */
const CJK = /[ᄀ-ᇿ぀-ヿ㄰-㆏㐀-䶿一-鿿가-힯豈-﫿]/;

/**
 * Whether a string consists entirely of CJK characters.
 */
export function isCjk(term: string): boolean {
  return [...term].every((char) => CJK.test(char));
}

/**
 * Splits a CJK run into overlapping character bigrams.
 *
 * Korean, Chinese, and Japanese are written without spaces, so whitespace
 * tokenisation yields one enormous token per phrase and a search for a word
 * inside it never matches. Indexing bigrams — 위키문서 becomes 위키, 키문, 문서 —
 * makes substring queries work without a morphological analyser. A single
 * character is kept as-is so one-character queries still resolve.
 *
 * @param term - A run of CJK characters
 * @returns The bigrams covering that run
 *
 * @example
 * ```typescript
 * bigrams('위키문서'); // ['위키', '키문', '문서']
 * bigrams('한'); // ['한']
 * ```
 */
export function bigrams(term: string): string[] {
  const chars = [...term];
  if (chars.length < 2) return chars;

  const result: string[] = [];
  for (let i = 0; i < chars.length - 1; i++) {
    result.push(chars[i] + chars[i + 1]);
  }
  return result;
}

/**
 * Splits text into searchable terms.
 *
 * Latin text is split on non-word characters; CJK runs are additionally
 * expanded into bigrams. The whole CJK term is kept alongside its bigrams so
 * that an exact phrase still scores highest.
 *
 * @param text - Text to tokenise
 * @returns Lower-cased terms
 *
 * @example
 * ```typescript
 * tokenize('Quick Start 시작하기');
 * // ['quick', 'start', '시작하기', '시작', '작하', '하기']
 * ```
 */
export function tokenize(text: string): string[] {
  const raw = text.split(WORD).filter(Boolean);
  const terms: string[] = [];

  for (const term of raw) {
    const lower = term.toLowerCase();
    terms.push(lower);

    // Only runs of three or more characters gain anything: the single bigram
    // of a two-character term is the term itself, and pushing it twice
    // doubled that term's weight against every other word in the query.
    if (isCjk(lower) && [...lower].length > 2) {
      terms.push(...bigrams(lower));
    }
  }

  return terms;
}
