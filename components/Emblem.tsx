// The Murrwood town seal at the top of the page, served from
// /public/assets/murrwood_logo_white.svg. On GitHub Pages *project* sites the
// app is served from /<repo>, so the src needs the configured base path prefix
// (empty locally). Images are unoptimized (see next.config.mjs), so a plain
// <img> is the right tool here rather than next/image.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Emblem({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/assets/murrwood_logo_white.svg`}
      alt="Town of Murrwood seal"
      className={className}
    />
  );
}
