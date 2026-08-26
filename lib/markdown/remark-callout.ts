import { visit } from 'unist-util-visit';
import { toString as mdastToString } from 'mdast-util-to-string';
import type { Root, Blockquote, PhrasingContent, BlockContent } from 'mdast';

/**
 * Turns `> [!NOTE]` blockquotes into callouts.
 *
 * The syntax is GitHub's and Obsidian's alike, which is the reason for
 * choosing it: a document written for either renders here, and one written
 * here still reads as an ordinary blockquote anywhere that does not know the
 * convention. Nothing is invented.
 *
 * Runs on the Markdown AST so the body passes through the rest of the pipeline
 * unchanged — links, code and wiki links inside a callout behave exactly as
 * they do outside one.
 */

/**
 * Marker opening a callout: the kind, an optional fold hint, and an optional
 * title on the same line.
 */
const MARKER = /^\[!([A-Za-z]+)\]([-+])?\s*(.*)$/;

/**
 * Callout kinds, and the ones that are the same thing under another name.
 *
 * GitHub defines five; Obsidian defines more and its vaults use them, so the
 * extra names map onto the nearest kind rather than falling back to a plain
 * quote. A vault should not lose its formatting on the way in.
 */
const KINDS: Record<string, string> = {
  note: 'note',
  info: 'note',
  abstract: 'note',
  summary: 'note',
  tip: 'tip',
  hint: 'tip',
  success: 'tip',
  check: 'tip',
  done: 'tip',
  important: 'important',
  example: 'important',
  question: 'important',
  help: 'important',
  faq: 'important',
  warning: 'warning',
  attention: 'warning',
  todo: 'warning',
  caution: 'caution',
  danger: 'caution',
  error: 'caution',
  failure: 'caution',
  fail: 'caution',
  bug: 'caution',
};

/** What a callout marker said. */
interface Marker {
  /** Normalised kind, one of the values in {@link KINDS} */
  kind: string;
  /** Heading text, defaulting to the kind when the author gave none */
  title: PhrasingContent[];
  /** Whether the body folds away, and whether it starts open */
  fold: 'none' | 'open' | 'closed';
}

/**
 * Reads the marker from the first line of a blockquote.
 *
 * @param node - The blockquote to inspect
 * @returns The marker, or null when this is an ordinary quote
 */
function readMarker(node: Blockquote): Marker | null {
  const [first] = node.children;
  if (!first || first.type !== 'paragraph') return null;

  const [lead] = first.children;
  if (!lead || lead.type !== 'text') return null;

  // Only the first line carries the marker; the rest of the paragraph is body.
  const newline = lead.value.indexOf('\n');
  const head = newline === -1 ? lead.value : lead.value.slice(0, newline);

  const match = MARKER.exec(head.trim());
  if (!match) return null;

  const kind = KINDS[match[1].toLowerCase()];
  if (!kind) return null;

  const title: PhrasingContent[] = [];
  const body: PhrasingContent[] = [];

  if (newline !== -1) {
    // The marker line ends inside the leading text: the title is the rest of
    // that line, and everything after is body.
    const heading = match[3].trim();
    if (heading) title.push({ type: 'text', value: heading });

    const rest = lead.value.slice(newline + 1);
    if (rest) body.push({ type: 'text', value: rest });
    body.push(...first.children.slice(1));
  } else {
    // The title runs on into the inline nodes that follow — `Use \`npm ci\`
    // instead` is a text node, a code node and a text node — up to the first
    // newline in any of them. Reading only the leading text made the title
    // "Use" and moved the rest into the body.
    // The marker was matched against the trimmed line, so the space before
    // the next node has to be put back or "Use" and the code run together.
    const continues = first.children.length > 1;
    const heading = continues
      ? `${match[3].trimStart()}${/\s$/.test(head) ? ' ' : ''}`
      : match[3].trim();
    if (heading.trim()) title.push({ type: 'text', value: heading });

    let i = 1;
    for (; i < first.children.length; i++) {
      const child = first.children[i];

      // A hard break — two trailing spaces, or a backslash — ends the line
      // as surely as a newline in the text does, and the body follows it.
      if (child.type === 'break') {
        i += 1;
        break;
      }

      // Emphasis or a link that runs on past the end of the line carries
      // the newline inside itself; the title ends where that node begins.
      if (child.type !== 'text' && mdastToString(child).includes('\n')) break;

      if (child.type === 'text' && child.value.includes('\n')) {
        const at = child.value.indexOf('\n');
        const before = child.value.slice(0, at).trimEnd();
        const after = child.value.slice(at + 1);

        if (before) title.push({ type: 'text', value: before });
        if (after) body.push({ type: 'text', value: after });
        i += 1;
        break;
      }

      title.push(child);
    }

    body.push(...first.children.slice(i));
  }

  node.children = [
    ...(body.length ? [{ type: 'paragraph' as const, children: body }] : []),
    ...node.children.slice(1),
  ];

  return {
    kind,
    title: title.length ? title : [{ type: 'text', value: titleFor(kind) }],
    fold: match[2] === '-' ? 'closed' : match[2] === '+' ? 'open' : 'none',
  };
}

/** Default heading for a kind, when the author supplied none. */
function titleFor(kind: string): string {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

/**
 * Turns the blockquote into the callout, in place.
 *
 * A foldable callout becomes `<details>`, which opens and closes without any
 * script — the browser already knows how to do this, and a disclosure that
 * depends on JavaScript is one that fails with it disabled.
 *
 * In place rather than as a fresh node, because the visitor goes on into the
 * children of the node it was handed: a callout nested inside this one is
 * written back into *that* node's children, and when those were a copy the
 * nested callout was lost with it — its marker stripped, its title gone.
 */
function toCallout(node: Blockquote, marker: Marker): void {
  const foldable = marker.fold !== 'none';

  const heading: BlockContent = {
    type: 'paragraph',
    data: {
      hName: foldable ? 'summary' : 'p',
      hProperties: { className: ['ezw-callout__title'] },
    },
    children: marker.title,
  };

  node.data = {
    hName: foldable ? 'details' : 'div',
    hProperties: {
      className: ['ezw-callout', `ezw-callout--${marker.kind}`],
      ...(marker.fold === 'open' ? { open: true } : {}),
    },
  };
  node.children = [heading, ...node.children];
}

/**
 * Remark plugin factory.
 *
 * @example
 * ```typescript
 * unified().use(remarkParse).use(remarkCallouts);
 * // > [!WARNING] Mind the gap
 * // > Body text.
 * ```
 */
export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const marker = readMarker(node);
      if (marker) toCallout(node, marker);

      // Nothing returned: the visitor continues into the children, which is
      // where a nested callout is found and converted in turn.
    });
  };
}
