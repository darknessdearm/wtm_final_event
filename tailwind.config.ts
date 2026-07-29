import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Scene colours interpolate with --decay (see app/globals.css).
        // Never use Tailwind opacity modifiers on these — the `/50` syntax
        // does not work with bare var() colour values.
        scene: {
          DEFAULT: 'var(--c-text)',
          dim: 'var(--c-text-dim)',
          glow: 'var(--c-glow)',
          rule: 'var(--c-rule)',
          censor: 'var(--c-censor)',
        },
        fate: {
          alive: 'var(--c-alive)',
          dead: 'var(--c-dead)',
          lost: 'var(--c-lost)',
          npc: 'var(--c-npc)',
        },
      },
      fontFamily: {
        // VT323 has no Thai glyphs, so Prompt always follows it in the stack.
        term: ['var(--font-vt323)', 'var(--font-prompt)', 'monospace'],
        sans: ['var(--font-prompt)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Fluid equivalents of the fixed sizes on the 1920px Figma canvas.
        countdown: ['clamp(1.75rem, 7vw, 6rem)', { lineHeight: '1.1' }],
        window: ['clamp(1.125rem, 3.4vw, 4rem)', { lineHeight: '1.2' }],
        log: ['clamp(0.75rem, 1.9vw, 2.25rem)', { lineHeight: '1.2' }],
        panel: ['clamp(0.875rem, 1.6vw, 1.75rem)', { lineHeight: '1.6' }],
        roster: ['clamp(0.75rem, 1.1vw, 1.25rem)', { lineHeight: '1.7' }],
      },
      letterSpacing: {
        term: '0.15em',
      },
    },
  },
  plugins: [],
};

export default config;
