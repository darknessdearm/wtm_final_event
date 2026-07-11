// Circular event emblem, drawn inline as SVG so it needs no image asset
// (and therefore no basePath juggling on GitHub Pages). Swap for a real logo
// later by dropping an <img> in here.
export default function Emblem({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label="WTM event emblem"
      className={className}
    >
      <circle cx="50" cy="50" r="48" className="fill-neutral-900" />
      <circle
        cx="50"
        cy="50"
        r="44"
        className="fill-none stroke-neutral-100"
        strokeWidth="1.5"
      />
      {/* Stylised bird silhouette */}
      <path
        d="M50 26c-6 8-16 11-22 11 5 4 9 5 13 5-7 6-14 8-21 8 9 5 18 4 24 1-3 6-8 10-14 13 12 2 22-3 28-13 6 10 16 15 28 13-6-3-11-7-14-13 6 3 15 4 24-1-7 0-14-2-21-8 4 0 8-1 13-5-6 0-16-3-22-11 0 0-4 6-8 6s-8-6-8-6z"
        className="fill-neutral-100"
      />
      <text
        x="50"
        y="82"
        textAnchor="middle"
        className="fill-neutral-100"
        fontSize="11"
        fontWeight="700"
        letterSpacing="2"
      >
        WTM
      </text>
    </svg>
  );
}
