import { describe, expect, it } from 'vitest';
import { findPlayerKey } from '@/lib/firebase';
import { intoColumns, upsertByName } from '@/lib/roster';
import { sameName } from '@/lib/validateName';
import { NPC_ROLE, PLAYER_ROLE, type Character } from '@/lib/data';

// Re-submitting a name changes that player's status instead of adding a second
// line for them. findPlayerKey drives the live path (lib/firebaseClient.ts) and
// upsertByName the offline one; both must agree, especially on refusing to
// match a seeded NPC.

describe('sameName', () => {
  it('ignores surrounding whitespace and case', () => {
    expect(sameName('  john smith ', 'John Smith')).toBe(true);
    expect(sameName('ERIN GIVER', 'Erin Giver')).toBe(true);
  });

  it('still separates genuinely different names', () => {
    expect(sameName('John Smith', 'John Smyth')).toBe(false);
    expect(sameName('John', 'John Smith')).toBe(false);
  });

  it('does not collapse interior whitespace', () => {
    // "John  Smith" is a different string a person would want kept distinct
    // from "John Smith"; only the ends are trimmed.
    expect(sameName('John  Smith', 'John Smith')).toBe(false);
  });
});

describe('findPlayerKey', () => {
  const node = {
    c000: { name: 'Elias Reed', status: 'alive', isNpc: true },
    c001: { name: 'Dorian Foster', status: 'dead', isNpc: true },
    '-Oy1': { name: 'John Smith', status: 'alive', isNpc: false },
    '-Oy2': { name: 'Somchai', status: 'lost', isNpc: false },
  };

  it('finds an existing player regardless of case or padding', () => {
    expect(findPlayerKey(node, 'john smith')).toBe('-Oy1');
    expect(findPlayerKey(node, '  John Smith  ')).toBe('-Oy1');
  });

  it('returns null for a name nobody has submitted', () => {
    expect(findPlayerKey(node, 'Nobody At All')).toBeNull();
  });

  it('never matches a seeded NPC', () => {
    // Otherwise the public form could take over a name from the cast, or flip
    // a struck-through NPC back to alive by guessing it.
    expect(findPlayerKey(node, 'Elias Reed')).toBeNull();
    expect(findPlayerKey(node, 'Dorian Foster')).toBeNull();
  });

  it('survives a malformed or empty node', () => {
    expect(findPlayerKey(null, 'John Smith')).toBeNull();
    expect(findPlayerKey({}, 'John Smith')).toBeNull();
    expect(findPlayerKey({ x: null }, 'John Smith')).toBeNull();
    expect(findPlayerKey({ x: { name: 42 } }, 'John Smith')).toBeNull();
  });
});

describe('intoColumns', () => {
  // The column count changes with the viewport (3 desktop / 2 tablet / 1
  // mobile), so the split has to hold for every count — losing or repeating a
  // name at one breakpoint would be easy to miss on a scrolling list.
  const cast = Array.from({ length: 115 }, (_, i) => ({
    id: `c${i}`,
    name: `Name ${i}`,
    role: NPC_ROLE,
    status: 'alive' as const,
    isNpc: true,
  }));

  for (const count of [1, 2, 3]) {
    it(`keeps every character exactly once across ${count} column(s)`, () => {
      const columns = intoColumns(cast, count);
      expect(columns).toHaveLength(count);

      const flat = columns.flat();
      expect(flat).toHaveLength(cast.length);
      // Order preserved, nothing dropped, nothing duplicated.
      expect(flat.map((c) => c.id)).toEqual(cast.map((c) => c.id));
    });
  }

  it('balances columns, leaving only the last one short', () => {
    const [a, b, c] = intoColumns(cast, 3);
    expect(a).toHaveLength(39);
    expect(b).toHaveLength(39);
    expect(c).toHaveLength(37);
  });

  it('handles an empty roster and a nonsensical count', () => {
    expect(intoColumns([], 3).every((c) => c.length === 0)).toBe(true);
    expect(intoColumns(cast, 0)).toEqual([cast]);
  });
});

describe('upsertByName', () => {
  const npc: Character = {
    id: 'c000',
    name: 'Elias Reed',
    role: NPC_ROLE,
    status: 'alive',
    isNpc: true,
  };
  const player: Character = {
    id: '-Oy1',
    name: 'John Smith',
    role: PLAYER_ROLE,
    status: 'alive',
    isNpc: false,
  };
  const roster = [npc, player];

  const submission = (name: string, status: Character['status']): Character => ({
    id: `submitted-${name}`,
    name,
    role: PLAYER_ROLE,
    status,
    isNpc: false,
  });

  it('replaces the status of a name already on the roster', () => {
    const next = upsertByName(roster, submission('John Smith', 'dead'));
    expect(next).toHaveLength(2);
    expect(next[1].status).toBe('dead');
  });

  it('keeps the original position and spelling', () => {
    const next = upsertByName(roster, submission('  JOHN SMITH ', 'lost'));
    expect(next).toHaveLength(2);
    // Still second, still spelled the way it was first submitted.
    expect(next[1].name).toBe('John Smith');
    expect(next[1].status).toBe('lost');
  });

  it('prepends a name that is not on the roster yet', () => {
    const entry = submission('Someone New', 'alive');
    const next = upsertByName(roster, entry);
    expect(next).toHaveLength(3);
    expect(next[0]).toBe(entry);
  });

  it('adds rather than hijacking when the name belongs to an NPC', () => {
    const next = upsertByName(roster, submission('Elias Reed', 'dead'));
    expect(next).toHaveLength(3);
    // The NPC is untouched; the player gets their own line.
    expect(next.find((c) => c.isNpc)?.status).toBe('alive');
  });

  it('does not mutate the roster it was given', () => {
    const before = JSON.stringify(roster);
    upsertByName(roster, submission('John Smith', 'dead'));
    expect(JSON.stringify(roster)).toBe(before);
  });
});
