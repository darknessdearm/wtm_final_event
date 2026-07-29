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
        //
        // countdown's bounds were tightened from clamp(1.75rem, 7vw, 6rem):
        // at 0.15em tracking-term, the un-abbreviated string ("20 Days 23
        // Hours 59 Minute left") is wider than its container at literally
        // every breakpoint from 375px to 1440px+ — the old bounds left the
        // text ~15-24% wider than the space it sits in, tracking or no
        // tracking. See tracking-countdown below for the matching fix.
        countdown: ['clamp(1.375rem, 6vw, 5.5rem)', { lineHeight: '1.1' }],
        window: ['clamp(1.125rem, 3.4vw, 4rem)', { lineHeight: '1.2' }],
        log: ['clamp(0.75rem, 1.9vw, 2.25rem)', { lineHeight: '1.2' }],
        panel: ['clamp(0.875rem, 1.6vw, 1.75rem)', { lineHeight: '1.6' }],
        roster: ['clamp(0.75rem, 1.1vw, 1.25rem)', { lineHeight: '1.7' }],
      },
      letterSpacing: {
        term: '0.15em',
        // A lighter tracking just for the countdown (see fontSize.countdown
        // above) — 0.15em on a ~30-character nowrap string doesn't fit its
        // container at any width, so the countdown gets its own smaller
        // value instead of the page-wide term tracking.
        countdown: '0.05em',
      },
    },
  },
  plugins: [],
};

export default config;
