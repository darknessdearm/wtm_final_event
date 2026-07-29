// ---------------------------------------------------------------------------
// Roster redaction — "Npc - Alive if Dead, will censor".
// ---------------------------------------------------------------------------

import type { Character } from './data';

/** A dead NPC's name is redacted; everyone else renders normally. */
export function isCensored(
  character: Pick<Character, 'status' | 'isNpc'>,
): boolean {
  return character.isNpc && character.status === 'dead';
}

/**
 * Width of the redaction bar, in `ch` units, derived from the hidden name so
 * bars vary in length the way they do in the mockups. Clamped so a two-letter
 * name still reads as a redaction and a long one never overflows its column.
 */
export function censorWidthCh(name: string): number {
  return Math.min(18, Math.max(6, name.trim().length));
}
