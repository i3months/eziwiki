import React, { useEffect, useState } from 'react';

/**
 * Collapsible container for a navigation subtree.
 *
 * Animated through grid rows rather than a capped max-height: a cap stays in
 * force after the transition, so any section taller than it was clipped for
 * good — a limit an author reaches by simply writing enough pages. Fractional
 * rows track the real content height instead. The inner wrapper is what
 * actually clips, and needs `min-h-0` so the collapsed row can shrink below
 * the content's own minimum size.
 */
export function Collapse({
  expanded,
  style,
  children,
}: {
  expanded: boolean;
  /** Extra container styles, e.g. a coloured section's background */
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  // A section's pages are rendered the first time it opens, and kept after
  // so the closing animation has something to fold. Rendered from the start,
  // every page in every folded section was in every page's HTML.
  const [rendered, setRendered] = useState(expanded);
  useEffect(() => {
    if (expanded) setRendered(true);
  }, [expanded]);

  return (
    <div
      className="grid transition-[grid-template-rows] duration-[120ms]"
      style={{ gridTemplateRows: expanded ? '1fr' : '0fr', ...style }}
    >
      {/* Collapsed content stays mounted for the animation, and `inert`
          keeps it out of the tab order and the accessibility tree while it
          is: without this every link in a folded section — which on a phone
          is every section — was a hidden tab stop. Cast because React 18's
          types know the attribute only as a boolean. */}
      <div
        className="min-h-0 overflow-hidden"
        {...((expanded ? {} : { inert: '' }) as React.HTMLAttributes<HTMLDivElement>)}
      >
        {rendered && children}
      </div>
    </div>
  );
}
