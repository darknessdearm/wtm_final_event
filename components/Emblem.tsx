// Placeholder logo: a plain black circle with the "WTM" wordmark. Drawn inline
// as SVG so it needs no image asset (and no basePath juggling on GitHub Pages).
// Swap for the real logo later by dropping an <img> in here.
export default function Emblem({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="WTM logo"
      className={className}
    >
      <circle cx="50" cy="50" r="48" className="fill-neutral-900" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-neutral-100"
        fontSize="20"
        fontWeight="700"
        letterSpacing="1"
      >
        WTM
      </text>
    </svg>
  );
}
