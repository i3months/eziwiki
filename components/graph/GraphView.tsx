'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { bounds, layout, type LayoutEdge, type LayoutNode } from '@/lib/graph/layout';
import { useStrings } from '@/components/providers/StringsProvider';
import { format } from '@/lib/i18n/format';

/**
 * Renders the document link graph as an interactive SVG.
 *
 * The layout is computed once from a deterministic seed, so the graph looks the
 * same on every visit — a graph that rearranges itself each time is hard to
 * build any familiarity with. Hovering a node dims everything it is not
 * connected to, which is the only practical way to read a dense graph.
 */

/** A node as supplied by the server. */
export interface GraphViewNode {
  path: string;
  title: string;
  url: string;
  degree: number;
}

interface GraphViewProps {
  nodes: GraphViewNode[];
  edges: LayoutEdge[];
  /**
   * Positions computed ahead of time. The layout is O(N²) per iteration and
   * ran in the browser on every visit — eight seconds of blocked main thread
   * at a thousand pages — so the whole-site graph computes it once, during
   * the build, and passes it in. A small graph may leave it out.
   */
  positions?: LayoutNode[];
  /** Page to mark as the one being read, when the graph is centred on one */
  activePath?: string;
  /** Height utility class; the default suits a full page of its own */
  heightClass?: string;
}

/** Nominal layout area; the SVG viewBox scales the result to fit. */
const AREA = { width: 900, height: 640 };

/** Node radius bounds, interpolated by link count. */
const MIN_RADIUS = 5;
const MAX_RADIUS = 14;

export function GraphView({
  nodes,
  edges,
  activePath,
  heightClass = 'h-[70vh]',
  positions: precomputed,
}: GraphViewProps) {
  const router = useRouter();
  const [hovered, setHovered] = useState<string | null>(null);
  const t = useStrings();

  const positions = useMemo(() => {
    const settled =
      precomputed ??
      layout(
        nodes.map((node) => node.path),
        edges,
        AREA,
      );

    return new Map(settled.map((node) => [node.id, node]));
  }, [nodes, edges, precomputed]);

  // Neighbours per node, built once: scanning every edge on every hover was
  // fine at fifty links and not at fifteen thousand.
  const neighbours = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      const set = map.get(a) ?? new Set<string>();
      set.add(b);
      map.set(a, set);
    };
    for (const edge of edges) {
      add(edge.from, edge.to);
      add(edge.to, edge.from);
    }
    return map;
  }, [edges]);

  const box = useMemo(() => bounds([...positions.values()]), [positions]);

  const maxDegree = useMemo(() => Math.max(1, ...nodes.map((node) => node.degree)), [nodes]);

  /** Paths connected to the hovered node, including itself. */
  const connected = useMemo(() => {
    if (!hovered) return null;

    return new Set<string>([hovered, ...(neighbours.get(hovered) ?? [])]);
  }, [hovered, neighbours]);

  if (nodes.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-gray-500 dark:text-gray-400">{t.graphEmpty}</p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900">
      <svg
        viewBox={`${box.x} ${box.y} ${box.width} ${box.height}`}
        className={`${heightClass} w-full`}
        // `group`, not `img`: an image's children are presentational, so the
        // focusable nodes inside were pruned from the accessibility tree and
        // a keyboard reader tabbed through stops that announced nothing.
        role="group"
        aria-label={format(t.graphLabel, { pages: nodes.length, links: edges.length })}
      >
        <g>
          {edges.map((edge, index) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;

            const active = !connected || (connected.has(edge.from) && connected.has(edge.to));

            return (
              <line
                key={`${edge.from}->${edge.to}-${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                className="stroke-gray-300 dark:stroke-gray-700"
                strokeWidth={active ? 1.4 : 0.6}
                opacity={active ? 0.9 : 0.15}
              />
            );
          })}
        </g>

        <g>
          {nodes.map((node) => {
            const position = positions.get(node.path);
            if (!position) return null;

            const radius =
              MIN_RADIUS + (MAX_RADIUS - MIN_RADIUS) * Math.sqrt(node.degree / maxDegree);
            const active = !connected || connected.has(node.path);
            const isCurrent = node.path === activePath;

            return (
              <g
                key={node.path}
                transform={`translate(${position.x}, ${position.y})`}
                opacity={active ? 1 : 0.2}
                className="cursor-pointer"
                onMouseEnter={() => setHovered(node.path)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(node.path)}
                onBlur={() => setHovered(null)}
                onClick={() => router.push(node.url)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(node.url);
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={node.title}
              >
                <circle
                  r={isCurrent ? radius + 2 : radius}
                  className={
                    isCurrent
                      ? // The page being read is filled solid rather than tinted,
                        // so it is findable in its own neighbourhood at a glance.
                        'fill-blue-600 stroke-white dark:fill-blue-400 dark:stroke-gray-900'
                      : hovered === node.path
                        ? 'fill-blue-500 stroke-white dark:stroke-gray-900'
                        : 'fill-blue-400/80 stroke-white dark:fill-blue-500/70 dark:stroke-gray-900'
                  }
                  strokeWidth={1.5}
                />
                <text
                  y={radius + 12}
                  textAnchor="middle"
                  className={`pointer-events-none text-[11px] ${
                    isCurrent
                      ? 'fill-gray-900 font-semibold dark:fill-gray-100'
                      : 'fill-gray-700 dark:fill-gray-300'
                  }`}
                >
                  {node.title}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
