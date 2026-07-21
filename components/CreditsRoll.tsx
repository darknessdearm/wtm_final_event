'use client';

import type { CSSProperties } from 'react';
import {
  STATUS_SHORT_LABEL,
  type Character,
  type CharacterStatus,
} from '@/lib/data';

// Name colour per fate — same accents the old roster columns used, tuned to
// read on the near-black credits "screen".
const STATUS_ACCENT: Record<CharacterStatus, string> = {
  survived: 'text-emerald-300',
  dead: 'text-red-300',
  missing: 'text-amber-300',
};

function CreditLine({ character }: { character: Character }) {
  return (
    <li className="px-2 py-[3px] text-center text-sm leading-relaxed sm:py-1 sm:text-base">
      <span className={`font-medium ${STATUS_ACCENT[character.status]}`}>
        {character.name}
      </span>{' '}
      <span className="text-[10px] tracking-wide text-neutral-500 sm:text-xs">
        {STATUS_SHORT_LABEL[character.status]}
      </span>
    </li>
  );
}

function CreditList({
  characters,
  keyPrefix,
  ariaHidden = false,
}: {
  characters: Character[];
  keyPrefix: string;
  ariaHidden?: boolean;
}) {
  return (
    <ul aria-hidden={ariaHidden} className={ariaHidden ? 'credits-dup' : undefined}>
      {characters.map((c) => (
        <CreditLine key={`${keyPrefix}-${c.id}`} character={c} />
      ))}
    </ul>
  );
}

/**
 * Movie end-credits roll: every character scrolls bottom-to-top on a seamless
 * loop. The track holds two identical copies of the list and animates by
 * -50% (exactly one copy's height), so the wrap is invisible. Hover pauses it,
 * and `prefers-reduced-motion` turns it into a plain scrollable list instead
 * (see the `.credits-*` rules in app/globals.css).
 */
export default function CreditsRoll({
  characters,
  durationSec,
  className = '',
}: {
  characters: Character[];
  durationSec?: number;
  /** Extra classes for the viewport — e.g. `flex-1` to fill a full-screen column. */
  className?: string;
}) {
  // Scale the loop length with the cast so density stays readable; ~0.7s per
  // name, floored so short lists don't whip past.
  const duration = durationSec ?? Math.max(40, Math.round(characters.length * 0.7));
  const trackStyle = { '--credits-duration': `${duration}s` } as CSSProperties;

  return (
    <div
      className={`credits-viewport group relative overflow-hidden rounded-lg bg-neutral-900 ring-1 ring-black/40 ${className}`}
    >
      {/* Cinematic fade at the top and bottom edges. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-neutral-900 to-transparent sm:h-16" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-neutral-900 to-transparent sm:h-16" />

      {/* Scrolling track: two identical copies → seamless infinite loop. */}
      <div
        className="animate-credits flex flex-col text-neutral-100 will-change-transform group-hover:[animation-play-state:paused]"
        style={trackStyle}
      >
        <CreditList characters={characters} keyPrefix="a" />
        <CreditList characters={characters} keyPrefix="b" ariaHidden />
      </div>
    </div>
  );
}
