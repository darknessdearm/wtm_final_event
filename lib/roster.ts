// ---------------------------------------------------------------------------
// Roster mutation.
//
// The offline mirror of what submitCharacter() does against the database, so
// the unconfigured build behaves the same way the live one does rather than
// growing duplicates the live site would have merged.
// ---------------------------------------------------------------------------

import type { Character } from './data';
import { sameName } from './validateName';

/**
 * Apply a submission to a roster held in memory.
 *
 * A name already on the roster has its status replaced in place, keeping its
 * position and stored spelling. Anything else is prepended, matching where a
 * new push ID sorts in the live list.
 *
 * Seeded NPCs are skipped when matching, mirroring findPlayerKey(): the form
 * must never be able to take over a name from the cast.
 */
export function upsertByName(
  roster: Character[],
  entry: Character,
): Character[] {
  const index = roster.findIndex(
    (character) => !character.isNpc && sameName(character.name, entry.name),
  );

  if (index === -1) return [entry, ...roster];

  const next = roster.slice();
  next[index] = { ...next[index], status: entry.status };
  return next;
}
