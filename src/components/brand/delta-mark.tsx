/**
 * The DeltaWay mark: a river splitting into a delta, which is what the
 * country is and what the name means.
 *
 * Strokes only, no background — whoever places it supplies the shape, so the
 * same mark works in the round header badge and on a square tile.
 *
 * The same drawing exists as a standalone file at src/app/icon.svg for the
 * browser tab, and inline in src/app/opengraph-image.tsx for the share card,
 * because neither of those can import a React component. If the paths change
 * here, change them in all three.
 */
export function DeltaMark({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
      <g fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        <path d="M50 83V57" />
        <path d="M50 57Q50 42 27 26" />
        <path d="M50 57V20" />
        <path d="M50 57Q50 42 73 26" />
      </g>
    </svg>
  );
}
