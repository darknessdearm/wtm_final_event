import { describe, expect, it } from 'vitest';
import { isCensored } from '@/lib/censor';
import {
  getMockCharacters,
  roleFor,
  NPC_ROLE,
  PLAYER_ROLE,
  STATUS_SHORT_LABEL,
} from '@/lib/data';

// Two ways into the roster, with different rules:
//   seeded  -> NPC, alive or dead only, dead ones censored
//   player  -> submits the form, never an NPC, may also be "lost" (Missing)
// This file pins the seeded half; the player half is enforced on write by
// components/SubmitBar.tsx and database.rules.json.

describe('the seeded roster', () => {
  const roster = getMockCharacters();

  it('is entirely NPCs', () => {
    expect(roster.length).toBeGreaterThan(100);
    expect(roster.every((c) => c.isNpc)).toBe(true);
  });

  it('never carries the player-only "lost" status', () => {
    // "lost" (Missing) is reserved for names submitted through the form.
    expect(roster.some((c) => c.status === 'lost')).toBe(false);
    expect(new Set(roster.map((c) => c.status))).toEqual(
      new Set(['alive', 'dead']),
    );
  });

  it('censors exactly its dead NPCs', () => {
    const censored = roster.filter(isCensored);
    expect(censored).toEqual(roster.filter((c) => c.status === 'dead'));
    // Sanity floor/ceiling: the roll should read as a mix, not as all bars or
    // all names. If NPC_DEAD_RATE is retuned, this range is what it must stay
    // inside for the credits roll to still look like a cast list.
    const ratio = censored.length / roster.length;
    expect(ratio).toBeGreaterThan(0.2);
    expect(ratio).toBeLessThan(0.6);
  });

  it('carries the cast role, never the player one', () => {
    // role follows the same split as isNpc: the seeded cast are extras, and
    // only submissions through the form are players.
    expect(roster.every((c) => c.role === NPC_ROLE)).toBe(true);
    expect(roster.some((c) => c.role === PLAYER_ROLE)).toBe(false);
  });

  it('has unique names and stable ids', () => {
    expect(new Set(roster.map((c) => c.name)).size).toBe(roster.length);
    expect(new Set(roster.map((c) => c.id)).size).toBe(roster.length);
  });

  it('is deterministic across calls, so the static export matches the seed', () => {
    expect(getMockCharacters()).toEqual(roster);
  });
});

describe('roleFor', () => {
  it('maps the two sides of the roster to their roles', () => {
    expect(roleFor(true)).toBe(NPC_ROLE);
    expect(roleFor(false)).toBe(PLAYER_ROLE);
  });

  it('keeps the two roles distinct', () => {
    expect(NPC_ROLE).not.toBe(PLAYER_ROLE);
  });
});

describe('STATUS_SHORT_LABEL', () => {
  it('labels all three player statuses, with lost shown as Missing', () => {
    expect(STATUS_SHORT_LABEL).toEqual({
      alive: 'Alive',
      dead: 'Dead',
      lost: 'Missing',
    });
  });
});
