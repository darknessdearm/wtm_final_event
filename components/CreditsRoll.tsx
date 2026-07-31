"use client";

import type { CSSProperties } from "react";
import { censorWidthCh, isCensored } from "@/lib/censor";
import { type Character, type CharacterStatus } from "@/lib/data";

// Fate accents. These do not interpolate with --decay: the roster sits below
// the red gradient's transparent zone and reads the same in both scenes.
const STATUS_ACCENT: Record<CharacterStatus, string> = {
  alive: "text-fate-alive",
  dead: "text-fate-dead",
  lost: "text-fate-lost",
};

function CreditLine({ character }: { character: Character }) {
  // "Npc - Alive if Dead, will censor": a dead NPC's name is redacted, with a
  // bar whose width tracks the hidden name so redactions vary in length.
  if (isCensored(character)) {
    return (
      <li className="py-[3px] text-panel">
        <span
          aria-label="censored"
          className="inline-block bg-scene-censor align-middle"
          style={{ width: `${censorWidthCh(character.name)}ch`, height: "1em" }}
        />
      </li>
    );
  }

  const accent = character.isNpc
    ? "text-fate-npc"
    : STATUS_ACCENT[character.status];

  return <li className={`py-[3px] text-panel ${accent}`}>{character.name}</li>;
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
    <ul
      aria-hidden={ariaHidden}
      className={ariaHidden ? "credits-dup" : undefined}
    >
      {characters.map((c) => (
        <CreditLine key={`${keyPrefix}-${c.id}`} character={c} />
      ))}
    </ul>
  );
}

/**
 * One scrolling column of the survival list. The track holds two identical
 * copies and animates by -50% (exactly one copy's height), so the wrap is
 * invisible. Hover pauses it, and `prefers-reduced-motion` turns it into a
 * plain scrollable list (see the `.credits-*` rules in app/globals.css).
 */
export default function CreditsRoll({
  characters,
  durationSec,
  className = "",
  columnIndex,
  columnCount,
}: {
  characters: Character[];
  durationSec?: number;
  className?: string;
  /** 0-based position of this column, paired with `columnCount` to build a
   *  distinct aria-label (e.g. "Survival list column 1 of 3"). Omit for the
   *  generic label. */
  columnIndex?: number;
  columnCount?: number;
}) {
  // Scale the loop length with the cast so density stays readable; ~0.9s per
  // name, floored so short columns don't whip past.
  const duration =
    durationSec ?? Math.max(40, Math.round(characters.length * 0.9));
  const trackStyle = { "--credits-duration": `${duration}s` } as CSSProperties;
  // The roster is a single column now, so the plain label is the usual one.
  // The indexed form stays for a multi-column layout, where each viewport needs
  // to be distinguishable.
  const label =
    columnIndex !== undefined && columnCount !== undefined
      ? `Survival list column ${columnIndex + 1} of ${columnCount}`
      : "Survival list";

  return (
    <div
      tabIndex={0}
      aria-label={label}
      className={`credits-viewport group relative overflow-hidden focus:outline-none focus-visible:ring-1 focus-visible:ring-scene-rule ${className}`}
    >
      <div
        className="animate-credits flex flex-col will-change-transform group-hover:[animation-play-state:paused]"
        style={trackStyle}
      >
        <CreditList characters={characters} keyPrefix="a" />
        <CreditList characters={characters} keyPrefix="b" ariaHidden />
      </div>
    </div>
  );
}
