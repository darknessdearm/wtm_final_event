// ---------------------------------------------------------------------------
// Roster strikethrough — "Npc - Alive if Dead".
//
// A dead NPC used to render as a redaction bar that hid the name entirely;
// it is now struck through instead, so the name stays readable.
// ---------------------------------------------------------------------------

import type { Character } from './data';

/** A dead NPC's name is struck through; everyone else renders normally. */
export function isCensored(
  character: Pick<Character, 'status' | 'isNpc'>,
): boolean {
  return character.isNpc && character.status === 'dead';
}
