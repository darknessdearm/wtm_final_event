// Brand logo, served from /public/logo.svg. On GitHub Pages *project* sites the
// app is served from /<repo>, so the src needs the configured base path prefix
// (empty locally). Images are unoptimized (see next.config.mjs), so a plain
// <img> is the right tool here rather than next/image.
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function Emblem({ className = '' }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${BASE_PATH}/logo.svg`}
      alt="WTM logo"
      className={className}
    />
  );
}
