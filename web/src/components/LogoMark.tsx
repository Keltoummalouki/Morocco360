/**
 * EventHub pictorial mark — a ticket whose diagonal perforation carries two
 * linked nodes: the "hub" idea (events connected to people) cut into the
 * ticket itself.
 *
 * The negative space is a real knock-out (SVG mask), not white paint, so the
 * mark keeps its shape on any ground — light surface, dark surface, or a photo.
 * The colour follows `--primary` by default, which keeps it readable in both
 * themes; pass an explicit `color` when placing it on a dark image.
 */

/* Ticket silhouette: rounded rect with a semicircular notch bitten out of each
   side. Drawn in a 100 x 60 box; `size` below is the rendered height. */
const TICKET =
  'M11 0H89A11 11 0 0 1 100 11V22A8 8 0 0 0 100 38V49A11 11 0 0 1 89 60H11A11 11 0 0 1 0 49V38A8 8 0 0 0 0 22V11A11 11 0 0 1 11 0Z';

/* The mask geometry is identical for every instance, so a fixed id is safe:
   nav + footer both emit it and the browser resolves to the first, which is
   the same shape. A generated id would break SSR (no useId in a Server
   Component) or force this static SVG into a client bundle. */
const MASK_ID = 'eh-mark-cut';

export default function LogoMark({
  size = 34,
  color = 'var(--primary)',
  className,
}: {
  /** Rendered height in px; width follows the mark's 5:3 ratio. */
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={(size * 5) / 3}
      height={size}
      viewBox="0 0 100 60"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <mask id={MASK_ID}>
          {/* white keeps, black cuts */}
          <rect width="100" height="60" fill="#fff" />
          <g fill="#000" stroke="#000" strokeWidth="3.4" strokeLinecap="round">
            {/* perforation running corner to corner */}
            <path d="M60.5 -6 41.5 66" />
            {/* the two linked nodes, straddling the perforation */}
            <path d="M42.3 20.4 62.9 38.2" />
            <circle cx="42.3" cy="20.4" r="8.4" stroke="none" />
            <circle cx="62.9" cy="38.2" r="8.4" stroke="none" />
          </g>
        </mask>
      </defs>

      <path d={TICKET} fill={color} mask={`url(#${MASK_ID})`} />
    </svg>
  );
}
