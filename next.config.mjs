/** @type {import('next').NextConfig} */

// For GitHub Pages *project* sites the app is served from
// https://<user>.github.io/<repo>/ , so every asset/link needs a `/<repo>`
// prefix. The deploy workflow sets PAGES_BASE_PATH to `/${repo-name}`.
// Locally the variable is empty, so `next dev` serves from `/`.
const basePath = process.env.PAGES_BASE_PATH || '';

const nextConfig = {
  // Emit a fully static site into ./out (required for GitHub Pages).
  output: 'export',
  basePath,
  // Expose the base path to client components (e.g. for building links).
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  // GitHub Pages can't run the Next.js image optimizer.
  images: { unoptimized: true },
  // Serve /route/ as /route/index.html — friendlier for static hosting.
  trailingSlash: true,
};

export default nextConfig;
